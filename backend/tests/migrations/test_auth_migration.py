import sqlite3
from pathlib import Path

from alembic import command
from alembic.config import Config


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def migrate_database(path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///" + str(path))
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    command.upgrade(config, "head")


def create_pre_auth_database(path):
    with sqlite3.connect(str(path)) as connection:
        connection.executescript(
            """
            CREATE TABLE events (
                id INTEGER NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                total_seats INTEGER NOT NULL CHECK (total_seats > 0),
                available_seats INTEGER NOT NULL
                    CHECK (available_seats >= 0)
                    CHECK (available_seats <= total_seats),
                date TIMESTAMP NOT NULL
            );
            CREATE TABLE bookings (
                id INTEGER NOT NULL PRIMARY KEY,
                event_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
            CREATE INDEX ix_bookings_event_id ON bookings(event_id);
            CREATE TABLE users (
                id INTEGER NOT NULL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(320) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL
                    CHECK (role IN ('attendee', 'creator')),
                is_active BOOLEAN NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE auth_sessions (
                id INTEGER NOT NULL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                jti VARCHAR(36) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                revoked_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            INSERT INTO events VALUES
                (4, 'Historical event', 'Preserve this', 5, 4,
                 '2026-11-20 09:00:00');
            INSERT INTO bookings VALUES
                (7, 4, 'Historical attendee', '2026-10-13 12:45:00');
            INSERT INTO users
                (id, name, email, password_hash, role, is_active)
            VALUES (12, 'Existing account', 'account@example.com',
                    'test-argon-hash', 'attendee', 1);
            INSERT INTO auth_sessions (id, user_id, jti, expires_at)
            VALUES (3, 12, 'existing-session-id', '2026-10-14 12:45:00');
            """
        )


def test_auth_migration_preserves_historical_records_without_fake_owners(
    tmp_path, monkeypatch
):
    database_path = tmp_path / "existing.db"
    create_pre_auth_database(database_path)
    migrate_database(database_path, monkeypatch)

    with sqlite3.connect(str(database_path)) as connection:
        connection.row_factory = sqlite3.Row
        event = connection.execute(
            "SELECT id, name, description, total_seats, available_seats, "
            "date, creator_id, status FROM events WHERE id = 4"
        ).fetchone()
        booking = connection.execute(
            "SELECT id, event_id, user_name, booking_date, user_id "
            "FROM bookings WHERE id = 7"
        ).fetchone()
        version = connection.execute(
            "SELECT version_num FROM alembic_version"
        ).fetchone()[0]
        existing_account = connection.execute(
            "SELECT id, email FROM users WHERE id = 12"
        ).fetchone()
        existing_session = connection.execute(
            "SELECT id, user_id, jti FROM auth_sessions WHERE id = 3"
        ).fetchone()
        user_indexes = {
            row[1] for row in connection.execute("PRAGMA index_list(users)")
        }
        event_indexes = {
            row[1] for row in connection.execute("PRAGMA index_list(events)")
        }
        foreign_key_violations = connection.execute(
            "PRAGMA foreign_key_check"
        ).fetchall()

    assert tuple(event) == (
        4,
        "Historical event",
        "Preserve this",
        5,
        4,
        "2026-11-20 09:00:00",
        None,
        "published",
    )
    assert tuple(booking) == (
        7,
        4,
        "Historical attendee",
        "2026-10-13 12:45:00",
        None,
    )
    assert tuple(existing_account) == (12, "account@example.com")
    assert tuple(existing_session) == (3, 12, "existing-session-id")
    assert "ix_users_email" in user_indexes
    assert "uq_events_published_name_date" in event_indexes
    assert version == "20261014_03"
    assert foreign_key_violations == []


def test_auth_migration_initializes_a_blank_database(tmp_path, monkeypatch):
    database_path = tmp_path / "new.db"

    migrate_database(database_path, monkeypatch)

    with sqlite3.connect(str(database_path)) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        event_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(events)")
        }
        booking_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(bookings)")
        }

    assert {"users", "auth_sessions", "events", "bookings"} <= tables
    assert {"creator_id", "status"} <= event_columns
    assert {"user_id"} <= booking_columns
