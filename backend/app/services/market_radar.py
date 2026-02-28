import logging
import re
from datetime import UTC, timedelta
from urllib.parse import urlparse

import httpx

from sqlalchemy import select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Account, SignalEvent
from app.services.providers.llm import LLMRouter
from app.services.providers.search import TavilySearchProvider
from app.services.utils import now_utc, parse_datetime


KEYWORDS_BY_SEGMENT = {
    "WAFER_FAB": ["CMP", "CVD", "PVD", "ALD", "etch", "lithography", "wafer process", "fab equipment"],
    "INSPECTION_METROLOGY": ["defect review", "in-line inspection", "metrology", "overlay", "CD-SEM", "optical inspection", "yield management"],
    "PACKAGING_TEST": ["advanced packaging", "chiplet", "CoWoS", "Fan-Out", "ATE", "burn-in test", "heterogeneous integration"],
    "FACTORY_AUTOMATION": ["AMR", "AMHS", "fab automation", "OHT", "EFEM", "FOUP handling", "MES", "smart factory"],
    "DISPLAY": ["OLED", "micro LED", "panel inspection", "display module", "array tester"],
    "SEMICON": ["semiconductor equipment", "process control", "yield engineer", "fab expansion"],
}

# 縮寫 → 英文全名對照表（用於過濾時多一個比對維度）
COMPANY_FULL_NAMES: dict[str, str] = {
    "TSMC": "taiwan semiconductor manufacturing",
    "UMC": "united microelectronics",
    "ASE": "ase technology holding",
    "Powertech": "powertech technology",
    "Micron Taiwan": "micron memory taiwan",
    "Foxsemicon": "foxsemicon integrated technology",
    "Innolux": "innolux corporation",
    "AUO": "au optronics",
    "Delta Electronics": "delta electronics inc",
    "Advantech": "advantech co",
    "Himax": "himax technologies",
    "Mediatek": "mediatek inc",
    "Realtek": "realtek semiconductor",
    "Novatek": "novatek microelectronics",
    "Winbond": "winbond electronics",
}

_NOISE_PATTERNS = [
    r"(?i)\b(sign in|subscribe|cookie|privacy policy|terms|home|latest news|rss|podcasts)\b",
    r"(?i)\b(image\s+\d+|print|read more|submit press release)\b",
    r"(?i)\b(opinion|entertainment|lifestyle|videos|weather)\b",
    r"https?://\S+",
    r"\[[^\]]+\]",
    r"\s{2,}",
]

# 側欄 / 頁尾邊界：遇到這些標記就截斷，後面全丟
_SIDEBAR_CUTOFF_RE = re.compile(
    r"延伸閱讀|猜你喜歡|相關文章|相關新聞|相關報導|你可能也想看"
    r"|上一篇|下一篇"
    r"|※\s*歡迎|※\s*本文|※\s*投資"
    r"|###\s*(猜|相關|熱門|推薦|延伸|更多|最新)"
    r"|\bRelated\s+(Stories|Articles|News)\b"
)

# 財經跑馬燈偵測：一個 chunk 若含 2+ 個「數字+單位」就視為 ticker 段落
_TICKER_RE = re.compile(r"\d+[元點億%萬]")

_LATIN_STOPWORDS = {"co", "inc", "corp", "ltd", "limited", "company", "group", "holdings", "the"}
_HIGH_VALUE_TERMS = [
    r"(?i)\b(capex|npi|mass production|launch|order|orders|partnership|earnings|eps|revenue|guidance)\b",
    r"(?i)\b(hiring|recruit|job|jobs|career|careers|headcount|talent acquisition)\b",
    r"(量產|出貨|接單|法說|財報|營收|毛利|獲利|虧損|CPO|AI眼鏡|LiDAR|智慧頭燈|產能|擴產|新產線|合作|訂單|資本支出)",
    r"(徵才|招募|職缺|擴編|人才招募|大量招募)",
]
_LOW_VALUE_TEXT_PATTERNS = [
    r"(公開發行公司資金貸與及背書保證處理準則|資金貸與|背書保證)",
    r"(公司簡介|基本簡介|公司基本資料|百科|維基|wiki)",
]
_LOW_VALUE_URL_PATTERNS = [
    r"moneydj\.com/.*/wiki",
    r"moneydj\.com/.*/wikiviewer",
    r"/company/profile",
    r"104\.com\.tw/company/search",
    r"linkedin\.com/jobs/search",
]

