from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Contact, InteractionLog
from app.schemas.interactions import (
    InteractionLogListItem,
    InteractionLogListResponse,
    InteractionLogRequest,
    InteractionLogResponse,
)
from app.services.interaction_logger import InteractionLoggerService

router = APIRouter(tags=["interactions"])


@router.get("/interactions/accounts/{account_id}", response_model=InteractionLogListResponse)
def list_interactions_by_account(account_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(InteractionLog, Contact.full_name)
        .join(Contact, InteractionLog.contact_id == Contact.id)
        .where(Contact.account_id == account_id)
        .order_by(InteractionLog.occurred_at.desc())
    )
    rows = db.execute(stmt).all()
    items = [
        InteractionLogListItem(
            id=log.id,
            contact_id=log.contact_id,
            contact_name=name,
            channel=log.channel,
            direction=log.direction,
            content_summary=log.content_summary,
            sentiment=log.sentiment,
            raw_ref=log.raw_ref,
            occurred_at=log.occurred_at,
        )
        for log, name in rows
    ]
    return InteractionLogListResponse(items=items)


@router.post("/interactions/log", response_model=InteractionLogResponse)
def log_interaction(payload: InteractionLogRequest, db: Session = Depends(get_db)):
    service = InteractionLoggerService()
    try:
        interaction, stage, account_id = service.log(
            db=db,
            contact_id=payload.contact_id,
            channel=payload.channel,
            direction=payload.direction,
            content_summary=payload.content_summary,
            sentiment=payload.sentiment,
            raw_ref=payload.raw_ref,
            occurred_at=payload.occurred_at,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return InteractionLogResponse(
        interaction_id=interaction.id,
        account_id=account_id,
        pipeline_stage=stage,
        status="logged",
    )

