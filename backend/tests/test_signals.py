from datetime import UTC, datetime

from sqlalchemy import func, select

from app.core.config import get_settings
from app.models import SignalEvent
from app.services.market_radar import (
    build_hiring_summary,
    classify_signal_type,
    has_hiring_detail_signal,
    is_hiring_job_url,
    is_relevant_to_company,
    signal_strength,
)
from app.services.providers.search import SearchResultItem, TavilySearchProvider


def test_signals_scan_writes_events(client, db_session, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "news.example.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="CapEx expansion for AR line",
                url="https://news.example.com/capex",
                snippet="Test Optical Co announces capex investment and NPI ramp for optical module production line.",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=120,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)

    response = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["events_created"] >= 1

    total = db_session.execute(select(func.count(SignalEvent.id))).scalar_one()
    assert total >= 1


def test_get_signals_by_account(client, seeded_contact, db_session):
    db_session.add(
        SignalEvent(
            account_id=seeded_contact["account_id"],
            signal_type="CAPEX",
            signal_strength=88,
            event_date=datetime.now(UTC).date(),
            summary="CapEx expansion signal",
            evidence_url="https://signals.example.com/capex",
            source_name="signals.example.com",
            source_published_at=datetime.now(UTC),
            fetched_at=datetime.now(UTC),
        )
    )
    db_session.commit()

    response = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["account_id"] == seeded_contact["account_id"]
    assert len(payload["items"]) >= 1
    assert "search_provider" in payload["items"][0]


