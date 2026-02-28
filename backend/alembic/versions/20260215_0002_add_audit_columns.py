"""add audit and observability columns

Revision ID: 20260215_0002
Revises: 20260215_0001
Create Date: 2026-02-15
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260215_0002"
down_revision: Union[str, None] = "20260215_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("signal_events", sa.Column("search_provider", sa.String(length=32), nullable=True))
    op.add_column("signal_events", sa.Column("search_latency_ms", sa.Integer(), nullable=True))
    op.add_column(
        "signal_events",
        sa.Column("search_fallback_used", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )

    op.add_column("pain_profiles", sa.Column("model_provider", sa.String(length=16), nullable=True))
    op.add_column("pain_profiles", sa.Column("llm_latency_ms", sa.Integer(), nullable=True))
    op.add_column("pain_profiles", sa.Column("llm_token_usage", sa.Integer(), nullable=True))
    op.add_column(
        "pain_profiles",
        sa.Column("llm_fallback_used", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )

    op.add_column("outreach_drafts", sa.Column("llm_latency_ms", sa.Integer(), nullable=True))
    op.add_column("outreach_drafts", sa.Column("llm_token_usage", sa.Integer(), nullable=True))
    op.add_column(
        "outreach_drafts",
        sa.Column("llm_fallback_used", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )


def downgrade() -> None:
    op.drop_column("outreach_drafts", "llm_fallback_used")
    op.drop_column("outreach_drafts", "llm_token_usage")
    op.drop_column("outreach_drafts", "llm_latency_ms")

    op.drop_column("pain_profiles", "llm_fallback_used")
    op.drop_column("pain_profiles", "llm_token_usage")
    op.drop_column("pain_profiles", "llm_latency_ms")
    op.drop_column("pain_profiles", "model_provider")

    op.drop_column("signal_events", "search_fallback_used")
    op.drop_column("signal_events", "search_latency_ms")
    op.drop_column("signal_events", "search_provider")
