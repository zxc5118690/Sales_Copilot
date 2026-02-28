from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Contact, OutreachDraft
from app.schemas.outreach import (
    OutreachDraftItem,
    OutreachDraftListResponse,
    OutreachGenerateRequest,
    OutreachGenerateResponse,
    OutreachStatusPatchRequest,
)
from app.services.outreach_generator import OutreachGeneratorService

router = APIRouter(tags=["outreach"])


@router.post("/outreach/generate", response_model=OutreachGenerateResponse)
def generate_outreach(payload: OutreachGenerateRequest, db: Session = Depends(get_db)):
    service = OutreachGeneratorService()
    try:
        draft, provider = service.generate(
            db=db,
            contact_id=payload.contact_id,
            channel=payload.channel,
            intent=payload.intent,
            tone=payload.tone,
            provider_preference=payload.llm_provider_preference,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return OutreachGenerateResponse(
        draft_id=draft.id,
        model_provider=provider,
        status=draft.status,
    )


@router.get("/outreach/contacts/{contact_id}", response_model=OutreachDraftListResponse)
def list_outreach_by_contact(
    contact_id: int,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")

    rows = (
        db.execute(
            select(OutreachDraft)
            .where(OutreachDraft.contact_id == contact_id)
            .order_by(OutreachDraft.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    items = [
        OutreachDraftItem(
            id=row.id,
            contact_id=row.contact_id,
            channel=row.channel,
            intent=row.intent,
            subject=row.subject,
            body=row.body,
            cta=row.cta,
            tone=row.tone,
            model_provider=row.model_provider,
            llm_latency_ms=row.llm_latency_ms,
            llm_token_usage=row.llm_token_usage,
            llm_fallback_used=bool(row.llm_fallback_used),
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return _serialize_outreach(contact_id, rows)


@router.get("/outreach/global", response_model=OutreachDraftListResponse)
def list_global_outreach(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(
            select(OutreachDraft)
            .order_by(OutreachDraft.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    # Using 0 for contact_id in global list
    return _serialize_outreach(0, rows)


def _serialize_outreach(contact_id: int, rows: list[OutreachDraft]) -> OutreachDraftListResponse:
    items = [
        OutreachDraftItem(
            id=row.id,
            contact_id=row.contact_id,
            channel=row.channel,
            intent=row.intent,
            subject=row.subject,
            body=row.body,
            cta=row.cta,
            tone=row.tone,
            model_provider=row.model_provider,
            llm_latency_ms=row.llm_latency_ms,
            llm_token_usage=row.llm_token_usage,
            llm_fallback_used=bool(row.llm_fallback_used),
            status=row.status,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return OutreachDraftListResponse(contact_id=contact_id, items=items)


@router.patch("/outreach/{draft_id}/status", response_model=OutreachDraftItem)
def patch_outreach_status(draft_id: int, payload: OutreachStatusPatchRequest, db: Session = Depends(get_db)):
    draft = db.get(OutreachDraft, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail=f"Outreach draft {draft_id} not found.")

    draft.status = payload.status
    db.commit()
    db.refresh(draft)
    return OutreachDraftItem(
        id=draft.id,
        contact_id=draft.contact_id,
        channel=draft.channel,
        intent=draft.intent,
        subject=draft.subject,
        body=draft.body,
        cta=draft.cta,
        tone=draft.tone,
        model_provider=draft.model_provider,
        llm_latency_ms=draft.llm_latency_ms,
        llm_token_usage=draft.llm_token_usage,
        llm_fallback_used=bool(draft.llm_fallback_used),
        status=draft.status,
        created_at=draft.created_at,
    )
