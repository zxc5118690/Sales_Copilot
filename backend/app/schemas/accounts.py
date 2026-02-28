from datetime import datetime

from pydantic import BaseModel, Field


class AccountImportItem(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    segment: str = Field(min_length=2, max_length=32)
    region: str | None = Field(default=None, max_length=128)
    website: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default="api_import", max_length=128)
    priority_tier: str | None = Field(default="T3", max_length=8)


class AccountImportRequest(BaseModel):
    items: list[AccountImportItem] = Field(min_length=1)


class AccountImportResponse(BaseModel):
    status: str
    inserted: int
    updated: int
    total_rows: int


class AccountCreateRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    segment: str = Field(min_length=2, max_length=32)
    region: str | None = Field(default=None, max_length=128)
    website: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=128)
    priority_tier: str | None = Field(default="T3", max_length=8)


class AccountUpdateRequest(BaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    segment: str | None = Field(default=None, min_length=2, max_length=32)
    region: str | None = Field(default=None, max_length=128)
    website: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=128)
    priority_tier: str | None = Field(default=None, max_length=8)


class AccountResponse(BaseModel):
    id: int
    company_name: str
    segment: str
    region: str | None
    website: str | None
    source: str | None
    priority_tier: str | None
    created_at: datetime
    updated_at: datetime


class AccountListResponse(BaseModel):
    items: list[AccountResponse]
