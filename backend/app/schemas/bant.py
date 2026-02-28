from datetime import datetime

from pydantic import BaseModel, Field


class BANTScoreRequest(BaseModel):
    account_id: int
    lookback_days: int = Field(default=60, ge=7, le=365)


class BANTScoreResponse(BaseModel):
    scorecard_id: int
    account_id: int
    total_score: int
    grade: str
    recommended_next_action: str
    pipeline_stage: str


class BANTScoreItem(BaseModel):
    id: int
    total_score: int
    grade: str
    budget_score: int
    authority_score: int
    need_score: int
    timeline_score: int
    recommended_next_action: str
    created_at: datetime


class BANTScoreListResponse(BaseModel):
    account_id: int
    items: list[BANTScoreItem]

