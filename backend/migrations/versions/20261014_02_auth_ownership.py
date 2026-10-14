"""Add authentication, nullable historical ownership, and event status.

Revision ID: 20261014_02
Revises: 20261014_01
Create Date: 2026-10-14
"""

from alembic import op
import sqlalchemy as sa

revision = "20261014_02"
down_revision = "20261014_01"
branch_labels = None
depends_on = None


def _ensure_table_columns(table_name: str, required_columns: set) -> bool:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return False
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    if not required_columns.issubset(columns):
        raise RuntimeError(
            f"Existing {table_name} table is incomplete; refusing to overwrite it."
        )
    return True


def _create_users() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('attendee', 'creator')",
            name="ck_users_role_allowed",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def _create_auth_sessions() -> None:
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.current_timestamp(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def _ensure_index(
    table_name: str, index_name: str, columns: list, unique: bool = False
) -> None:
    indexes = {
        index["name"]
        for index in sa.inspect(op.get_bind()).get_indexes(table_name)
    }
    if index_name not in indexes:
        op.create_index(index_name, table_name, columns, unique=unique)


def upgrade() -> None:
    if not _ensure_table_columns(
        "users",
        {"id", "name", "email", "password_hash", "role", "is_active", "created_at", "updated_at"},
    ):
        _create_users()
    if not _ensure_table_columns(
        "auth_sessions",
        {"id", "user_id", "jti", "expires_at", "revoked_at", "created_at"},
    ):
        _create_auth_sessions()

    _ensure_index("users", "ix_users_email", ["email"], unique=True)
    _ensure_index("auth_sessions", "ix_auth_sessions_user_id", ["user_id"])
    _ensure_index("auth_sessions", "ix_auth_sessions_jti", ["jti"], unique=True)

    op.execute(
        "ALTER TABLE events ADD COLUMN creator_id INTEGER "
        "REFERENCES users(id) ON DELETE SET NULL"
    )
    op.create_index("ix_events_creator_id", "events", ["creator_id"])
    op.execute(
        "ALTER TABLE events ADD COLUMN status VARCHAR(20) NOT NULL "
        "DEFAULT 'published' CHECK (status IN ('published', 'cancelled'))"
    )

    op.execute(
        "ALTER TABLE bookings ADD COLUMN user_id INTEGER "
        "REFERENCES users(id) ON DELETE SET NULL"
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    user_count = bind.execute(sa.text("SELECT COUNT(*) FROM users")).scalar_one()
    if user_count:
        raise RuntimeError(
            "Authentication downgrade refused because registered users and "
            "event/booking ownership must not be discarded."
        )
    op.drop_index("ix_bookings_user_id", table_name="bookings")
    op.drop_column("bookings", "user_id")
    op.drop_index("ix_events_creator_id", table_name="events")
    op.drop_column("events", "status")
    op.drop_column("events", "creator_id")
    op.drop_index("ix_auth_sessions_jti", table_name="auth_sessions")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
