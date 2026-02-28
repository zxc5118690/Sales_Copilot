from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PipelineItem
from app.services.utils import now_utc


def upsert_pipeline_item(
    db: Session,
    account_id: int,
    stage: str,
    probability: float,
    next_action: str,
    due_in_days: int,
    owner: str = "BD",
    blocker: str | None = None,
) -> PipelineItem:
    item = (
        db.execute(
            select(PipelineItem)
            .where(PipelineItem.account_id == account_id)
            .order_by(PipelineItem.updated_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    due_date = (now_utc() + timedelta(days=due_in_days)).date()
    if item:
        item.stage = stage
        item.probability = max(0.0, min(1.0, probability))
        item.next_action = next_action
        item.due_date = due_date
        item.owner = owner
        item.blocker = blocker
        item.updated_at = now_utc()
        return item

    item = PipelineItem(
        account_id=account_id,
        stage=stage,
        probability=max(0.0, min(1.0, probability)),
        next_action=next_action,
        due_date=due_date,
        owner=owner,
        blocker=blocker,
        updated_at=now_utc(),
    )
    db.add(item)
    return item

