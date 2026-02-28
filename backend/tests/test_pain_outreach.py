import json
from datetime import UTC, datetime

from app.models import PainProfile, SignalEvent
from app.services.providers.llm import LLMResult, LLMRouter


def test_generate_pain_profiles(client, db_session, seeded_contact, monkeypatch):
    now = datetime.now(UTC)
    signal = SignalEvent(
        account_id=seeded_contact["account_id"],
        signal_type="HIRING",
        signal_strength=82,
        event_date=now.date(),
        summary="NPI optical validation hiring expansion.",
        evidence_url="https://example.com/signal",
        source_name="Example News",
        source_published_at=now,
        search_provider="TAVILY",
        search_latency_ms=120,
        search_fallback_used=0,
        fetched_at=now,
    )
    db_session.add(signal)
    db_session.commit()

    def fake_generate(self, system_prompt, user_prompt, preferred_order=None):  # noqa: ANN001
        payload = {
            "items": [
                {
                    "persona": "RD",
                    "pain_statement": "AA yield unstable",
                    "business_impact": "Higher scrap",
                    "technical_anchor": "alignment precision",
                    "confidence": 0.82,
                    "evidence_signal_ids": [signal.id],
                    "reasoning": "Hiring for optical validation indicates process instability risk.",
                }
            ]
        }
        return LLMResult(
            provider="GEMINI",
            latency_ms=87,
            token_usage=222,
            text=json.dumps(payload),
        )

    monkeypatch.setattr(LLMRouter, "generate", fake_generate)

    response = client.post(
        "/api/v1/pain-profiles/generate",
        json={"account_id": seeded_contact["account_id"], "persona_targets": ["RD"], "max_items": 2},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["created_count"] >= 1
    assert payload["provider_used"] == "GEMINI"

    list_response = client.get(f"/api/v1/pain-profiles/accounts/{seeded_contact['account_id']}")
    assert list_response.status_code == 200
    list_payload = list_response.json()
    assert list_payload["account_id"] == seeded_contact["account_id"]
    assert len(list_payload["items"]) >= 1
    assert list_payload["items"][0]["model_provider"] == "GEMINI"
    evidence = json.loads(list_payload["items"][0]["evidence_ref"])
    assert evidence["signal_ids"] == [signal.id]
    assert evidence["evidence"][0]["signal_id"] == signal.id


def test_generate_pain_profiles_requires_signals(client, seeded_contact, monkeypatch):
    def fake_generate(self, system_prompt, user_prompt, preferred_order=None):  # noqa: ANN001
        return LLMResult(
            provider="GEMINI",
            latency_ms=87,
            token_usage=222,
            text='{"items":[{"persona":"RD","pain_statement":"AA yield unstable","business_impact":"Higher scrap","technical_anchor":"alignment precision","confidence":0.82}]}',
        )

    monkeypatch.setattr(LLMRouter, "generate", fake_generate)

    response = client.post(
        "/api/v1/pain-profiles/generate",
        json={"account_id": seeded_contact["account_id"], "persona_targets": ["RD"], "max_items": 2},
    )
    assert response.status_code == 400
    assert "先到「市場訊號」分頁掃描" in response.json()["detail"]


def test_update_and_delete_pain_profile(client, db_session, seeded_contact):
    now = datetime.now(UTC)
    row = PainProfile(
        account_id=seeded_contact["account_id"],
        persona="RD",
        pain_statement="Original pain.",
        business_impact="Original impact.",
        technical_anchor="Original anchor.",
        confidence=0.66,
        evidence_ref=None,
        created_at=now,
    )
    db_session.add(row)
    db_session.commit()
    pain_id = row.id

    patch_resp = client.patch(
        f"/api/v1/pain-profiles/{pain_id}",
        json={
            "persona": "NPI",
            "pain_statement": "Updated pain",
            "business_impact": "Updated impact",
            "technical_anchor": "Updated anchor",
            "confidence": 0.74,
        },
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["persona"] == "NPI"
    assert patch_resp.json()["pain_statement"] == "Updated pain"
    assert patch_resp.json()["confidence"] == 0.74

    delete_resp = client.delete(f"/api/v1/pain-profiles/{pain_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"

    list_resp = client.get(f"/api/v1/pain-profiles/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    assert all(item["id"] != pain_id for item in list_resp.json()["items"])


def test_generate_outreach(client, db_session, seeded_contact, monkeypatch):
    now = datetime.now(UTC)
    db_session.add(
        PainProfile(
            account_id=seeded_contact["account_id"],
            persona="RD",
            pain_statement="Wavefront distortion in module assembly.",
            business_impact="Yield loss and delayed NPI.",
            technical_anchor="AA calibration and inline optical inspection.",
            confidence=0.8,
            evidence_ref=None,
            created_at=now,
        )
    )
    db_session.commit()

    def fake_generate(self, system_prompt, user_prompt, preferred_order=None):  # noqa: ANN001
        return LLMResult(
            provider="GEMINI",
            latency_ms=101,
            token_usage=333,
            text='{"subject":"Optical yield benchmark","body":"We can help stabilize AA yield.","cta":"Can we schedule a 20-min call?"}',
        )

    monkeypatch.setattr(LLMRouter, "generate", fake_generate)

    response = client.post(
        "/api/v1/outreach/generate",
        json={
            "contact_id": seeded_contact["contact_id"],
            "channel": "EMAIL",
            "intent": "FIRST_TOUCH",
            "tone": "TECHNICAL",
            "llm_provider_preference": ["GEMINI", "OPENAI"],
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "DRAFT"
    assert payload["model_provider"] == "GEMINI"

    drafts_response = client.get(f"/api/v1/outreach/contacts/{seeded_contact['contact_id']}")
    assert drafts_response.status_code == 200
    drafts_payload = drafts_response.json()
    assert drafts_payload["contact_id"] == seeded_contact["contact_id"]
    assert len(drafts_payload["items"]) >= 1
    assert drafts_payload["items"][0]["llm_latency_ms"] == 101

    draft_id = drafts_payload["items"][0]["id"]
    patch_response = client.patch(f"/api/v1/outreach/{draft_id}/status", json={"status": "APPROVED"})
    assert patch_response.status_code == 200
    assert patch_response.json()["status"] == "APPROVED"
