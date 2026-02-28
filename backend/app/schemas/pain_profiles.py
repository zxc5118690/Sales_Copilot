from datetime import datetime

from pydantic import BaseModel, Field


class PainGenerateRequest(BaseModel):
    account_id: int
    persona_targets: list[str] = Field(default_factory=lambda: ["RD", "NPI"])
    max_items: int = Field(default=3, ge=1, le=8)
    # HITL: 業務員手動勾選的訊號 IDs（None 表示使用全部訊號）
    signal_ids: list[int] | None = None
    # HITL: {str(signal_id): 業務員備註}
    user_annotations: dict[str, str] | None = None


class PainGenerateResponse(BaseModel):
    account_id: int
    created_count: int
    provider_used: str


class PainProfileUpdateRequest(BaseModel):
    persona: str | None = None
    pain_statement: str | None = None
    business_impact: str | None = None
    technical_anchor: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class PainProfileItem(BaseModel):
    id: int
    account_id: int
    persona: str
    pain_statement: str
    business_impact: str
    technical_anchor: str
    confidence: float
    evidence_ref: str | None
    model_provider: str | None
    llm_latency_ms: int | None
    llm_token_usage: int | None
    llm_fallback_used: bool
    created_at: datetime


class PainProfileListResponse(BaseModel):
    account_id: int
    items: list[PainProfileItem]
