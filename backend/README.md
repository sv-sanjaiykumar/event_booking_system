# Event Booking API

For a description of the backend source files and how a request moves through the API, services, repositories, and database, see [the backend file guide](../docs/backend-files.md).

## Local setup

From this directory, create and activate a virtual environment, then install the backend and test dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e ".[test]"
cp -n .env.example .env
```

Upgrade pip before the editable install: older pip versions (before 21.3) do not support editable installs using the `pyproject.toml` build configuration in this project.

The copy command leaves an existing `.env` untouched. The default `DATABASE_URL` in `.env.example` is `sqlite:///./event_booking.db`. Run Alembic and the server from `backend/` so this relative URL uses the expected database file.

Before using authentication, generate a private signing key and set it in `backend/.env`:

```bash
openssl rand -hex 32
```

Copy the generated value as the `JWT_SECRET_KEY` value in `backend/.env` (replace the empty value from `.env.example`). The key must be at least 32 bytes. If login fails with `JWT_SECRET_KEY must be configured with at least 32 bytes`, configure this value and restart the API. Keep the key secret and stable across restarts; changing it invalidates all outstanding tokens. Access tokens last 15 minutes by default. `ACCESS_TOKEN_EXPIRE_MINUTES` accepts values from 1 through 60.

Apply database migrations before starting the API:

```bash
alembic upgrade head
```

The application does not create or modify database tables on startup. Alembic is the schema migration mechanism.

Start the development server:

```bash
uvicorn app.main:app --reload
```

FastAPI serves Swagger UI at <http://127.0.0.1:8000/docs>, ReDoc at <http://127.0.0.1:8000/redoc>, and the OpenAPI schema at <http://127.0.0.1:8000/openapi.json>.

## Endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/auth/register` | Register an attendee or creator account. Email is normalized and passwords must pass the strength policy. |
| `POST` | `/auth/login` | Verify credentials and return a short-lived bearer access token. |
| `POST` | `/auth/logout` | Revoke the current access token. |
| `GET` | `/auth/me` | Return the authenticated account. |
| `GET` | `/events/?page=1&page_size=20&q=meetup` | Public, paginated event search. Only published events are listed. |
| `GET` | `/events/{event_id}` | Retrieve an event or return `404`. |
| `POST` | `/events/` | Creator-only event creation. Names must start with a letter and contain only letters, numbers, and spaces. The authenticated creator is recorded as owner. A published event cannot share a name and date/time with another published event (`409`); differently named events may share a time. |
| `PATCH` | `/events/{event_id}` | Creator-owner-only edit. Names follow the same letter/number/space rule. Events must be in the future; capacity cannot be reduced below existing bookings, and edits cannot create duplicate published event names/date-times (`409`). |
| `DELETE` | `/events/{event_id}` | Creator-owner-only cancellation. The event is marked cancelled; its bookings are retained. |
| `GET` | `/creator/events` | List events owned by the authenticated creator. |
| `GET` | `/creator/events/{event_id}/bookings` | List bookings for an event owned by the authenticated creator. |
| `POST` | `/events/{event_id}/book` | Attendee-only booking. Accepts `{"quantity": 1}` to reserve between one and the remaining available seats. The attendee name and owner ID are derived from the token, never trusted from the request body. |
| `GET` | `/bookings/me` | List bookings belonging to the authenticated attendee. |
| `GET` | `/bookings/{booking_id}` | Read a booking if it belongs to the attendee or to an event owned by the creator. |
| `DELETE` | `/bookings/{booking_id}?quantity=2` | Attendee-owner-only cancellation before the event starts. Restores only the requested number of seats and retains any remaining seats on the booking. Omit `quantity` to cancel the full booking. |

Protected routes require `Authorization: Bearer <access_token>`. The only accepted roles are `attendee` and `creator`; the API returns `403` for the wrong role and uses `404` for resources outside the authenticated user's ownership. Signup passwords require at least 12 characters and characters from at least three of lowercase, uppercase, digits, and symbols. Passwords are stored using Argon2id.

Each issued token has a persisted session ID. The API verifies its signature, issuer, audience, type, expiry, active user, and non-revoked session on every protected request. Logout revokes that session immediately. Historical events and bookings are retained with null ownership because their original account cannot be determined safely; no account is invented or assigned to existing records.

