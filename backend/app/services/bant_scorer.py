from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BANTScorecard, Contact, InteractionLog
from app.services.pipeline_utils import upsert_pipeline_item
from app.services.utils import now_utc


def _keyword_score(text: str, keywords: list[str], step: int, cap: int) -> int:
    lower = text.lower()
    hits = sum(1 for token in keywords if token in lower)
    return min(cap, hits * step)


class BANTScorerService:
    budget_keywords = ["budget", "capex", "cost", "quote", "price", "procurement", "rfq"]
    authority_keywords = ["director", "head", "vp", "manager", "decision", "approve", "owner"]
    need_keywords = ["yield", "defect", "alignment", "aa", "inspection", "quality", "false reject", "overkill", "npi"]
    timeline_keywords = ["q1", "q2", "q3", "q4", "week", "month", "deadline", "pilot", "poc", "schedule"]
    technical_track_keywords = ["rd", "npi", "yield", "alignment", "inspection", "optical", "process", "validation"]

    def score(self, db: Session, account_id: int, lookback_days: int) -> BANTScorecard:
        cutoff = now_utc() - timedelta(days=lookback_days)
        logs = (
            db.execute(
                select(InteractionLog)
                .join(Contact, Contact.id == InteractionLog.contact_id)
                .where(Contact.account_id == account_id, InteractionLog.occurred_at >= cutoff)
                .order_by(InteractionLog.occurred_at.desc())
            )
            .scalars()
            .all()
        )
        if not logs:
            raise ValueError(f"近 {lookback_days} 天內找不到 account {account_id} 的互動紀錄。")

        merged_text = " ".join(log.content_summary for log in logs)
        inbound_positive = sum(1 for log in logs if log.direction == "INBOUND" and log.sentiment == "POSITIVE")

        budget = _keyword_score(merged_text, self.budget_keywords, step=6, cap=25)
        authority = _keyword_score(merged_text, self.authority_keywords, step=6, cap=25)
        need = _keyword_score(merged_text, self.need_keywords, step=6, cap=30)
        timeline = _keyword_score(merged_text, self.timeline_keywords, step=5, cap=20)
        technical_track = _keyword_score(merged_text, self.technical_track_keywords, step=4, cap=20)

        if inbound_positive:
            need = min(30, need + 3)
            timeline = min(20, timeline + 2)

        # Technical-track inference:
        # In RD/NPI conversations, budget/authority signals are often implicit in early interactions.
        if technical_track >= 12 and need >= 15 and inbound_positive > 0:
            budget = min(25, budget + 8)
            authority = min(25, authority + 8)
            timeline = min(20, timeline + 3)

        total = budget + authority + need + timeline

        if total >= 75:
            grade = "A"
            stage = "TECHNICAL_EVAL"
            probability = 0.78
            action = "3 個工作天內安排技術評估會議（Technical Evaluation），確認設備規格與 demo 需求。"
            due_days = 3
        elif total >= 50:
            grade = "B"
            stage = "ENGAGED"
            probability = 0.52
            action = "在下次通話補齊 BANT 缺口並確認時程。"
            due_days = 7
        else:
            grade = "C"
            stage = "NURTURE"
            probability = 0.2
            action = "留在 nurture 流程，等待新的 CapEx/NPI 訊號再啟動。"
            due_days = 21

        rationale = (
            f"依近 {lookback_days} 天共 {len(logs)} 筆互動評分。"
            f"B={budget}, A={authority}, N={need}, T={timeline}。"
        )

        scorecard = BANTScorecard(
            account_id=account_id,
            budget_score=budget,
            authority_score=authority,
            need_score=need,
            timeline_score=timeline,
            total_score=total,
            grade=grade,
            rationale=rationale,
            recommended_next_action=action,
            created_at=now_utc(),
        )
        db.add(scorecard)
        upsert_pipeline_item(
            db=db,
            account_id=account_id,
            stage=stage,
            probability=probability,
            next_action=action,
            due_in_days=due_days,
        )
        db.commit()
        db.refresh(scorecard)
        return scorecard
