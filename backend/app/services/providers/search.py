import re
from dataclasses import dataclass
from time import perf_counter
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.services.utils import parse_datetime

# 對應各 region 的搜尋語言設定
_REGION_LANG: dict[str, str] = {
    "Taiwan": "zh-TW",
    "China": "zh-CN",
    "Japan": "ja",
    "Korea": "ko",
    "USA": "en",
    "Germany": "de",
    "Israel": "en",
    "UK": "en",
}

_REGION_ALIASES: dict[str, str] = {
    "tw": "Taiwan",
    "taiwan": "Taiwan",
    "台灣": "Taiwan",
    "臺灣": "Taiwan",
    "cn": "China",
    "china": "China",
    "中國": "China",
    "jp": "Japan",
    "japan": "Japan",
    "kr": "Korea",
    "korea": "Korea",
    "us": "USA",
    "usa": "USA",
    "united states": "USA",
    "uk": "UK",
    "united kingdom": "UK",
}

_COMPANY_FULL_NAMES: dict[str, str] = {
    "GSEO": "Genius Electronic Optical",
    "WNC": "Wistron NeWeb",
    "HESAI": "Hesai Technology",
    "ROBOSENSE": "RoboSense Technology",
    "PRIMAX": "Primax Electronics",
    "CHICONY": "Chicony Electronics",
    "GOERTEK": "Goertek",
    "YOUNG OPTICS": "Young Optics",
    "ASIA OPTICAL": "Asia Optical",
    "O-FILM": "O-Film Tech",
    "TONG HSING": "Tong Hsing Electronic",
    "WIN SEMI": "Win Semiconductors",
    "JORJIN": "Jorjin Technologies",
    "LUXSHARE": "Luxshare-ICT",
    "SUNNY OPTICAL": "Sunny Optical Technology",
}

_REGION_PRIORITY_DOMAINS: dict[str, list[str]] = {
    "Taiwan": [
        "cnyes.com",
        "moneydj.com",
        "ctee.com.tw",
        "udn.com",
        "money.udn.com",
        "digitimes.com",
        "digitimes.com.tw",
        "technews.tw",
        "eettaiwan.com",
    ],
    "China": [
        "36kr.com",
        "kr-asia.com",
        "caixin.com",
        "cls.cn",
    ],
}

_HIRING_PRIORITY_DOMAINS: dict[str, list[str]] = {
    "Taiwan": ["jobs.104.com.tw", "104.com.tw", "linkedin.com"],
    "China": ["linkedin.com", "liepin.com", "zhaopin.com"],
    "USA": ["linkedin.com", "indeed.com"],
    "UK": ["linkedin.com", "indeed.com"],
}


def _extract_names(company_name: str) -> tuple[str | None, str]:
    """從 '玉晶光 (GSEO)' 提取中文名稱與英文縮寫。
    Returns: (chinese_part, english_part)
    """
    match = re.search(r'\(([^)]+)\)', company_name)
    english = match.group(1).strip() if match else company_name.strip()
    chinese = re.sub(r'\s*\(.*?\)', '', company_name).strip() if match else ""
    return chinese or None, english


def _normalize_region(region: str) -> str:
    key = (region or "").strip()
    if not key:
        return ""
    return _REGION_ALIASES.get(key.lower(), key)


def _quote_terms(terms: list[str]) -> str:
    quoted = [f'"{term.strip()}"' for term in terms if term and term.strip()]
    return " OR ".join(quoted)


def _build_company_aliases(company_name: str) -> list[str]:
    chinese_name, english_name = _extract_names(company_name)
    aliases: list[str] = []
    if chinese_name:
        aliases.append(chinese_name)
    if english_name:
        aliases.append(english_name)
    if english_name:
        expanded = _COMPANY_FULL_NAMES.get(english_name.upper())
        if expanded:
            aliases.append(expanded)

    deduped: list[str] = []
    seen: set[str] = set()
    for alias in aliases:
        key = alias.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(alias.strip())
    return deduped


@dataclass
class SearchResultItem:
    title: str
    url: str
    snippet: str
    source_name: str | None
    published_at: str | None
    provider: str
    latency_ms: int
    fallback_used: bool


