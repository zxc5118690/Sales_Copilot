from datetime import date

from pydantic import BaseModel


class PipelineBoardItem(BaseModel):
    account_id: int
    company_name: str
    stage: str
    probability: float
    due_date: date
    owner: str
    next_action: str
    blocker: str | None
    latest_bant_grade: str | None
    latest_bant_score: int | None


class PipelineBoardResponse(BaseModel):
    items: list[PipelineBoardItem]