_HIRING_OPENINGS_PATTERNS = [
    r"工作機會\s*\(\s*(\d+)\s*\)",
    r"職缺\s*\(\s*(\d+)\s*\)",
    r"(\d+)\s*個\s*(?:工作機會|職缺)",
    r"(\d+)\s*(?:openings?|jobs?)",
]
_HIRING_ACTIVE_TERMS = ["徵才中", "actively hiring", "hiring now"]
_HIRING_NO_OPENINGS_PATTERNS = [
    r"目前沒有職缺",
    r"沒有職缺",
    r"暫無職缺",
    r"no current openings",
    r"no openings",
    r"no jobs",
]
_SOURCE_QUALITY_BOOST = {
    "moneydj.com": 8,
    "cnyes.com": 8,
    "udn.com": 7,
    "money.udn.com": 7,
    "ctee.com.tw": 7,
    "digitimes.com": 8,
    "digitimes.com.tw": 8,
    "technews.tw": 7,
    "eettaiwan.com": 7,
    "linkedin.com": 10,
    "104.com.tw": 10,
    "jobs.104.com.tw": 10,
}


_104_JD_API = "https://www.104.com.tw/job/ajax/content/{job_id}"
_JINA_READER = "https://r.jina.ai/{url}"

_PAIN_POINT_MAP = [
    (r"(?i)\byield\b|良率|defect rate|缺陷率|CPK|in-line inspection|製程良率", "生產良率優化壓力，需要更精準的製程控制設備"),
    (r"(?i)\bOEE\b|uptime|設備稼動|availability|MTBF|MTTR|預防性維護", "設備稼動率不足，需要預防性維護或升級方案"),
    (r"(?i)throughput|產能|takt.?time|cycle.?time|UPH|產線瓶頸", "產能瓶頸，需要更高效率的自動化設備"),
    (r"(?i)\bAOI\b|defect review|缺陷檢測|視覺檢測|外觀檢驗|SEM inspection", "人工目檢效率低，需要智慧化缺陷檢測解決方案"),
    (r"(?i)advanced.?packaging|CoWoS|chiplet|Fan.?Out|2.5D|3D IC|HBM packaging", "先進封裝製程導入需要新世代量測與檢測設備"),
    (r"(?i)\bautomation\b|自動化|AMR|AMHS|OHT|FOUP|搬送|機械手臂", "人力成本上升，製造現場自動化需求急迫"),
    (r"(?i)\bMES\b|\bSPC\b|process.?control|製程數據|data.?analytics|製程監控", "製程數據分散，缺乏智慧化分析與製程控制工具"),
    (r"(?i)\bEV\b|電動車|automotive|車用半導體|ADAS|功率元件|SiC|GaN", "車用/功率半導體品質要求提升，需要更嚴格的檢測方案"),
    (r"(?i)expand|擴廠|CapEx|新廠|fab.?expansion|資本支出|equipment.?procurement", "廠房擴建需要採購新設備，有明確預算需求"),
    (r"(?i)process.?engineer|yield.?engineer|設備工程師|招募|hiring|人才短缺", "工程師人才短缺，需要減少人工依賴的自動化與智慧化設備"),
    (r"(?i)energy|耗能|碳排|sustainability|ESG|carbon.?neutral|淨零", "ESG壓力下需要更節能高效的製程設備"),
    (r"(?i)\bAI\b|machine.?learning|智慧製造|smart.?factory|數位轉型|Industry.?4", "AI智慧製造應用落地，需要與智慧設備整合的解決方案"),
    (r"(?i)metrology|CD.?SEM|overlay|overlay.?error|量測精度|計量", "量測精度不足，影響製程視窗與良率爬坡"),
    (r"(?i)supply.?chain|供應鏈|lead.?time|交期|採購風險|BOM", "供應鏈管理複雜度上升，需要更穩定的設備供應夥伴"),
]

