from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Account, Contact
from app.schemas.accounts import (
    AccountCreateRequest,
    AccountImportRequest,
    AccountImportResponse,
    AccountListResponse,
    AccountResponse,
    AccountUpdateRequest,
)
from app.services.utils import now_utc

router = APIRouter(tags=["accounts"])


def _to_response(account: Account) -> AccountResponse:
    return AccountResponse(
        id=account.id,
        company_name=account.company_name,
        segment=account.segment,
        region=account.region,
        website=account.website,
        source=account.source,
        priority_tier=account.priority_tier,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


from app.services.csv_utils import sync_csv_to_db

@router.get("/accounts", response_model=AccountListResponse)
def list_accounts(
    segment: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    # Sync from CSV to ensure "Real API" mode uses the CSV data
    sync_csv_to_db(db)
    
    stmt = select(Account).order_by(Account.updated_at.desc())
    if segment:
        stmt = stmt.where(Account.segment == segment.upper())
    rows = db.execute(stmt.offset(offset).limit(limit)).scalars().all()
    return AccountListResponse(items=[_to_response(row) for row in rows])


@router.post("/accounts", response_model=AccountResponse)
def create_account(payload: AccountCreateRequest, db: Session = Depends(get_db)):
    existing = db.execute(select(Account).where(Account.company_name == payload.company_name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"Account '{payload.company_name}' already exists.")

    account = Account(
        company_name=payload.company_name,
        segment=payload.segment.upper(),
        region=payload.region,
        website=payload.website,
        source=payload.source or "manual",
        priority_tier=payload.priority_tier or "T3",
        created_at=now_utc(),
        updated_at=now_utc(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _to_response(account)


@router.post("/accounts/import", response_model=AccountImportResponse)
def import_accounts(payload: AccountImportRequest, db: Session = Depends(get_db)):
    inserted = 0
    updated = 0

    for row in payload.items:
        existing = db.execute(select(Account).where(Account.company_name == row.company_name)).scalar_one_or_none()
        if existing:
            existing.segment = row.segment.upper()
            existing.region = row.region
            existing.website = row.website
            existing.source = row.source or "api_import"
            existing.priority_tier = row.priority_tier or "T3"
            existing.updated_at = now_utc()
            updated += 1
            continue

        db.add(
            Account(
                company_name=row.company_name,
                segment=row.segment.upper(),
                region=row.region,
                website=row.website,
                source=row.source or "api_import",
                priority_tier=row.priority_tier or "T3",
                created_at=now_utc(),
                updated_at=now_utc(),
            )
        )
        inserted += 1

    db.commit()
    return AccountImportResponse(status="ok", inserted=inserted, updated=updated, total_rows=len(payload.items))


@router.get("/accounts/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    sync_csv_to_db(db)
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")
    return _to_response(account)


@router.patch("/accounts/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, payload: AccountUpdateRequest, db: Session = Depends(get_db)):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    if "segment" in data and data["segment"]:
        data["segment"] = data["segment"].upper()
    for key, value in data.items():
        setattr(account, key, value)
    account.updated_at = now_utc()
    db.commit()
    db.refresh(account)
    return _to_response(account)


@router.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {account_id} not found.")

    contact_count = db.execute(select(func.count(Contact.id)).where(Contact.account_id == account_id)).scalar_one()
    if contact_count > 0:
        raise HTTPException(status_code=409, detail="Account has contacts. Delete contacts first.")

    db.delete(account)
    db.commit()
    return {"status": "deleted", "account_id": account_id}
