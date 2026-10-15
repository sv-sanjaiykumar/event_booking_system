"""Add an optional address to events.

Revision ID: 20261015_08
Revises: 20261015_07
Create Date: 2026-10-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20261015_08"
down_revision = "20261015_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    event_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("events")
    }
    if "location" not in event_columns:
        op.add_column("events", sa.Column("location", sa.Text(), nullable=True))


def downgrade() -> None:
    event_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("events")
    }
    if "location" in event_columns:
        op.drop_column("events", "location")
