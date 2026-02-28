from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.knowledge_docs import (
    KnowledgeDocCreateRequest,
    KnowledgeDocItem,
    KnowledgeDocListResponse,
    KnowledgeDocUpdateRequest,
    VALID_DOC_TYPES,
)
from app.services.knowledge_service import KnowledgeService

router = APIRouter(tags=["knowledge_docs"])


def _serialize(doc) -> KnowledgeDocItem:
    return KnowledgeDocItem(
        id=doc.id,
        account_id=doc.account_id,
        scope=doc.scope,
        doc_type=doc.doc_type,
        title=doc.title,
        content=doc.content,
        source_url=doc.source_url,
        tags=doc.tags,
        created_by=doc.created_by,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.get("/knowledge-docs", response_model=KnowledgeDocListResponse)
def list_knowledge_docs(
    account_id: int | None = Query(default=None),
    scope: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    svc = KnowledgeService()
    docs = svc.list_docs(db, account_id=account_id, scope=scope, limit=limit)
    items = [_serialize(d) for d in docs]
    return KnowledgeDocListResponse(items=items, total=len(items))


@router.get("/knowledge-docs/accounts/{account_id}", response_model=KnowledgeDocListResponse)
def list_knowledge_docs_for_account(
    account_id: int,
    db: Session = Depends(get_db),
):
    svc = KnowledgeService()
    docs = svc.list_docs_for_account(db, account_id=account_id)
    items = [_serialize(d) for d in docs]
    return KnowledgeDocListResponse(items=items, total=len(items))


@router.post("/knowledge-docs", response_model=KnowledgeDocItem, status_code=201)
def create_knowledge_doc(payload: KnowledgeDocCreateRequest, db: Session = Depends(get_db)):
    if payload.doc_type not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"doc_type 必須是 {sorted(VALID_DOC_TYPES)} 之一。",
        )
    svc = KnowledgeService()
    doc = svc.create_doc(
        db,
        account_id=payload.account_id,
        scope=payload.scope,
        doc_type=payload.doc_type,
        title=payload.title,
        content=payload.content,
        source_url=payload.source_url,
        tags=payload.tags,
        created_by=payload.created_by,
    )
    return _serialize(doc)


@router.patch("/knowledge-docs/{doc_id}", response_model=KnowledgeDocItem)
def update_knowledge_doc(doc_id: int, payload: KnowledgeDocUpdateRequest, db: Session = Depends(get_db)):
    if payload.doc_type is not None and payload.doc_type not in VALID_DOC_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"doc_type 必須是 {sorted(VALID_DOC_TYPES)} 之一。",
        )
    svc = KnowledgeService()
    doc = svc.update_doc(db, doc_id, payload.model_dump(exclude_none=True))
    if not doc:
        raise HTTPException(status_code=404, detail=f"Knowledge doc {doc_id} not found.")
    return _serialize(doc)


@router.delete("/knowledge-docs/{doc_id}")
def delete_knowledge_doc(doc_id: int, db: Session = Depends(get_db)):
    svc = KnowledgeService()
    found = svc.delete_doc(db, doc_id)
    return {"status": "deleted", "doc_id": doc_id, "already_missing": not found}
