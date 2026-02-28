from datetime import datetime

from pydantic import BaseModel, Field


class OutreachGenerateRequest(BaseModel):
    contact_id: int
    channel: str = Field(pattern="^(EMAIL|LINKEDIN)$")
    intent: str = Field(pattern="^(FIRST_TOUCH|FOLLOW_UP|REPLY)$")
    tone: str = Field(default="TECHNICAL", pattern="^(TECHNICAL|CONSULTATIVE|EXECUTIVE)$")
    llm_provider_preference: list[str] = Field(default_factory=lambda: ["GEMINI", "OPENAI"])


class OutreachGenerateResponse(BaseModel):
    draft_id: int
    model_provider: str
    status: str


class OutreachStatusPatchRequest(BaseModel):
    status: str = Field(pattern="^(DRAFT|APPROVED|REJECTED)$")


class OutreachDraftItem(BaseModel):
    id: int
    contact_id: int
    channel: str
    intent: str
    subject: str | None
    body: str
    cta: str
    tone: str
    model_provider: str
    llm_latency_ms: int | None
    llm_token_usage: int | None
    llm_fallback_used: bool
    status: str
    created_at: datetime


class OutreachDraftListResponse(BaseModel):
    contact_id: int
    items: list[OutreachDraftItem]
