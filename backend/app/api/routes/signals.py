from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Account, SignalEvent
from app.schemas.signals import SignalEventItem, SignalEventListResponse, SignalScanRequest, SignalScanResponse
from app.services.market_radar import MarketRadarService, rank_signal_for_top20

router = APIRouter(tags=["signals"])


@router.post("/signals/scan", response_model=SignalScanResponse)
def scan_signals(payload: SignalScanRequest, db: Session = Depends(get_db)):
    service = MarketRadarService()
    try:
        events_created = service.scan(
            db=db,
            account_ids=payload.account_ids,
            lookback_days=payload.lookback_days,
            max_results_per_account=payload.max_results_per_account,
            use_tavily=payload.use_tavily,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return SignalScanResponse(
        job_id=f"scan_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
        accounts_processed=len(payload.account_ids),
        events_created=events_created,
        status="completed",
    )


@router.get("/signals/accounts/{account_id}", response_model=SignalEventListResponse)
def list_signals_by_account(
    account_id: int,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")

    rows = (
        db.execute(
            select(SignalEvent)
            .where(SignalEvent.account_id == account_id)
            .order_by(SignalEvent.fetched_at.desc())
        )
        .scalars()
        .all()
    )
    ranked_rows = sorted(rows, key=rank_signal_for_top20, reverse=True)[:limit]
    return _serialize_signals(account_id, ranked_rows)


@router.get("/signals/global", response_model=SignalEventListResponse)
def list_global_signals(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(
            select(SignalEvent)
            .order_by(SignalEvent.fetched_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    # Global list not filtered by account, but response model expects account_id. 
    # We can pass 0 or handling it differently, but for now let's reuse valid schema.
    # Note: The UI for global list will need company name, which SignalEvent doesn't strictly have joined here yet.
    # ideally we should join Account. But let's stick to MVP: Client might fetch account details or we enrich.
    # Actually, for a global table, we usually need the company name. 
    # Let's verify if SignalEventListResponse allows extra fields or if we need a new schema.
    # Looking at schema: SignalEventItem has account_id. The list response has `items`.
    # Frontend will likely need to fetch account info or we should populate it.
    # For MVP speed, let's return the events. Frontend can show Account ID or we can enrich in a V2.
    return _serialize_signals(0, rows)


@router.delete("/signals/{signal_id}")
def delete_signal(signal_id: int, db: Session = Depends(get_db)):
    row = db.get(SignalEvent, signal_id)
    if row:
        db.delete(row)
        db.commit()
    # idempotent delete: even if row is already gone, return deleted.
    return {"status": "deleted", "signal_id": signal_id, "already_missing": row is None}


def _serialize_signals(account_id: int, rows: list[SignalEvent]) -> SignalEventListResponse:
    items = [
        SignalEventItem(
            id=row.id,
            account_id=row.account_id,
            signal_type=row.signal_type,
            signal_strength=row.signal_strength,
            event_date=row.event_date,
            summary=row.summary,
            evidence_url=row.evidence_url,
            source_name=row.source_name,
            source_published_at=row.source_published_at,
            search_provider=row.search_provider,
            search_latency_ms=row.search_latency_ms,
            search_fallback_used=bool(row.search_fallback_used),
            fetched_at=row.fetched_at,
        )
        for row in rows
    ]
    return SignalEventListResponse(account_id=account_id, items=items)
