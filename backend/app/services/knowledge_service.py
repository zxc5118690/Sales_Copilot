from datetime import datetime

from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.models import KnowledgeDoc
from app.services.utils import now_utc

_MAX_CHARS_PER_DOC = 4000
_MAX_DOCS_IN_CONTEXT = 6


class KnowledgeService:
    def list_docs(
        self,
        db: Session,
        account_id: int | None = None,
        scope: str | None = None,
        limit: int = 50,
    ) -> list[KnowledgeDoc]:
        stmt = select(KnowledgeDoc).order_by(KnowledgeDoc.created_at.desc()).limit(limit)
        if account_id is not None:
            stmt = stmt.where(KnowledgeDoc.account_id == account_id)
        if scope is not None:
            stmt = stmt.where(KnowledgeDoc.scope == scope)
        return db.execute(stmt).scalars().all()

    def list_docs_for_account(self, db: Session, account_id: int) -> list[KnowledgeDoc]:
        """Return account-scoped + global docs for a given account."""
        stmt = (
            select(KnowledgeDoc)
            .where(
                or_(
                    KnowledgeDoc.account_id == account_id,
                    KnowledgeDoc.scope == "global",
                )
            )
            .order_by(KnowledgeDoc.created_at.desc())
            .limit(50)
        )
        return db.execute(stmt).scalars().all()

    def create_doc(self, db: Session, **kwargs) -> KnowledgeDoc:
        now = now_utc()
        doc = KnowledgeDoc(
            created_at=now,
            updated_at=now,
            **kwargs,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def update_doc(self, db: Session, doc_id: int, data: dict) -> KnowledgeDoc | None:
        doc = db.get(KnowledgeDoc, doc_id)
        if not doc:
            return None
        for field, value in data.items():
            if value is not None:
                setattr(doc, field, value)
        doc.updated_at = now_utc()
        db.commit()
        db.refresh(doc)
        return doc

    def delete_doc(self, db: Session, doc_id: int) -> bool:
        doc = db.get(KnowledgeDoc, doc_id)
        if not doc:
            return False
        db.delete(doc)
        db.commit()
        return True

    def build_context_for_account(self, db: Session, account_id: int) -> str | None:
        """Build LLM context string from account-scoped + global docs.

        Returns None when no documents are available.
        """
        docs = self.list_docs_for_account(db, account_id)
        if not docs:
            return None

        parts: list[str] = []
        for doc in docs[:_MAX_DOCS_IN_CONTEXT]:
            truncated = doc.content[:_MAX_CHARS_PER_DOC]
            parts.append(
                f"[知識庫文件] 類型: {doc.doc_type} | 標題: {doc.title}\n{truncated}"
            )

        if not parts:
            return None

        return (
            "=== 知識庫參考資料（業務員提供，請優先引用）===\n"
            + "\n---\n".join(parts)
            + "\n=== 知識庫資料結束 ===\n"
        )