def test_signals_scan_applies_summary_cleaning(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "news.example.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Optics line update",
                url="https://news.example.com/update",
                snippet="Sign In Home Subscribe Cookie policy. Test Optical Co confirms capex plan for AR module line. Read more.",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=88,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    summary = list_resp.json()["items"][0]["summary"].lower()
    assert "sign in" not in summary
    assert "cookie" not in summary


def test_signals_scan_filters_irrelevant_industry_news(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "news.example.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Japan's TDK acquires SoftEye",
                url="https://news.example.com/tdk",
                snippet="TDK acquired a US smart glasses startup to expand technology portfolio.",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=88,
                fallback_used=False,
            ),
            SearchResultItem(
                title="Test Optical Co expands AR module capacity",
                url="https://news.example.com/test-optical-capex",
                snippet="Test Optical Co confirms new capex and hiring plan for AR optical module production.",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=88,
                fallback_used=False,
            ),
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["evidence_url"] == "https://news.example.com/test-optical-capex"


def test_tavily_search_prefers_local_domains_for_tw(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "tavily_api_key", "test-key")

    calls: list[dict] = []

    def fake_do_search(self, query, lookback_days, max_results, topic="news", include_domains=None):  # noqa: ANN001
        calls.append(
            {
                "query": query,
                "lookback_days": lookback_days,
                "max_results": max_results,
                "topic": topic,
                "include_domains": include_domains,
            }
        )
        return [], 5

    monkeypatch.setattr(TavilySearchProvider, "_do_search", fake_do_search)

    provider = TavilySearchProvider()
    provider.search_company_signals(
        company_name="玉晶光 (GSEO)",
        keywords=["AR", "optical module"],
        lookback_days=90,
        max_results=8,
        region="TW",
    )

    assert len(calls) >= 2
    assert calls[0]["topic"] == "general"
    assert calls[0]["include_domains"] is not None
    assert "ctee.com.tw" in calls[0]["include_domains"]
    assert '"玉晶光"' in calls[0]["query"]


def test_tavily_search_includes_hiring_domains_for_tw(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "tavily_api_key", "test-key")

    calls: list[dict] = []

    def fake_do_search(self, query, lookback_days, max_results, topic="news", include_domains=None):  # noqa: ANN001
        calls.append(
            {
                "query": query,
                "include_domains": include_domains,
            }
        )
        return [], 5

    monkeypatch.setattr(TavilySearchProvider, "_do_search", fake_do_search)

    provider = TavilySearchProvider()
    provider.search_company_signals(
        company_name="玉晶光 (GSEO)",
        keywords=["AR", "optical module"],
        lookback_days=90,
        max_results=8,
        region="TW",
    )

    hiring_calls = [item for item in calls if item["include_domains"] and "linkedin.com" in item["include_domains"]]
    assert hiring_calls
    assert any("104.com.tw" in item["include_domains"] or "jobs.104.com.tw" in item["include_domains"] for item in hiring_calls)
    assert any("徵才" in item["query"] or "hiring" in item["query"] for item in hiring_calls)
    assert any("site:104.com.tw/job" in item["query"] for item in calls)
    assert any("site:linkedin.com/jobs/view" in item["query"] for item in calls)


def test_classify_hiring_signal_with_chinese_job_terms():
    signal_type = classify_signal_type("公司近期擴編，針對光學研發與製程職缺大量徵才。", "https://www.104.com.tw/job/abc")
    assert signal_type == "HIRING"
    assert signal_strength(signal_type, None) >= 70


def test_classify_hiring_signal_from_104_company_page_url():
    signal_type = classify_signal_type("Young Optics 工作機會(12)", "https://www.104.com.tw/company/5votqa0")
    assert signal_type == "HIRING"


def test_company_relevance_requires_company_name_for_104_company_page():
    assert not is_relevant_to_company(
        text="104人力銀行 - 工作機會(12)",
        name_variants=["揚明光", "young optics"],
        url="https://www.104.com.tw/company/5votqa0#info06",
    )


def test_company_relevance_accepts_compact_english_brand_token():
    assert is_relevant_to_company(
        text="YoungOptics Inc.｜徵才中 - 104人力銀行",
        name_variants=["揚明光", "young optics"],
        url="https://www.104.com.tw/company/5votqa0",
    )


def test_scan_accepts_104_hiring_even_if_allowlist_excludes_104(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "digitimes.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Test Optical Co｜徵才中 - 104人力銀行",
                url="https://www.104.com.tw/company/5votqa0",
                snippet="工作機會(12) 採購管理師、光學資深工程師",
                source_name="104.com.tw",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=66,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["signal_type"] == "HIRING"
    assert "104.com.tw/company" in items[0]["evidence_url"]


def test_scan_accepts_104_hiring_with_company_intro_snippet(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "digitimes.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Test Optical Co｜徵才中 - 104人力銀行",
                url="https://www.104.com.tw/company/5votqa0",
                snippet="【徵才職缺】採購管理師、光學工程師【公司簡介】資本額12億。",
                source_name="104.com.tw",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=66,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["signal_type"] == "HIRING"
    assert "104.com.tw/company" in items[0]["evidence_url"]


def test_scan_rejects_wrong_104_company_page_even_if_snippet_mentions_target(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "digitimes.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="德揚科技股份有限公司｜徵才中 - 104人力銀行",
                url="https://www.104.com.tw/company/cpgqw54",
                snippet="德揚科技股份有限公司｜徵才中－104人力銀行 Test Optical Co",
                source_name="104.com.tw",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=66,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    assert len(list_resp.json()["items"]) == 0


def test_hiring_detail_and_summary_extraction_from_104_company_snippet():
    title = "揚明光學股份有限公司_YoungOptics Inc.｜徵才中 - 104人力銀行"
    snippet = "【徵才職缺】採購管理師、光學資深工程師【公司簡介】資本額12億。"
    url = "https://www.104.com.tw/company/5votqa0"
    assert has_hiring_detail_signal(title, snippet, url)
    summary = build_hiring_summary(title, snippet, url)
    assert summary.startswith("職缺重點:")
    assert "採購管理師" in summary


def test_hiring_detail_accepts_104_company_page_with_openings_count_in_title():
    title = "揚明光學股份有限公司_YoungOptics Inc.｜工作機會(12) - 104人力銀行"
    snippet = "104人力銀行 - 公司介紹與徵才資訊。"
    url = "https://www.104.com.tw/company/5votqa0"
    assert has_hiring_detail_signal(title, snippet, url)
    summary = build_hiring_summary(title, snippet, url)
    assert "12" in summary
    assert "職缺" in summary


def test_hiring_detail_rejects_linkedin_company_jobs_page_without_openings():
    title = "Young Optics, Inc. | LinkedIn"
    snippet = "目前沒有職缺。建立職缺配對通知。"
    url = "https://www.linkedin.com/company/youngoptics/jobs/"
    assert not has_hiring_detail_signal(title, snippet, url)


def test_hiring_job_url_detection():
    assert is_hiring_job_url("https://www.104.com.tw/job/8abcde")
    assert is_hiring_job_url("https://www.linkedin.com/jobs/view/123456")


def test_signals_scan_accepts_short_chinese_summary(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "news.example.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Test Optical Co 擴產",
                url="https://news.example.com/tw-capex",
                snippet="Test Optical Co 宣布擴產與增資，啟動新產線。",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=66,
                fallback_used=False,
            )
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert "擴產" in items[0]["summary"]


def test_delete_signal(client, seeded_contact, db_session):
    row = SignalEvent(
        account_id=seeded_contact["account_id"],
        signal_type="CAPEX",
        signal_strength=88,
        event_date=datetime.now(UTC).date(),
        summary="Delete me signal",
        evidence_url="https://signals.example.com/delete-me",
        source_name="signals.example.com",
        source_published_at=datetime.now(UTC),
        fetched_at=datetime.now(UTC),
    )
    db_session.add(row)
    db_session.commit()
    signal_id = row.id

    resp = client.delete(f"/api/v1/signals/{signal_id}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    assert all(item["id"] != signal_id for item in list_resp.json()["items"])


def test_signals_scan_filters_low_value_profile_and_regulatory_posts(client, seeded_contact, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "radar_source_allowlist", "moneydj.com,news.example.com")

    def fake_search(self, company_name, keywords, lookback_days, max_results, region=""):  # noqa: ANN001
        return [
            SearchResultItem(
                title="Test Optical Co - MoneyDJ理財網",
                url="https://www.moneydj.com/kmdj/wiki/wikiviewer.aspx?keyid=abc123",
                snippet="Test Optical Co 公司簡介與基本資料，請參考官方頁面。",
                source_name="moneydj.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=50,
                fallback_used=False,
            ),
            SearchResultItem(
                title="Test Optical Co 資金貸與及背書保證公告",
                url="https://news.example.com/disclosure",
                snippet="依公開發行公司資金貸與及背書保證處理準則第二十二條公告。",
                source_name="news.example.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=50,
                fallback_used=False,
            ),
            SearchResultItem(
                title="Test Optical Co CPO今年拚量產；AI眼鏡多案並進",
                url="https://www.moneydj.com/kmdj/news/newsviewer.aspx?a=8ee730d2",
                snippet="Test Optical Co 表示CPO與AI眼鏡案持續推進，今年目標量產出貨。",
                source_name="moneydj.com",
                published_at=datetime.now(UTC).isoformat(),
                provider="TAVILY",
                latency_ms=50,
                fallback_used=False,
            ),
        ]

    monkeypatch.setattr(TavilySearchProvider, "search_company_signals", fake_search)
    scan_resp = client.post(
        "/api/v1/signals/scan",
        json={
            "account_ids": [seeded_contact["account_id"]],
            "lookback_days": 90,
            "max_results_per_account": 8,
            "use_tavily": True,
        },
    )
    assert scan_resp.status_code == 200

    list_resp = client.get(f"/api/v1/signals/accounts/{seeded_contact['account_id']}")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert "newsviewer.aspx" in items[0]["evidence_url"]
