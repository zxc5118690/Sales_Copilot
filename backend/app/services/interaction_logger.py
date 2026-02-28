from sqlalchemy.orm import Session

from app.models import Contact, InteractionLog
from app.services.pipeline_utils import upsert_pipeline_item
from app.services.utils import now_utc


class InteractionLoggerService:
    def log(
        self,
        db: Session,
        contact_id: int,
        channel: str,
        direction: str,
        content_summary: str,
        sentiment: str | None,
        raw_ref: str | None,
        occurred_at,
    ) -> tuple[InteractionLog, str, int]:
        contact = db.get(Contact, contact_id)
        if not contact:
            raise ValueError(f"找不到聯絡人 Contact {contact_id}。")

        interaction = InteractionLog(
            contact_id=contact_id,
            channel=channel,
            direction=direction,
            content_summary=content_summary,
            sentiment=sentiment,
            raw_ref=raw_ref,
            occurred_at=occurred_at or now_utc(),
        )
        db.add(interaction)

        if direction == "OUTBOUND":
            stage = "CONTACTED"
            probability = 0.25
            next_action = "3 個工作天內跟進，並爭取技術討論會議。"
            due_in_days = 3
        elif sentiment == "POSITIVE":
            stage = "ENGAGED"
            probability = 0.48
            next_action = "蒐集 BANT 線索並安排 discovery call。"
            due_in_days = 4
        elif sentiment == "NEGATIVE":
            stage = "NURTURE"
            probability = 0.12
            next_action = "暫停主動開發，2-4 週後以新 trigger 再啟動。"
            due_in_days = 14
        else:
            stage = "ENGAGED"
            probability = 0.35
            next_action = "下一次互動補齊需求與時程細節。"
            due_in_days = 7

        upsert_pipeline_item(
            db=db,
            account_id=contact.account_id,
            stage=stage,
            probability=probability,
            next_action=next_action,
            due_in_days=due_in_days,
        )
        db.commit()
        db.refresh(interaction)
        return interaction, stage, contact.account_id
