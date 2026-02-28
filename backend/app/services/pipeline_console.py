from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Account, BANTScorecard, Contact, InteractionLog, OutreachDraft, PipelineItem
from app.services.utils import now_utc


class PipelineConsoleService:
    def board(self, db: Session) -> list[dict]:
        rows = (
            db.execute(
                select(PipelineItem, Account)
                .join(Account, Account.id == PipelineItem.account_id)
                .order_by(PipelineItem.due_date.asc(), PipelineItem.probability.desc())
            )
            .all()
        )
        items: list[dict] = []
        for pipeline, account in rows:
            latest_score = (
                db.execute(
                    select(BANTScorecard)
                    .where(BANTScorecard.account_id == account.id)
                    .order_by(BANTScorecard.created_at.desc())
                    .limit(1)
                )
                .scalars()
                .first()
            )
            items.append(
                {
                    "account_id": account.id,
                    "company_name": account.company_name,
                    "stage": pipeline.stage,
                    "probability": pipeline.probability,
                    "due_date": pipeline.due_date,
                    "owner": pipeline.owner,
                    "next_action": pipeline.next_action,
                    "blocker": pipeline.blocker,
                    "latest_bant_grade": latest_score.grade if latest_score else None,
                    "latest_bant_score": latest_score.total_score if latest_score else None,
                }
            )
        return items

    def weekly_report(self, db: Session) -> dict:
        end = now_utc().date()
        start = (now_utc() - timedelta(days=7)).date()
        start_ts = now_utc() - timedelta(days=7)

        outbound_count = (
            db.execute(
                select(func.count(InteractionLog.id)).where(
                    InteractionLog.direction == "OUTBOUND", InteractionLog.occurred_at >= start_ts
                )
            )
            .scalar_one()
        )
        inbound_count = (
            db.execute(
                select(func.count(InteractionLog.id)).where(
                    InteractionLog.direction == "INBOUND", InteractionLog.occurred_at >= start_ts
                )
            )
            .scalar_one()
        )
        accounts_touched = (
            db.execute(
                select(func.count(func.distinct(Contact.account_id)))
                .select_from(InteractionLog)
                .join(Contact, Contact.id == InteractionLog.contact_id)
                .where(InteractionLog.occurred_at >= start_ts)
            )
            .scalar_one()
        )
        drafts_created = (
            db.execute(select(func.count(OutreachDraft.id)).where(OutreachDraft.created_at >= start_ts)).scalar_one()
        )
        bant_a_count = (
            db.execute(
                select(func.count(BANTScorecard.id)).where(BANTScorecard.created_at >= start_ts, BANTScorecard.grade == "A")
            )
            .scalar_one()
        )
        bant_b_count = (
            db.execute(
                select(func.count(BANTScorecard.id)).where(BANTScorecard.created_at >= start_ts, BANTScorecard.grade == "B")
            )
            .scalar_one()
        )
        bant_c_count = (
            db.execute(
                select(func.count(BANTScorecard.id)).where(BANTScorecard.created_at >= start_ts, BANTScorecard.grade == "C")
            )
            .scalar_one()
        )
        return {
            "start_date": start,
            "end_date": end,
            "outbound_count": outbound_count,
            "inbound_count": inbound_count,
            "accounts_touched": accounts_touched,
            "drafts_created": drafts_created,
            "bant_a_count": bant_a_count,
            "bant_b_count": bant_b_count,
            "bant_c_count": bant_c_count,
        }

