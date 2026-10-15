"""Persist unique event seat numbers for each booking.

Revision ID: 20261015_06
Revises: 20261015_05
Create Date: 2026-10-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20261015_06"
down_revision = "20261015_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column(
            "seat_numbers",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    bookings = sa.table(
        "bookings",
        sa.column("id", sa.Integer),
        sa.column("event_id", sa.Integer),
        sa.column("quantity", sa.Integer),
        sa.column("booking_date", sa.TIMESTAMP),
        sa.column("seat_numbers", sa.JSON),
    )
    connection = op.get_bind()
    rows = connection.execute(
        sa.select(
            bookings.c.id,
            bookings.c.event_id,
            bookings.c.quantity,
        ).order_by(bookings.c.event_id, bookings.c.booking_date, bookings.c.id)
    )
    next_seat_by_event = {}
    for booking_id, event_id, quantity in rows:
        first_seat = next_seat_by_event.get(event_id, 1)
        seat_numbers = list(range(first_seat, first_seat + quantity))
        next_seat_by_event[event_id] = first_seat + quantity
        connection.execute(
            bookings.update()
            .where(bookings.c.id == booking_id)
            .values(seat_numbers=seat_numbers)
        )


def downgrade() -> None:
    op.drop_column("bookings", "seat_numbers")
