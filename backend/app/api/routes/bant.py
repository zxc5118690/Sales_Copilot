from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import BANTScorecard, PipelineItem
from app.schemas.bant import BANTScoreItem, BANTScoreListResponse, BANTScoreRequest, BANTScoreResponse
from app.services.bant_scorer import BANTScorerService

router = APIRouter(tags=["bant"])


@router.post("/bant/score", response_model=BANTScoreResponse)
def score_bant(payload: BANTScoreRequest, db: Session = Depends(get_db)):
    service = BANTScorerService()
    try:
        scorecard = service.score(db=db, account_id=payload.account_id, lookback_days=payload.lookback_days)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    latest_pipeline = (
        db.execute(
            select(PipelineItem)
            .where(PipelineItem.account_id == payload.account_id)
            .order_by(PipelineItem.updated_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    pipeline_stage = latest_pipeline.stage if latest_pipeline else "UNKNOWN"

    return BANTScoreResponse(
        scorecard_id=scorecard.id,
        account_id=scorecard.account_id,
        total_score=scorecard.total_score,
        grade=scorecard.grade,
        recommended_next_action=scorecard.recommended_next_action,
        pipeline_stage=pipeline_stage,
    )


@router.get("/bant/accounts/{account_id}", response_model=BANTScoreListResponse)
def list_bant_scores(account_id: int, limit: int = Query(default=5, ge=1, le=50), db: Session = Depends(get_db)):
    rows = (
        db.execute(
            select(BANTScorecard)
            .where(BANTScorecard.account_id == account_id)
            .order_by(BANTScorecard.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    items = [
        BANTScoreItem(
            id=row.id,
            total_score=row.total_score,
            grade=row.grade,
            budget_score=row.budget_score,
            authority_score=row.authority_score,
            need_score=row.need_score,
            timeline_score=row.timeline_score,
            recommended_next_action=row.recommended_next_action,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return BANTScoreListResponse(account_id=account_id, items=items)

