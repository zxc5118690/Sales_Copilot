from datetime import datetime

from pydantic import BaseModel, Field



class InteractionLogRequest(BaseModel):
    contact_id: int
    channel: str = Field(pattern="^(EMAIL|LINKEDIN|MEETING|CALL)$")
    direction: str = Field(pattern="^(OUTBOUND|INBOUND)$")
    content_summary: str = Field(min_length=3, max_length=4000)
    sentiment: str | None = Field(default=None, pattern="^(POSITIVE|NEUTRAL|NEGATIVE)$")
    raw_ref: str | None = None
    occurred_at: datetime | None = None


class InteractionLogResponse(BaseModel):
    interaction_id: int
    account_id: int
    pipeline_stage: str
    status: str


class InteractionLogListItem(BaseModel):
    id: int
    contact_id: int
    contact_name: str | None = None
    channel: str
    direction: str
    content_summary: str
    sentiment: str | None = None
    raw_ref: str | None = None
    occurred_at: datetime

    class Config:
        from_attributes = True


class InteractionLogListResponse(BaseModel):
    items: list[InteractionLogListItem]

