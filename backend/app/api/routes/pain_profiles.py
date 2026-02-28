from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Account, PainProfile
from app.schemas.pain_profiles import (
    PainGenerateRequest,
    PainGenerateResponse,
    PainProfileItem,
    PainProfileListResponse,
    PainProfileUpdateRequest,
)
from app.services.pain_extractor import PainExtractorService

router = APIRouter(tags=["pain_profiles"])


@router.post("/pain-profiles/generate", response_model=PainGenerateResponse)
def generate_pain_profiles(payload: PainGenerateRequest, db: Session = Depends(get_db)):
    service = PainExtractorService()
    try:
        created_count, provider_used = service.generate(
            db=db,
            account_id=payload.account_id,
            persona_targets=payload.persona_targets,
            max_items=payload.max_items,
            signal_ids=payload.signal_ids or None,
            user_annotations=payload.user_annotations or None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return PainGenerateResponse(
        account_id=payload.account_id,
        created_count=created_count,
        provider_used=provider_used,
    )


@router.get("/pain-profiles/accounts/{account_id}", response_model=PainProfileListResponse)
def list_pain_profiles_by_account(
    account_id: int,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")

    rows = (
        db.execute(
            select(PainProfile)
            .where(PainProfile.account_id == account_id)
            .order_by(PainProfile.confidence.desc(), PainProfile.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return _serialize_pains(account_id, rows)


@router.get("/pain-profiles/global", response_model=PainProfileListResponse)
def list_global_pain_profiles(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(
            select(PainProfile)
            .order_by(PainProfile.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return _serialize_pains(0, rows)


@router.patch("/pain-profiles/{pain_id}", response_model=PainProfileItem)
def update_pain_profile(pain_id: int, payload: PainProfileUpdateRequest, db: Session = Depends(get_db)):
    row = db.get(PainProfile, pain_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Pain profile {pain_id} not found.")

    changed = False
    if payload.persona is not None:
        row.persona = payload.persona.strip().upper()[:32] or row.persona
        changed = True
    if payload.pain_statement is not None:
        row.pain_statement = payload.pain_statement.strip()[:2000] or row.pain_statement
        changed = True
    if payload.business_impact is not None:
        row.business_impact = payload.business_impact.strip()[:2000] or row.business_impact
        changed = True
    if payload.technical_anchor is not None:
        row.technical_anchor = payload.technical_anchor.strip()[:2000] or row.technical_anchor
        changed = True
    if payload.confidence is not None:
        row.confidence = float(payload.confidence)
        changed = True

    if not changed:
        raise HTTPException(status_code=400, detail="No updatable fields provided.")

    db.commit()
    db.refresh(row)
    return _serialize_pain_item(row)


@router.delete("/pain-profiles/{pain_id}")
def delete_pain_profile(pain_id: int, db: Session = Depends(get_db)):
    row = db.get(PainProfile, pain_id)
    if row:
        db.delete(row)
        db.commit()
    return {"status": "deleted", "pain_id": pain_id, "already_missing": row is None}


def _serialize_pains(account_id: int, rows: list[PainProfile]) -> PainProfileListResponse:
    items = [_serialize_pain_item(row) for row in rows]
    return PainProfileListResponse(account_id=account_id, items=items)


def _serialize_pain_item(row: PainProfile) -> PainProfileItem:
    return PainProfileItem(
        id=row.id,
        account_id=row.account_id,
        persona=row.persona,
        pain_statement=row.pain_statement,
        business_impact=row.business_impact,
        technical_anchor=row.technical_anchor,
        confidence=row.confidence,
        evidence_ref=row.evidence_ref,
        model_provider=row.model_provider,
        llm_latency_ms=row.llm_latency_ms,
        llm_token_usage=row.llm_token_usage,
        llm_fallback_used=bool(row.llm_fallback_used),
        created_at=row.created_at,
    )
