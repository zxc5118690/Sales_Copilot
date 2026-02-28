from datetime import datetime

from pydantic import BaseModel, Field

VALID_DOC_TYPES = {"earnings_call", "analyst_report", "internal_note", "customer_email", "market_intel"}


class KnowledgeDocCreateRequest(BaseModel):
    account_id: int | None = None
    scope: str = Field(default="global", pattern="^(global|account)$")
    doc_type: str
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    source_url: str | None = None
    tags: str | None = None
    created_by: str | None = None


class KnowledgeDocUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str | None = None
    source_url: str | None = None
    tags: str | None = None
    doc_type: str | None = None


class KnowledgeDocItem(BaseModel):
    id: int
    account_id: int | None
    scope: str
    doc_type: str
    title: str
    content: str
    source_url: str | None
    tags: str | None
    created_by: str | None
    created_at: datetime
    updated_at: datetime


class KnowledgeDocListResponse(BaseModel):
    items: list[KnowledgeDocItem]
    total: int
