from datetime import date, datetime

from pydantic import BaseModel, Field


class SignalScanRequest(BaseModel):
    account_ids: list[int] = Field(default_factory=list, min_length=1)
    lookback_days: int = Field(default=90, ge=1, le=365)
    max_results_per_account: int = Field(default=8, ge=1, le=20)
    use_tavily: bool = True


class SignalScanResponse(BaseModel):
    job_id: str
    accounts_processed: int
    events_created: int
    status: str


class SignalEventItem(BaseModel):
    id: int
    account_id: int
    signal_type: str
    signal_strength: int
    event_date: date | None
    summary: str
    evidence_url: str
    source_name: str | None
    source_published_at: datetime | None
    search_provider: str | None
    search_latency_ms: int | None
    search_fallback_used: bool
    fetched_at: datetime


class SignalEventListResponse(BaseModel):
    account_id: int
    items: list[SignalEventItem]
