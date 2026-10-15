"""Track whether a booking includes its account owner.

Revision ID: 20261015_07
Revises: 20261015_06
Create Date: 2026-10-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20261015_07"
down_revision = "20261015_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    booking_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("bookings")
    }
    if "includes_booker" not in booking_columns:
        op.add_column(
            "bookings",
            sa.Column(
                "includes_booker",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )
    bookings = sa.table(
        "bookings",
        sa.column("id", sa.Integer),
        sa.column("event_id", sa.Integer),
        sa.column("user_id", sa.Integer),
        sa.column("user_name", sa.Text),
        sa.column("quantity", sa.Integer),
        sa.column("attendee_names", sa.JSON),
        sa.column("booking_date", sa.TIMESTAMP),
        sa.column("includes_booker", sa.Boolean),
    )
    connection = op.get_bind()
    rows = connection.execute(
        sa.select(
            bookings.c.id,
            bookings.c.event_id,
            bookings.c.user_id,
            bookings.c.user_name,
            bookings.c.quantity,
            bookings.c.attendee_names,
        ).order_by(
            bookings.c.event_id,
            bookings.c.user_id,
            bookings.c.booking_date,
            bookings.c.id,
        )
    )
    already_marked_self = set()
    for booking_id, event_id, user_id, user_name, quantity, attendee_names in rows:
        attendee_names = attendee_names or [user_name] * quantity
        owner_name = " ".join(user_name.casefold().split())
        owner_event = (event_id, user_id)
        includes_booker = (
            user_id is not None
            and owner_event not in already_marked_self
            and any(
                " ".join(name.casefold().split()) == owner_name
                or " ".join(name.casefold().split()).startswith(owner_name + " ")
                for name in attendee_names
            )
        )
        if includes_booker:
            already_marked_self.add(owner_event)
        connection.execute(
            bookings.update()
            .where(bookings.c.id == booking_id)
            .values(includes_booker=includes_booker)
        )


def downgrade() -> None:
    op.drop_column("bookings", "includes_booker")