The frontend keeps only the short-lived access token in tab-scoped `sessionStorage` so a page refresh can restore the session by validating `/auth/me`. It does not persist tokens in `localStorage`; logout, expiry, and invalid-session responses clear the tab token. Deploy with a strong per-environment secret and HTTPS.

Seat reservation accepts a quantity from 1 through the event's currently available seats. A conditional database update subtracts the requested quantity only if enough seats remain, followed by the booking insert in the same transaction. Cancellation accepts an optional quantity from 1 through the booking's remaining seats. It restores only those seats and reduces the booking quantity atomically; the booking record is deleted when its remaining quantity reaches zero. Omitting the cancellation quantity preserves the API's previous behavior and cancels all remaining seats. SQLite check constraints enforce valid seat counts and positive booking quantities.

Event timestamps are accepted with a timezone and stored as UTC timestamps in SQLite. The API returns them as UTC. When an API booking is created, the backend captures the application system clock in UTC and stores that booking time; SQLite's `CURRENT_TIMESTAMP` remains a fallback default for direct database inserts.

Duplicate prevention compares trimmed event names without regard to case and compares the actual UTC instant, so timestamps with different timezone offsets still count as the same time. A database unique index backs up the API check for concurrent creates and edits. Cancelled events do not reserve a name/time combination.

## Loading sample data

After applying migrations, run the sample SQL against the local database:

```bash
sqlite3 event_booking.db < seed_data.sql
```

The sample script inserts three events and three bookings using the current table columns. They have null ownership and are examples, not records associated with authenticated users. It is intended to run once against a development database; running it again will add duplicate sample rows. Check the inserted records with:

```bash
sqlite3 event_booking.db "SELECT id, name, total_seats, available_seats, date FROM events;"
sqlite3 event_booking.db "SELECT id, event_id, user_name, booking_date FROM bookings;"
```

## Migrating an existing local database

If the database still has the original `title`/`capacity` schema, first stop the API and run the existing one-time conversion below. Supply an ISO 8601 date and timezone for each existing event because that original schema had no event date:

```bash
python migrations/migrate_sqlite_schema.py \
  --event-date '1=2026-10-20T18:00:00+05:30' \
  --event-date '2=2026-10-25T09:00:00+05:30' \
  --event-date '3=2026-10-28T10:00:00+05:30'
```

If any legacy booking has no attendee name, the migration stops without changing the database. Supply a name for each such booking using `--booking-user-name 'BOOKING_ID=NAME'`. After a successful migration, start the API normally.

For an existing database already using `name`, `total_seats`, `date`, and `user_name`, add authentication and ownership columns with the Alembic migration. **Stop the API first.** Take a SQLite-consistent backup, test the migration on a copy, and compare event/booking row counts and IDs before migrating the real file:

```bash
sqlite3 event_booking.db ".backup 'event_booking.db.pre-auth.bak'"
cp event_booking.db event_booking.auth-test.db
DATABASE_URL=sqlite:///./event_booking.auth-test.db alembic upgrade head
sqlite3 event_booking.auth-test.db \
  "SELECT (SELECT COUNT(*) FROM events), (SELECT COUNT(*) FROM bookings);
   SELECT id, creator_id, status FROM events ORDER BY id;
   SELECT id, user_id FROM bookings ORDER BY id;"
rm event_booking.auth-test.db
DATABASE_URL=sqlite:///./event_booking.db alembic upgrade head
```

Existing records keep their IDs and all prior values; `creator_id` and `user_id` remain `NULL` until there is reliable ownership evidence. Keep the backup until the migrated database has been verified. A new, empty database is initialized by the same `alembic upgrade head` command.

## Frontend compatibility

The React frontend supports registration and login for attendees and creators, role-protected dashboards, and bearer-token API calls. Public event browsing remains available. Booking identity is taken from the authenticated attendee; sending a `user_name` in the request body does not set the attendee. Creators can manage their own events and view the attendee list for those events. Booking history and all event operations use the API; the frontend does not access the database directly.

## Tests

Run the API, service, authentication, ownership, concurrency, and migration tests from this directory:

```bash
pytest
```
