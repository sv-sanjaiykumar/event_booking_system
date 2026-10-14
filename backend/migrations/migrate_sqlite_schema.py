import argparse
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional


def _parse_assignments(values, option_name):
    assignments = {}
    for value in values:
        key, separator, item = value.partition("=")
        if not separator or not key or not item:
            raise ValueError(
                "{} must be supplied as ID=VALUE.".format(option_name)
            )
        if key in assignments:
            raise ValueError("Duplicate {} for ID {}.".format(option_name, key))
        assignments[int(key)] = item
    return assignments


def migrate_database(
    database_path: Path,
    event_dates: Dict[int, str],
    booking_user_names: Optional[Dict[int, str]] = None,
) -> Optional[Path]:
    database_path = Path(database_path)
    booking_user_names = booking_user_names or {}
    if not database_path.is_file():
        raise FileNotFoundError("SQLite database not found: {}".format(database_path))

    with sqlite3.connect(str(database_path)) as connection:
        connection.row_factory = sqlite3.Row
        tables = {
            row["name"]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        if not {"events", "bookings"}.issubset(tables):
            raise RuntimeError("Expected legacy events and bookings tables.")

        event_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(events)")
        }
        booking_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(bookings)")
        }
        if {"name", "total_seats", "date"}.issubset(event_columns) and {
            "user_name",
            "booking_date",
        }.issubset(booking_columns):
            return None
        if not {"title", "capacity", "available_seats"}.issubset(event_columns):
            raise RuntimeError("The events table does not match the expected old schema.")
        if not {"event_id", "attendee_name"}.issubset(booking_columns):
            raise RuntimeError(
                "The bookings table does not match the expected old schema."
            )

        events = list(
            connection.execute(
                "SELECT id, title, description, capacity, available_seats "
                "FROM events ORDER BY id"
            )
        )
        bookings = list(
            connection.execute(
                "SELECT id, event_id, attendee_name FROM bookings ORDER BY id"
            )
        )

    missing_dates = [row["id"] for row in events if row["id"] not in event_dates]
    if missing_dates:
        raise ValueError(
            "Provide an ISO 8601 date for every existing event; missing IDs: {}."
            .format(", ".join(map(str, missing_dates)))
        )

    normalized_dates = {}
    for event_id, value in event_dates.items():
        try:
            parsed_date = datetime.fromisoformat(value)
            if parsed_date.tzinfo is None or parsed_date.utcoffset() is None:
                raise ValueError("Event date must include a timezone.")
            normalized_dates[event_id] = (
                parsed_date.astimezone(timezone.utc)
                .replace(tzinfo=None)
                .isoformat(sep=" ")
            )
        except ValueError as exc:
            raise ValueError(
                "Event date for ID {} must be an ISO 8601 date and time.".format(
                    event_id
                )
            ) from exc

    missing_names = [
        row["id"]
        for row in bookings
        if row["attendee_name"] is None and row["id"] not in booking_user_names
    ]
    if missing_names:
        raise ValueError(
            "Provide a user name for every legacy booking without an attendee name; "
            "missing booking IDs: {}.".format(", ".join(map(str, missing_names)))
        )

    backup_path = database_path.with_name(
        "{}.pre-schema-migration-{}.bak".format(
            database_path.name, datetime.now().strftime("%Y%m%d-%H%M%S")
        )
    )
    shutil.copy2(str(database_path), str(backup_path))

    connection = sqlite3.connect(str(database_path))
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        connection.execute(
            """
            CREATE TABLE events_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                total_seats INTEGER NOT NULL CHECK (total_seats > 0),
                available_seats INTEGER NOT NULL
                    CHECK (available_seats >= 0)
                    CHECK (available_seats <= total_seats),
                date TIMESTAMP NOT NULL
            )
            """
        )
        for row in events:
            connection.execute(
                """
                INSERT INTO events_new
                    (id, name, description, total_seats, available_seats, date)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    row["id"],
                    row["title"],
                    row["description"],
                    row["capacity"],
                    row["available_seats"],
                    normalized_dates[row["id"]],
                ),
            )

        connection.execute(
            """
            CREATE TABLE bookings_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            )
            """
        )
        for row in bookings:
            user_name = row["attendee_name"]
            if user_name is None:
                user_name = booking_user_names[row["id"]]
            connection.execute(
                """
                INSERT INTO bookings_new (id, event_id, user_name)
                VALUES (?, ?, ?)
                """,
                (row["id"], row["event_id"], user_name),
            )

        connection.execute("DROP TABLE bookings")
        connection.execute("DROP TABLE events")
        connection.execute("ALTER TABLE events_new RENAME TO events")
        connection.execute("ALTER TABLE bookings_new RENAME TO bookings")
        connection.execute(
            "CREATE INDEX ix_bookings_event_id ON bookings (event_id)"
        )
        violations = list(connection.execute("PRAGMA foreign_key_check"))
        if violations:
            raise RuntimeError(
                "Foreign-key validation failed during schema migration: {!r}".format(
                    [tuple(row) for row in violations]
                )
            )
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()

    return backup_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate the legacy Event Booking SQLite schema."
    )
    parser.add_argument(
        "--database",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "event_booking.db",
        help="Path to the SQLite database file.",
    )
    parser.add_argument(
        "--event-date",
        action="append",
        default=[],
        metavar="ID=ISO_DATETIME",
        help="Date/time for an existing event; repeat for each event.",
    )
    parser.add_argument(
        "--booking-user-name",
        action="append",
        default=[],
        metavar="ID=NAME",
        help="Name for a legacy booking with NULL attendee_name; repeat as needed.",
    )
    args = parser.parse_args()

    dates = _parse_assignments(args.event_date, "--event-date")
    names = _parse_assignments(args.booking_user_name, "--booking-user-name")
    backup_path = migrate_database(args.database, dates, names)
    if backup_path is None:
        print("Database already uses the requested schema; no migration was needed.")
    else:
        print("Database migrated successfully.")
        print("Backup saved to: {}".format(backup_path))


if __name__ == "__main__":
    main()
