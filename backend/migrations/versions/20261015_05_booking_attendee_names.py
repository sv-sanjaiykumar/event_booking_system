"""Store attendee names for each booked seat.

Revision ID: 20261015_05
Revises: 20261015_04
Create Date: 2026-10-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20261015_05"
down_revision = "20261015_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column(
            "attendee_names",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    bookings = sa.table(
        "bookings",
        sa.column("id", sa.Integer),
        sa.column("user_name", sa.Text),
        sa.column("quantity", sa.Integer),
        sa.column("attendee_names", sa.JSON),
    )
    connection = op.get_bind()
    rows = connection.execute(
        sa.select(bookings.c.id, bookings.c.user_name, bookings.c.quantity)
    )
    for booking_id, user_name, quantity in rows:
        connection.execute(
            bookings.update()
            .where(bookings.c.id == booking_id)
            .values(attendee_names=[user_name] * quantity)
        )


def downgrade() -> None:
    op.drop_column("bookings", "attendee_names")