class TavilySearchProvider:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = "https://api.tavily.com/search"

    def _source_name(self, url: str) -> str:
        netloc = urlparse(url).netloc
        return netloc.replace("www.", "")

    def _do_search(
        self,
        query: str,
        lookback_days: int,
        max_results: int,
        topic: str = "news",
        include_domains: list[str] | None = None,
    ) -> tuple[list[dict], int]:
        """執行一次 Tavily 搜尋，回傳 (results_list, latency_ms)。"""
        payload: dict = {
            "api_key": self.settings.tavily_api_key,
            "query": query,
            # advanced 讓 Tavily 讀文章正文而非 snippet boilerplate
            "search_depth": "advanced",
            "max_results": max_results,
            "topic": topic,
            "time_range": "month" if lookback_days <= 31 else "year",
            "include_raw_content": False,
        }
        if include_domains:
            payload["include_domains"] = include_domains
        started = perf_counter()
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(self.base_url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        latency_ms = int((perf_counter() - started) * 1000)
        return data.get("results", []), latency_ms

    def search_company_signals(
        self,
        company_name: str,
        keywords: list[str],
        lookback_days: int,
        max_results: int,
        region: str = "",
    ) -> list[SearchResultItem]:
        if not self.settings.tavily_api_key:
            raise RuntimeError("TAVILY_API_KEY is required for market radar search.")

        normalized_region = _normalize_region(region)
        aliases = _build_company_aliases(company_name)
        company_clause = _quote_terms(aliases)
        if not company_clause:
            company_clause = f'"{company_name.strip()}"'

        keyword_clause = _quote_terms(keywords) or '"optical" OR "photonics"'
        signal_terms_en = '"capex" OR "capital expenditure" OR "expansion" OR "investment" OR "hiring" OR "npi" OR "new product" OR "mass production"'
        signal_terms_zh = (
            '"擴產" OR "增資" OR "投資" OR "招募" OR "徵才" OR "新品" OR "新產品" '
            'OR "量產" OR "法說會" OR "產能" OR "接單" OR "資本支出"'
        )
        hiring_terms_en = '"hiring" OR "recruiting" OR "jobs" OR "careers" OR "headcount" OR "talent acquisition"'
        hiring_terms_zh = '"徵才" OR "招募" OR "職缺" OR "人才招募" OR "擴編" OR "擴大招募" OR "履歷"'

        queries: list[tuple[str, str, list[str] | None, int]] = []
        local_domains = _REGION_PRIORITY_DOMAINS.get(normalized_region)
        has_local_query = False

        # 台灣/中國帳戶先跑中文與在地來源；可明顯降低「同產業但非目標公司」雜訊。
        if local_domains:
            has_local_query = True
            local_max = max(3, max_results)
            queries.append(
                (
                    f"({company_clause}) AND ({signal_terms_zh})",
                    "general",
                    local_domains,
                    local_max,
                )
            )
            queries.append(
                (
                    f"({company_clause}) AND ({keyword_clause})",
                    "general",
                    local_domains,
                    max(3, max_results // 2),
                )
            )

        # 全域新聞當補強，不做主路徑。
        fallback_max = max(2, max_results // 2) if has_local_query else max_results
        fallback_topic = "news" if _REGION_LANG.get(normalized_region, "en").startswith("en") else "general"
        queries.append(
            (
                f"({company_clause}) AND ({keyword_clause}) AND ({signal_terms_en} OR {signal_terms_zh})",
                fallback_topic,
                None,
                fallback_max,
            )
        )
        if has_local_query:
            # 最後保底：公司名 + 在地來源，避免關鍵字過嚴導致完全無結果。
            queries.append(
                (
                    f"({company_clause})",
                    "general",
                    local_domains,
                    2,
                )
            )

        hiring_domains = _HIRING_PRIORITY_DOMAINS.get(normalized_region, ["linkedin.com"])
        queries.append(
            (
                f"({company_clause}) AND ({hiring_terms_en} OR {hiring_terms_zh})",
                "general",
                hiring_domains,
                max(3, max_results // 2),
            )
        )
        if "104.com.tw" in hiring_domains or "jobs.104.com.tw" in hiring_domains:
            queries.append(
                (
                    f"({company_clause}) AND (\"104人力銀行\" OR \"工作機會\" OR \"職缺\" OR \"徵才\")",
                    "general",
                    ["104.com.tw", "jobs.104.com.tw"],
                    max(3, max_results // 2),
                )
            )
            queries.append(
                (
                    f"({company_clause}) AND ({hiring_terms_zh} OR {hiring_terms_en}) AND (site:104.com.tw/job OR site:jobs.104.com.tw/job)",
                    "general",
                    ["104.com.tw", "jobs.104.com.tw"],
                    max(4, max_results),
                )
            )
        queries.append(
            (
                f"({company_clause}) AND ({hiring_terms_en} OR {hiring_terms_zh}) AND site:linkedin.com/jobs/view",
                "general",
                ["linkedin.com"],
                max(3, max_results // 2),
            )
        )

        # 合併兩次搜尋，依 URL 去重
        seen_urls: set[str] = set()
        results: list[SearchResultItem] = []
        total_latency = 0

        for query, topic, domains, query_max in queries:
            try:
                raw_items, latency_ms = self._do_search(
                    query, lookback_days, query_max,
                    topic=topic, include_domains=domains,
                )
                total_latency += latency_ms
                for item in raw_items:
                    url = item.get("url") or ""
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    title = item.get("title") or ""
                    snippet = item.get("content") or ""
                    published_raw = item.get("published_date")
                    published_at = parse_datetime(published_raw)
                    results.append(
                        SearchResultItem(
                            title=title,
                            url=url,
                            snippet=snippet,
                            source_name=self._source_name(url) if url else None,
                            published_at=published_at.isoformat() if published_at else None,
                            provider="TAVILY",
                            latency_ms=total_latency,
                            fallback_used=False,
                        )
                    )
            except httpx.HTTPStatusError:
                # 其中一個查詢失敗，繼續另一個
                continue

        # Return a wider candidate pool; downstream market_radar will rank/filter and cap.
        candidate_cap = max(max_results * 4, 12)
        return results[:candidate_cap]
