from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    segment: Mapped[str] = mapped_column(String(32), nullable=False)
    region: Mapped[str] = mapped_column(String(128), nullable=True)
    website: Mapped[str] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(128), nullable=True)
    priority_tier: Mapped[str] = mapped_column(String(8), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class SignalEvent(Base):
    __tablename__ = "signal_events"
    __table_args__ = (
        UniqueConstraint("account_id", "evidence_url", name="uq_signal_event_account_url"),
        CheckConstraint("signal_strength BETWEEN 0 AND 100", name="ck_signal_strength_range"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    signal_type: Mapped[str] = mapped_column(String(32), nullable=False)
    signal_strength: Mapped[int] = mapped_column(Integer, nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_name: Mapped[str] = mapped_column(String(255), nullable=True)
    source_published_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    search_provider: Mapped[str] = mapped_column(String(32), nullable=True)
    search_latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    search_fallback_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class PainProfile(Base):
    __tablename__ = "pain_profiles"
    __table_args__ = (CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="ck_pain_confidence_range"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    persona: Mapped[str] = mapped_column(String(32), nullable=False)
    pain_statement: Mapped[str] = mapped_column(Text, nullable=False)
    business_impact: Mapped[str] = mapped_column(Text, nullable=False)
    technical_anchor: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    evidence_ref: Mapped[str] = mapped_column(String(500), nullable=True)
    model_provider: Mapped[str] = mapped_column(String(16), nullable=True)
    llm_latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    llm_token_usage: Mapped[int] = mapped_column(Integer, nullable=True)
    llm_fallback_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (CheckConstraint("contactability_score BETWEEN 0 AND 100", name="ck_contactability_range"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    role_title: Mapped[str] = mapped_column(String(255), nullable=True)
    channel_email: Mapped[str] = mapped_column(String(255), nullable=True)
    channel_linkedin: Mapped[str] = mapped_column(String(500), nullable=True)
    contactability_score: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class OutreachDraft(Base):
    __tablename__ = "outreach_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String(16), nullable=False)
    intent: Mapped[str] = mapped_column(String(32), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    cta: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String(32), nullable=False)
    model_provider: Mapped[str] = mapped_column(String(16), nullable=False)
    llm_latency_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    llm_token_usage: Mapped[int] = mapped_column(Integer, nullable=True)
    llm_fallback_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class InteractionLog(Base):
    __tablename__ = "interaction_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String(16), nullable=False)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    content_summary: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(16), nullable=True)
    raw_ref: Mapped[str] = mapped_column(String(500), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class BANTScorecard(Base):
    __tablename__ = "bant_scorecards"
    __table_args__ = (CheckConstraint("total_score BETWEEN 0 AND 100", name="ck_bant_total_score_range"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    budget_score: Mapped[int] = mapped_column(Integer, nullable=False)
    authority_score: Mapped[int] = mapped_column(Integer, nullable=False)
    need_score: Mapped[int] = mapped_column(Integer, nullable=False)
    timeline_score: Mapped[int] = mapped_column(Integer, nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, nullable=False)
    grade: Mapped[str] = mapped_column(String(1), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_next_action: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class PipelineItem(Base):
    __tablename__ = "pipeline_items"
    __table_args__ = (CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="ck_pipeline_probability_range"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)
    stage: Mapped[str] = mapped_column(String(32), nullable=False)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    next_action: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    owner: Mapped[str] = mapped_column(String(128), nullable=False)
    blocker: Mapped[str] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class KnowledgeDoc(Base):
    __tablename__ = "knowledge_docs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=True)
    scope: Mapped[str] = mapped_column(String(16), nullable=False, default="global")
    doc_type: Mapped[str] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), nullable=True)
    tags: Mapped[str] = mapped_column(String(255), nullable=True)
    created_by: Mapped[str] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
