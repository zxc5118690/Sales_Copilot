def test_interaction_to_bant_to_pipeline_and_weekly(client, seeded_contact):
    account_id = seeded_contact["account_id"]
    contact_id = seeded_contact["contact_id"]

    inbound_summary = (
        "Director approves budget and capex quote for NPI pilot schedule in Q3. "
        "Need better yield, alignment quality, and inspection baseline this month."
    )

    log_response = client.post(
        "/api/v1/interactions/log",
        json={
            "contact_id": contact_id,
            "channel": "EMAIL",
            "direction": "INBOUND",
            "content_summary": inbound_summary,
            "sentiment": "POSITIVE",
        },
    )
    assert log_response.status_code == 200
    assert log_response.json()["pipeline_stage"] in {"ENGAGED", "CONTACTED", "NURTURE"}

    bant_response = client.post("/api/v1/bant/score", json={"account_id": account_id, "lookback_days": 60})
    assert bant_response.status_code == 200
    bant_payload = bant_response.json()
    assert bant_payload["grade"] in {"A", "B", "C"}
    assert bant_payload["total_score"] >= 0

    board_response = client.get("/api/v1/pipeline/board")
    assert board_response.status_code == 200
    board_items = board_response.json()["items"]
    assert any(item["account_id"] == account_id for item in board_items)

    weekly_response = client.get("/api/v1/reports/weekly")
    assert weekly_response.status_code == 200
    weekly_payload = weekly_response.json()
    assert weekly_payload["inbound_count"] >= 1