_EXPANSION_SIGNAL_MAP = [
    (r"(?i)大量招募|actively.?hiring|urgently|多名|複數職缺", "大量擴編"),
    (r"(?i)new.?team|新設部門|新事業|build.*team|建立.*團隊", "新部門成立"),
    (r"(?i)\bdirector\b|VP|副總|事業部.*主管|head of", "高管層擴充"),
    (r"(?i)data.?scient|ML.?engineer|AI.?engineer|AI工程師|資料科學", "AI/數位轉型投資"),
    (r"(?i)business.?develop|BD|市場開發|海外業務|international", "海外市場拓展"),
]

_logger = logging.getLogger(__name__)


def _extract_104_job_id(url: str) -> str | None:
    match = re.search(r"104\.com\.tw/job/([A-Za-z0-9]+)", url or "")
    return match.group(1) if match else None


def _fetch_104_jd(job_id: str) -> str | None:
    api_url = _104_JD_API.format(job_id=job_id)
    try:
        resp = httpx.get(
            api_url,
            headers={"Referer": "https://www.104.com.tw/", "Accept": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        header = data.get("header", {})
        job_detail = data.get("jobDetail", {})
        condition = data.get("condition", {})
        welfare = data.get("welfare", {})
        # 實際欄位名稱：jobDescription（非 jobContent），技能在 condition.skill 陣列
        skill_labels = " ".join(
            s.get("description", "") for s in (condition.get("skill") or []) if s.get("description")
        )
        parts = [
            header.get("jobName", ""),
            (job_detail.get("jobDescription") or "")[:600],
            skill_labels,
            (condition.get("other") or "")[:200],
            (welfare.get("welfare") or "")[:200],
        ]
        text = " ".join(p for p in parts if p).strip()
        return text[:1200] if text else None
    except Exception as exc:
        _logger.debug("104 JD fetch failed for %s: %s", job_id, exc)
        return None


def _fetch_jd_via_jina(url: str) -> str | None:
    jina_url = _JINA_READER.format(url=url)
    try:
        resp = httpx.get(jina_url, timeout=15)
        resp.raise_for_status()
        text = resp.text.strip()
        return text[:2000] if text else None
    except Exception as exc:
        _logger.debug("Jina JD fetch failed for %s: %s", url, exc)
        return None


def _fetch_jd_content(url: str) -> str | None:
    lowered = (url or "").lower()
    if "104.com.tw/job/" in lowered:
        job_id = _extract_104_job_id(url)
        if job_id:
            return _fetch_104_jd(job_id)
    elif "linkedin.com/jobs/view/" in lowered:
        return _fetch_jd_via_jina(url)
    return None


def extract_jd_tech_signals(jd_text: str) -> dict:
    pain_points: list[str] = []
    expansion_signals: list[str] = []
    for pattern, label in _PAIN_POINT_MAP:
        if re.search(pattern, jd_text):
            pain_points.append(label)
    for pattern, label in _EXPANSION_SIGNAL_MAP:
        if re.search(pattern, jd_text):
            expansion_signals.append(label)
    return {
        "pain_points": pain_points,
        "expansion_signals": expansion_signals,
        "has_jd": True,
    }


def classify_signal_type(text: str, source_url: str | None = None) -> str:
    t = text.lower()
    source = (source_url or "").lower()

    hiring_terms = [
        "hiring",
        "recruit",
        "job",
        "jobs",
        "career",
        "careers",
        "headcount",
        "talent acquisition",
        "招募",
        "徵才",
        "職缺",
        "擴編",
        "人才招募",
    ]

    if (
        "linkedin.com/jobs" in source
        or ("linkedin.com/company/" in source and "/jobs" in source)
        or "104.com.tw/job" in source
        or "104.com.tw/company/" in source
    ):
        return "HIRING"
    if any(word in t for word in ["capex", "capital expenditure", "investment", "expansion"]):
        return "CAPEX"
    if any(word in t for word in ["npi", "new product", "launch", "mass production"]):
        return "NPI"
    if any(word in t for word in hiring_terms):
        return "HIRING"
    if any(word in t for word in ["supplier", "supply chain", "partnership"]):
        return "SUPPLY_CHAIN"
    return "EXPANSION"


def signal_strength(signal_type: str, published_at: str | None) -> int:
    weight = {
        "CAPEX": 90,
        "NPI": 80,
        "EXPANSION": 72,
        "SUPPLY_CHAIN": 68,
        "HIRING": 76,
    }.get(signal_type, 60)

    published = parse_datetime(published_at)
    if not published:
        return weight

    age_days = (now_utc() - published.astimezone(UTC)).days
    if age_days > 180:
        return min(weight, 60)
    if age_days > 90:
        return max(weight - 15, 30)
    return weight


def clean_summary(text: str, max_len: int = 360) -> str:
    def _is_informative_chunk(chunk: str) -> bool:
        candidate = chunk.strip(" -|,.;")
        if not candidate:
            return False
        lowered = candidate.lower()
        if lowered in {"policy", "read more", "latest news", "sign in", "home", "subscribe"}:
            return False
        token_count = len(re.findall(r"[A-Za-z0-9\u4e00-\u9fff]", candidate))
        if token_count < 8:
            return False
        # 財經跑馬燈：密集含「數字+元/點/億/%/萬」→ 視為 ticker，丟棄
        if len(_TICKER_RE.findall(candidate)) >= 2:
            return False
        # 長 CJK 段落但無中文句子標點（，。；：）→ 財經跑馬燈（公司名串流），丟棄
        if len(candidate) > 50:
            cjk_count = len(re.findall(r"[\u4e00-\u9fff]", candidate))
            if cjk_count / len(candidate) > 0.4:
                cn_punct = len(re.findall(r"[，。；：]", candidate))
                if cn_punct == 0:
                    return False
        return True

    # 先截斷側欄邊界（延伸閱讀、猜你喜歡、※ 等），保留正文部分
    m = _SIDEBAR_CUTOFF_RE.search(text)
    cleaned = (text[:m.start()] if m else text).replace("\n", " ").strip()
    for pattern in _NOISE_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" -|,.;")
    if not cleaned:
        return ""
    # Select informative sentence-like chunks, not just the first two.
    chunks = re.split(r"(?<=[.!?])\s+", cleaned)
    meaningful = [chunk for chunk in chunks if _is_informative_chunk(chunk)]
    summary = " ".join((meaningful or chunks)[:2]).strip()
    if len(summary) > max_len:
        summary = summary[: max_len - 1].rstrip() + "…"
    return summary


def is_summary_usable(summary: str) -> bool:
    """中文摘要可較短，英文摘要維持較長門檻，避免有效訊號被誤濾。"""
    if not summary:
        return False
    cjk_count = len(re.findall(r"[\u4e00-\u9fff]", summary))
    if cjk_count >= 8:
        return len(summary) >= 20
    return len(summary) >= 40


def is_hiring_summary_usable(summary: str) -> bool:
    if not summary:
        return False
    cjk_count = len(re.findall(r"[\u4e00-\u9fff]", summary))
    if cjk_count >= 4:
        return len(summary) >= 12
    return len(summary) >= 24


def is_junk_url(url: str) -> bool:
    """搜尋頁、標籤頁、分類頁等非文章 URL，內容通常是 UI 導覽文字，直接跳過。"""
    from urllib.parse import urlparse
    parsed = urlparse(url or "")
    path = parsed.path.lower()
    junk_segments = {"/tag/", "/tags/", "/search", "/search/", "/topic/",
                     "/category/", "/categories/", "/keyword/", "/label/"}
    return any(seg in path for seg in junk_segments)


def is_hiring_job_url(url: str) -> bool:
    lowered = (url or "").lower()
    return "104.com.tw/job/" in lowered or "linkedin.com/jobs/view/" in lowered


def _is_english_summary(text: str) -> bool:
    """摘要以英文為主（CJK 字元佔比 < 15%）時回傳 True。"""
    if not text:
        return False
    cjk = len(re.findall(r"[\u4e00-\u9fff\u3040-\u30ff]", text))
    return cjk / max(len(text), 1) < 0.15


def _translate_to_zh_tw(text: str, llm_router: LLMRouter) -> str:
    """將英文摘要翻譯成繁體中文；失敗時 fallback 回原文。"""
    try:
        result = llm_router.generate(
            system_prompt=(
                "你是專業財經科技翻譯。將英文市場訊號摘要翻譯成繁體中文。"
                "保留公司名稱、產品型號、專有名詞原文。"
                "只輸出翻譯結果，不加說明或標點以外的任何額外文字。"
            ),
            user_prompt=text,
        )
        translated = result.text.strip()
        return translated if translated else text
    except Exception as exc:
        _logger.debug("Summary translation failed: %s", exc)
        return text


def is_hiring_company_page_url(url: str) -> bool:
    lowered = (url or "").lower()
    if "104.com.tw/company/" in lowered:
        return True
    if "linkedin.com/company/" in lowered and "/jobs" in lowered:
        return True
    return False


def extract_hiring_openings_count(text: str) -> int | None:
    candidate = (text or "").strip()
    if not candidate:
        return None
    for pattern in _HIRING_OPENINGS_PATTERNS:
        match = re.search(pattern, candidate, flags=re.IGNORECASE)
        if not match:
            continue
        try:
            count = int(match.group(1))
        except (TypeError, ValueError):
            continue
        if count >= 0:
            return count
    return None


def has_hiring_openings_signal(title: str, snippet: str) -> bool:
    combined = f"{title} {snippet}".strip()
    lowered = combined.lower()
    if any(re.search(pattern, lowered, flags=re.IGNORECASE) for pattern in _HIRING_NO_OPENINGS_PATTERNS):
        return False
    openings = extract_hiring_openings_count(combined)
    if openings is not None and openings > 0:
        return True
    if any(term in lowered for term in _HIRING_ACTIVE_TERMS):
        return True
    return False


def has_hiring_detail_signal(title: str, snippet: str, url: str) -> bool:
    combined = f"{title} {snippet}".lower()
    if is_hiring_job_url(url):
        return True
    if has_hiring_openings_signal(title, snippet):
        return True

    detail_terms = [
        "徵才職缺",
        "工作機會",
        "職務內容",
        "工作內容",
        "工作地點",
        "工作待遇",
        "工作經歷",
        "科系要求",
        "job description",
        "responsibilities",
        "requirements",
    ]
    role_terms = [
        "工程師",
        "經理",
        "管理師",
        "專員",
        "technician",
        "engineer",
        "manager",
        "specialist",
    ]
    has_detail = any(term in combined for term in detail_terms)
    has_role = any(term in combined for term in role_terms)
    if has_detail and has_role:
        return True
    # 公司頁若明確標示招募狀態（但尚未抓到職稱），仍保留為弱招募訊號。
    if is_hiring_company_page_url(url) and has_detail and any(term in combined for term in ("工作機會", "職缺", "徵才")):
        return True
    return False


def build_hiring_summary(title: str, snippet: str, url: str, jd_text: str | None = None) -> str:
    if jd_text:
        signals = extract_jd_tech_signals(jd_text)
        # Extract top-3 keyword hits for display
        keywords: list[str] = []
        for pattern, _ in _PAIN_POINT_MAP:
            m = re.search(pattern, jd_text)
            if m:
                keywords.append(m.group(0)[:20])
            if len(keywords) >= 3:
                break
        kw_str = "、".join(keywords) if keywords else "—"
        pp_str = "、".join(signals["pain_points"][:3]) if signals["pain_points"] else "—"
        ex_str = "、".join(signals["expansion_signals"][:2]) if signals["expansion_signals"] else "—"
        base = clean_summary(f"{title}. {snippet}".strip()) or title
        summary = f"{base} | 技術需求: {kw_str} | 潛在痛點: {pp_str} | 擴張訊號: {ex_str}"
        return summary[:300]

    text = (snippet or "").strip()
    match = re.search(r"徵才職缺】(.+?)(?:【公司簡介】|$)", text)
    if match:
        jobs = re.sub(r"\s+", " ", match.group(1)).strip("。;； ")
        if jobs:
            return f"職缺重點: {jobs[:300]}"
    openings = extract_hiring_openings_count(f"{title} {snippet}")
    if openings is not None:
        if openings > 0:
            if "104.com.tw" in (url or "").lower():
                return f"104 顯示目前約有 {openings} 個職缺，建議進一步追蹤職務別與招募節奏。"
            if "linkedin.com" in (url or "").lower():
                return f"LinkedIn 顯示目前約有 {openings} 個職缺，建議追蹤關鍵職務與地區分布。"
            return f"招募頁顯示目前約有 {openings} 個職缺，建議持續追蹤職缺變化。"
        return "招募頁顯示目前無公開職缺。"
    if any(term in f"{title} {snippet}".lower() for term in _HIRING_ACTIVE_TERMS):
        return "招募頁顯示公司正在徵才，建議進一步抓取職缺清單與 JD。"
    return clean_summary(f"{title}. {snippet}".strip())


def is_low_value_signal(title: str, snippet: str, url: str) -> bool:
    text = f"{title} {snippet}"
    for pattern in _LOW_VALUE_TEXT_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return True
    for pattern in _LOW_VALUE_URL_PATTERNS:
        if re.search(pattern, url, flags=re.IGNORECASE):
            return True
    return False


def signal_value_score(title: str, snippet: str, source_name: str | None) -> int:
    score = 0
    title_hits = 0
    snippet_hits = 0
    for pattern in _HIGH_VALUE_TERMS:
        if re.search(pattern, title, flags=re.IGNORECASE):
            title_hits += 1
        if re.search(pattern, snippet, flags=re.IGNORECASE):
            snippet_hits += 1
    score += title_hits * 18
    score += snippet_hits * 10
    if source_name:
        host = source_name.lower().replace("www.", "")
        score += _SOURCE_QUALITY_BOOST.get(host, 0)
    return score


def hiring_priority_bonus(title: str, snippet: str, source_name: str | None, url: str | None) -> int:
    text = f"{title} {snippet}".lower()
    host = (source_name or "").lower().replace("www.", "")
    raw_url = (url or "").lower()

    bonus = 0
    if host in {"linkedin.com", "104.com.tw", "jobs.104.com.tw"}:
        bonus += 24
    if "104.com.tw/company/" in raw_url or "104.com.tw/job/" in raw_url:
        bonus += 16
    if "linkedin.com/company/" in raw_url and "/jobs" in raw_url:
        bonus += 14
    if any(token in text for token in ("徵才", "招募", "職缺", "hiring", "jobs", "careers")):
        bonus += 12
    return bonus


def _parse_allowlist(raw: str) -> list[str]:
    return [item.strip().lower() for item in raw.split(",") if item.strip()]


def _source_host(url: str) -> str:
    return urlparse(url).netloc.lower().replace("www.", "")


def is_priority_hiring_source(url: str) -> bool:
    host = _source_host(url)
    return host == "linkedin.com" or host.endswith(".linkedin.com") or host == "104.com.tw" or host.endswith(".104.com.tw")


def is_allowed_source(url: str, allowlist: list[str]) -> bool:
    if not allowlist:
        return True
    host = _source_host(url)
    return any(host == domain or host.endswith(f".{domain}") for domain in allowlist)


def _extract_name_variants(company_name: str) -> list[str]:
    """從「玉晶光 (GSEO)」提取所有可能的名稱變體（包含英文全名）。"""
    variants: list[str] = []
    # 英文縮寫或名稱 (括號內)
    match = re.search(r'\(([^)]+)\)', company_name)
    abbr = None
    if match:
        abbr = match.group(1).strip()
        variants.append(abbr.lower())
    # 中文部分 (括號前)
    chinese_part = re.sub(r'\s*\(.*?\)', '', company_name).strip()
    if chinese_part:
        variants.append(chinese_part.lower())
    # 查英文全名對照表
    if abbr and abbr in COMPANY_FULL_NAMES:
        variants.append(COMPANY_FULL_NAMES[abbr].lower())
    # 補上完整字串，避免僅有英文全名的客戶漏判
    variants.append(company_name.strip().lower())
    # 完整名稱 fallback
    if not variants:
        variants.append(company_name.strip().lower())
    deduped: list[str] = []
    seen: set[str] = set()
    for variant in variants:
        key = variant.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(key)
    return deduped


def _normalize_latin(text: str) -> str:
    lowered = text.lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def is_relevant_to_company(text: str, name_variants: list[str], url: str | None = None) -> bool:
    """確認文章至少提到公司名稱（含 ticker、中文名或英文全名）。"""
    raw = f"{text or ''} {url or ''}".lower()
    normalized = _normalize_latin(raw)

    for variant in name_variants:
        candidate = (variant or "").strip().lower()
        if not candidate:
            continue

        # 中文名直接子字串比對
        if re.search(r"[\u4e00-\u9fff]", candidate):
            if candidate in raw:
                return True
            continue

        norm_variant = _normalize_latin(candidate)
        if not norm_variant:
            continue
        tokens = [tok for tok in norm_variant.split(" ") if tok]
        if not tokens:
            continue

        # ticker / 短縮寫採字界比對，避免字串部分重疊造成誤判
        if len(tokens) == 1 and len(tokens[0]) <= 6:
            pat = rf"(?<![a-z0-9]){re.escape(tokens[0])}(?![a-z0-9])"
            if re.search(pat, raw):
                return True
            continue

        phrase = " ".join(tokens)
        if phrase in normalized:
            return True
        compact_phrase = phrase.replace(" ", "")
        compact_normalized = normalized.replace(" ", "")
        if len(compact_phrase) >= 8 and compact_phrase in compact_normalized:
            return True

        meaningful = [tok for tok in tokens if tok not in _LATIN_STOPWORDS and len(tok) >= 3]
        if len(meaningful) >= 2 and all(
            re.search(rf"(?<![a-z0-9]){re.escape(tok)}(?![a-z0-9])", normalized)
            for tok in meaningful[:3]
        ):
            return True

    return False


def rank_signal_for_top20(signal: SignalEvent) -> tuple[float, float, float]:
    published = signal.source_published_at
    if not published:
        recency = 0
    else:
        recency = max(0.0, 180.0 - (now_utc() - published.astimezone(UTC)).days)
    # Primary by score, secondary by recency, tertiary by latest fetch.
    fetched_ts = signal.fetched_at.timestamp() if signal.fetched_at else 0.0
    return (float(signal.signal_strength), recency, fetched_ts)


class MarketRadarService:
    def __init__(self) -> None:
        self.search_provider = TavilySearchProvider()
        self.llm_router = LLMRouter()
        settings = get_settings()
        self.allowlist = _parse_allowlist(settings.radar_source_allowlist)

    def scan(
        self,
        db: Session,
        account_ids: list[int],
        lookback_days: int,
        max_results_per_account: int,
        use_tavily: bool,
    ) -> int:
        if not use_tavily:
            raise ValueError("Market radar requires Tavily. Set use_tavily=true.")

        accounts = db.execute(select(Account).where(Account.id.in_(account_ids))).scalars().all()
        if not accounts:
            return 0

        created_count = 0
        for account in accounts:
            keywords = KEYWORDS_BY_SEGMENT.get(account.segment, ["semiconductor", "equipment", "manufacturing"])
            name_variants = _extract_name_variants(account.company_name)
            results = self.search_provider.search_company_signals(
                company_name=account.company_name,
                keywords=keywords,
                lookback_days=lookback_days,
                max_results=max_results_per_account,
                region=account.region or "",
            )
            # 先依商務價值排序，再做入庫；避免低價值結果佔掉名額。
            ranked_results = sorted(
                results,
                key=lambda item: (
                    signal_value_score(item.title, item.snippet, item.source_name)
                    + hiring_priority_bonus(item.title, item.snippet, item.source_name, item.url)
                ),
                reverse=True,
            )
            cutoff = now_utc() - timedelta(days=lookback_days)
            accepted_for_account = 0
            for item in ranked_results:
                if accepted_for_account >= max_results_per_account:
                    break
                # 確認文章確實提到目標公司，過濾掉產業大盤新聞
                combined_text = f"{item.title} {item.snippet}"
                signal_type = classify_signal_type(combined_text, item.url)
                # 招募訊號允許來自 104 / LinkedIn，即使外部 allowlist 未設定這些 domain。
                if is_junk_url(item.url):
                    continue
                if not is_allowed_source(item.url, self.allowlist) and not (
                    signal_type == "HIRING" and is_priority_hiring_source(item.url)
                ):
                    continue
                if not is_relevant_to_company(combined_text, name_variants, item.url):
                    continue
                if signal_type == "HIRING" and is_hiring_company_page_url(item.url):
                    # 對公司頁採更嚴格校驗：標題必須命中目標公司，避免被「瀏覽紀錄/推薦公司」污染。
                    if not is_relevant_to_company(item.title, name_variants):
                        continue
                if signal_type == "HIRING" and not has_hiring_detail_signal(item.title, item.snippet, item.url):
                    continue
                # 104 / LinkedIn 職缺頁常包含「公司簡介」字樣，不應被低價值規則誤刪。
                if is_low_value_signal(item.title, item.snippet, item.url) and not (
                    signal_type == "HIRING" and is_priority_hiring_source(item.url)
                ):
                    continue
                strength = signal_strength(signal_type, item.published_at)
                published_at = parse_datetime(item.published_at)
                if published_at and published_at < cutoff:
                    continue
                jd_text = None
                if signal_type == "HIRING" and is_hiring_job_url(item.url):
                    jd_text = _fetch_jd_content(item.url)
                    if jd_text:
                        _logger.info("JD fetched for %s (%d chars)", item.url, len(jd_text))
                    else:
                        _logger.debug("JD fetch returned nothing for %s", item.url)
                summary = (
                    build_hiring_summary(item.title, item.snippet, item.url, jd_text)
                    if signal_type == "HIRING"
                    else clean_summary(f"{item.title}. {item.snippet}".strip())
                )
                if signal_type == "HIRING":
                    if not is_hiring_summary_usable(summary):
                        continue
                elif not is_summary_usable(summary):
                    continue
                if _is_english_summary(summary):
                    summary = _translate_to_zh_tw(summary, self.llm_router)

                stmt = sqlite_insert(SignalEvent).values(
                    account_id=account.id,
                    signal_type=signal_type,
                    signal_strength=strength,
                    event_date=published_at.date() if published_at else None,
                    summary=summary[:1200],
                    evidence_url=item.url,
                    source_name=item.source_name,
                    source_published_at=published_at,
                    search_provider=item.provider,
                    search_latency_ms=item.latency_ms,
                    search_fallback_used=1 if item.fallback_used else 0,
                    fetched_at=now_utc(),
                )
                stmt = stmt.on_conflict_do_update(
                    index_elements=["account_id", "evidence_url"],
                    set_={
                        "signal_type": signal_type,
                        "signal_strength": strength,
                        "summary": summary[:1200],
                        "source_name": item.source_name,
                        "source_published_at": published_at,
                        "search_provider": item.provider,
                        "search_latency_ms": item.latency_ms,
                        "search_fallback_used": 1 if item.fallback_used else 0,
                        "fetched_at": now_utc(),
                    },
                )
                db.execute(stmt)
                created_count += 1
                accepted_for_account += 1
        db.commit()
        return created_count
