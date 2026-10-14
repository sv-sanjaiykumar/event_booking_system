"""Prevent duplicate published events at the same date and time.

Revision ID: 20261014_03
Revises: 20261014_02
Create Date: 2026-10-14
"""

from alembic import op
import sqlalchemy as sa

revision = "20261014_03"
down_revision = "20261014_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    duplicate = bind.execute(
        sa.text(
            "SELECT name, date FROM events "
            "WHERE status = 'published' "
            "GROUP BY lower(trim(name)), date "
            "HAVING COUNT(*) > 1 LIMIT 1"
        )
    ).first()
    if duplicate is not None:
        raise RuntimeError(
            "Cannot add event name/date uniqueness while duplicate published "
            f"events exist (name={duplicate[0]!r}, date={duplicate[1]!r}). "
            "Resolve those records and rerun the migration."
        )

    op.create_index(
        "uq_events_published_name_date",
        "events",
        [sa.text("lower(trim(name))"), sa.column("date")],
        unique=True,
        sqlite_where=sa.text("status = 'published'"),
        postgresql_where=sa.text("status = 'published'"),
    )


def downgrade() -> None:
    op.drop_index("uq_events_published_name_date", table_name="events")
