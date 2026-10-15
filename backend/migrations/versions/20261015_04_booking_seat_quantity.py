"""Store the number of seats reserved by each booking.

Revision ID: 20261015_04
Revises: 20261014_03
Create Date: 2026-10-15
"""

from alembic import op
import sqlalchemy as sa

revision = "20261015_04"
down_revision = "20261014_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column(
            "quantity",
            sa.Integer(),
            sa.CheckConstraint(
                "quantity >= 1", name="ck_bookings_quantity_positive"
            ),
            server_default="1",
            nullable=False,
            comment="Number of event seats reserved by this booking",
        )
    )


def downgrade() -> None:
    op.drop_column("bookings", "quantity")
