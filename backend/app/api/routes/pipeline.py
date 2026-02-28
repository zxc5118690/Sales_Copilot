from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.pipeline import PipelineBoardResponse
from app.schemas.reports import WeeklyReportResponse
from app.services.pipeline_console import PipelineConsoleService

router = APIRouter(tags=["pipeline"])


@router.get("/pipeline/board", response_model=PipelineBoardResponse)
def get_pipeline_board(db: Session = Depends(get_db)):
    service = PipelineConsoleService()
    return PipelineBoardResponse(items=service.board(db=db))


@router.get("/reports/weekly", response_model=WeeklyReportResponse)
def get_weekly_report(db: Session = Depends(get_db)):
    service = PipelineConsoleService()
    return WeeklyReportResponse(**service.weekly_report(db=db))

