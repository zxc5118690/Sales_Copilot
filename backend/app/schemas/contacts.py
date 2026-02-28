from datetime import datetime

from pydantic import BaseModel, Field


class ContactCreateRequest(BaseModel):
    account_id: int
    full_name: str | None = Field(default=None, max_length=255)
    role_title: str | None = Field(default=None, max_length=255)
    channel_email: str | None = Field(default=None, max_length=255)
    channel_linkedin: str | None = Field(default=None, max_length=500)
    contactability_score: int | None = Field(default=None, ge=0, le=100)


class ContactUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    role_title: str | None = Field(default=None, max_length=255)
    channel_email: str | None = Field(default=None, max_length=255)
    channel_linkedin: str | None = Field(default=None, max_length=500)
    contactability_score: int | None = Field(default=None, ge=0, le=100)


class ContactResponse(BaseModel):
    id: int
    account_id: int
    full_name: str | None
    role_title: str | None
    channel_email: str | None
    channel_linkedin: str | None
    contactability_score: int | None
    created_at: datetime


class ContactListResponse(BaseModel):
    items: list[ContactResponse]

