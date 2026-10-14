"""Baseline the pre-authentication event and booking schema.

Revision ID: 20261014_01
Revises:
Create Date: 2026-10-14
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20261014_01"
down_revision = None
branch_labels = None
depends_on = None


def _create_events() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("total_seats", sa.Integer(), nullable=False),
        sa.Column("available_seats", sa.Integer(), nullable=False),
        sa.Column("date", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.CheckConstraint(
            "total_seats > 0", name="ck_events_total_seats_positive"
        ),
        sa.CheckConstraint(
            "available_seats >= 0",
            name="ck_events_available_seats_nonnegative",
        ),
        sa.CheckConstraint(
            "available_seats <= total_seats",
            name="ck_events_available_within_total",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def _create_bookings() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_name", sa.Text(), nullable=False),
        sa.Column(
            "booking_date",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["event_id"], ["events.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bookings_event_id", "bookings", ["event_id"])


def upgrade() -> None:
    inspector = inspect(op.get_bind())
    existing_tables = set(inspector.get_table_names())
    if "events" not in existing_tables:
        _create_events()
    if "bookings" not in existing_tables:
        _create_bookings()

    inspector = inspect(op.get_bind())
    expected_columns = {
        "events": {
            "id",
            "name",
            "description",
            "total_seats",
            "available_seats",
            "date",
        },
        "bookings": {"id", "event_id", "user_name", "booking_date"},
    }
    for table_name, required in expected_columns.items():
        if table_name not in inspector.get_table_names():
            raise RuntimeError(
                "The baseline migration could not create the "
                f"{table_name} table."
            )
        actual = {column["name"] for column in inspector.get_columns(table_name)}
        if not required.issubset(actual):
            raise RuntimeError(
                f"Existing {table_name} schema is not the supported "
                "pre-authentication schema. Run the documented legacy "
                "SQLite schema migration first."
            )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.execute(sa.text("SELECT COUNT(*) FROM bookings")).scalar_one():
        raise RuntimeError(
            "Baseline downgrade refused because it would delete booking data."
        )
    if bind.execute(sa.text("SELECT COUNT(*) FROM events")).scalar_one():
        raise RuntimeError(
            "Baseline downgrade refused because it would delete event data."
        )
    op.drop_table("bookings")
    op.drop_table("events")
