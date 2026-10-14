import sqlite3

import pytest

from migrations.migrate_sqlite_schema import migrate_database


def create_legacy_database(path):
    with sqlite3.connect(str(path)) as connection:
        connection.executescript(
            """
            CREATE TABLE events (
                id INTEGER PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                location VARCHAR(300),
                capacity INTEGER NOT NULL,
                available_seats INTEGER NOT NULL
            );
            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY,
                event_id INTEGER NOT NULL,
                attendee_name VARCHAR(200),
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
            INSERT INTO events
                (id, title, description, location, capacity, available_seats)
            VALUES (1, 'Meetup', 'Local event', 'Hall A', 5, 4);
            INSERT INTO bookings (id, event_id, attendee_name)
            VALUES (3, 1, 'Alex');
            """
        )


def test_migration_preserves_events_and_bookings(tmp_path):
    database_path = tmp_path / "legacy.db"
    create_legacy_database(database_path)

    backup_path = migrate_database(
        database_path,
        {1: "2026-10-20T18:00:00+05:30"},
    )

    assert backup_path is not None
    assert backup_path.is_file()
    with sqlite3.connect(str(database_path)) as connection:
        event = connection.execute(
            "SELECT id, name, description, total_seats, available_seats, date "
            "FROM events"
        ).fetchone()
        booking = connection.execute(
            "SELECT id, event_id, user_name, booking_date FROM bookings"
        ).fetchone()
        event_columns = {
            row[1]: row for row in connection.execute("PRAGMA table_info(events)")
        }
        booking_columns = {
            row[1]: row for row in connection.execute("PRAGMA table_info(bookings)")
        }
        foreign_key_violations = list(
            connection.execute("PRAGMA foreign_key_check")
        )

    assert event == (1, "Meetup", "Local event", 5, 4, "2026-10-20 12:30:00")
    assert booking is not None
    assert booking[:3] == (3, 1, "Alex")
    assert booking[3] is not None
    assert event_columns["date"][2].upper() == "TIMESTAMP"
    assert event_columns["date"][3] == 1
    assert booking_columns["user_name"][3] == 1
    assert booking_columns["booking_date"][4] == "CURRENT_TIMESTAMP"
    assert foreign_key_violations == []


def test_migration_requires_dates_before_changing_database(tmp_path):
    database_path = tmp_path / "legacy.db"
    create_legacy_database(database_path)

    with pytest.raises(ValueError, match="Provide an ISO 8601 date"):
        migrate_database(database_path, {})

    with sqlite3.connect(str(database_path)) as connection:
        columns = {
            row[1] for row in connection.execute("PRAGMA table_info(events)")
        }

    assert "title" in columns
    assert "name" not in columns
