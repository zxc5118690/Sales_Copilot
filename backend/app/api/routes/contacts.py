from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Account, Contact
from app.schemas.contacts import ContactCreateRequest, ContactListResponse, ContactResponse, ContactUpdateRequest
from app.services.utils import now_utc

router = APIRouter(tags=["contacts"])


def _to_response(contact: Contact) -> ContactResponse:
    return ContactResponse(
        id=contact.id,
        account_id=contact.account_id,
        full_name=contact.full_name,
        role_title=contact.role_title,
        channel_email=contact.channel_email,
        channel_linkedin=contact.channel_linkedin,
        contactability_score=contact.contactability_score,
        created_at=contact.created_at,
    )


@router.get("/contacts", response_model=ContactListResponse)
def list_contacts(
    account_id: int | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=300),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Contact).order_by(Contact.id.desc())
    if account_id:
        stmt = stmt.where(Contact.account_id == account_id)
    rows = db.execute(stmt.offset(offset).limit(limit)).scalars().all()
    return ContactListResponse(items=[_to_response(row) for row in rows])


@router.post("/contacts", response_model=ContactResponse)
def create_contact(payload: ContactCreateRequest, db: Session = Depends(get_db)):
    account = db.get(Account, payload.account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account {payload.account_id} not found.")

    contact = Contact(
        account_id=payload.account_id,
        full_name=payload.full_name,
        role_title=payload.role_title,
        channel_email=payload.channel_email,
        channel_linkedin=payload.channel_linkedin,
        contactability_score=payload.contactability_score,
        created_at=now_utc(),
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return _to_response(contact)


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    return _to_response(contact)


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: int, payload: ContactUpdateRequest, db: Session = Depends(get_db)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    for key, value in data.items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return _to_response(contact)


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    db.delete(contact)
    db.commit()
    return {"status": "deleted", "contact_id": contact_id}

