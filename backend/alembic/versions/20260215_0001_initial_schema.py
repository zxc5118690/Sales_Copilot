"""initial schema

Revision ID: 20260215_0001
Revises:
Create Date: 2026-02-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260215_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("segment", sa.String(length=32), nullable=False),
        sa.Column("region", sa.String(length=128), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("source", sa.String(length=128), nullable=True),
        sa.Column("priority_tier", sa.String(length=8), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "signal_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("signal_type", sa.String(length=32), nullable=False),
        sa.Column("signal_strength", sa.Integer(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("evidence_url", sa.String(length=500), nullable=False),
        sa.Column("source_name", sa.String(length=255), nullable=True),
        sa.Column("source_published_at", sa.DateTime(), nullable=True),
        sa.Column("fetched_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("signal_strength BETWEEN 0 AND 100", name="ck_signal_strength_range"),
        sa.UniqueConstraint("account_id", "evidence_url", name="uq_signal_event_account_url"),
    )

    op.create_table(
        "pain_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("persona", sa.String(length=32), nullable=False),
        sa.Column("pain_statement", sa.Text(), nullable=False),
        sa.Column("business_impact", sa.Text(), nullable=False),
        sa.Column("technical_anchor", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence_ref", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="ck_pain_confidence_range"),
    )

    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("role_title", sa.String(length=255), nullable=True),
        sa.Column("channel_email", sa.String(length=255), nullable=True),
        sa.Column("channel_linkedin", sa.String(length=500), nullable=True),
        sa.Column("contactability_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("contactability_score BETWEEN 0 AND 100", name="ck_contactability_range"),
    )

    op.create_table(
        "outreach_drafts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contact_id", sa.Integer(), sa.ForeignKey("contacts.id"), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("intent", sa.String(length=32), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("cta", sa.Text(), nullable=False),
        sa.Column("tone", sa.String(length=32), nullable=False),
        sa.Column("model_provider", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "interaction_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contact_id", sa.Integer(), sa.ForeignKey("contacts.id"), nullable=False),
        sa.Column("channel", sa.String(length=16), nullable=False),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("content_summary", sa.Text(), nullable=False),
        sa.Column("sentiment", sa.String(length=16), nullable=True),
        sa.Column("raw_ref", sa.String(length=500), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "bant_scorecards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("budget_score", sa.Integer(), nullable=False),
        sa.Column("authority_score", sa.Integer(), nullable=False),
        sa.Column("need_score", sa.Integer(), nullable=False),
        sa.Column("timeline_score", sa.Integer(), nullable=False),
        sa.Column("total_score", sa.Integer(), nullable=False),
        sa.Column("grade", sa.String(length=1), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("recommended_next_action", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("total_score BETWEEN 0 AND 100", name="ck_bant_total_score_range"),
    )

    op.create_table(
        "pipeline_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("stage", sa.String(length=32), nullable=False),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column("next_action", sa.Text(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("owner", sa.String(length=128), nullable=False),
        sa.Column("blocker", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="ck_pipeline_probability_range"),
    )

    op.create_index("ix_signal_events_account_id", "signal_events", ["account_id"])
    op.create_index("ix_pain_profiles_account_id", "pain_profiles", ["account_id"])
    op.create_index("ix_contacts_account_id", "contacts", ["account_id"])
    op.create_index("ix_bant_scorecards_account_id", "bant_scorecards", ["account_id"])
    op.create_index("ix_pipeline_items_account_id", "pipeline_items", ["account_id"])


def downgrade() -> None:
    op.drop_index("ix_pipeline_items_account_id", table_name="pipeline_items")
    op.drop_index("ix_bant_scorecards_account_id", table_name="bant_scorecards")
    op.drop_index("ix_contacts_account_id", table_name="contacts")
    op.drop_index("ix_pain_profiles_account_id", table_name="pain_profiles")
    op.drop_index("ix_signal_events_account_id", table_name="signal_events")

    op.drop_table("pipeline_items")
    op.drop_table("bant_scorecards")
    op.drop_table("interaction_logs")
    op.drop_table("outreach_drafts")
    op.drop_table("contacts")
    op.drop_table("pain_profiles")
    op.drop_table("signal_events")
    op.drop_table("accounts")

