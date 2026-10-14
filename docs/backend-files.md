# Backend Files: Purpose and Request Flow

This guide explains the implemented files in `backend/`, what each one is responsible for, and how they work together when an event is created, booked, or canceled.

## Application entry point and API

- **`backend/app/main.py`** — Creates the FastAPI application, registers the API router, and configures CORS. Schema changes are managed by Alembic rather than during application startup. FastAPI publishes Swagger UI, ReDoc, and the OpenAPI JSON document.
- **`backend/app/api/v1/api.py`** — Combines the authentication, event, and booking routers into one API router.
- **`backend/app/api/v1/endpoints/auth.py`** — Implements registration, login, logout, and current-account routes.
- **`backend/app/api/v1/endpoints/events.py`** — Implements public event discovery plus creator-only creation, editing, cancellation, and owner-scoped event/booking views.
- **`backend/app/api/v1/endpoints/bookings.py`** — Implements attendee-only booking, attendee booking lists, owner-scoped booking reads, and booking cancellation.
- **`backend/app/api/dependencies.py`** — Defines request-scoped database access, bearer-token/session validation, and reusable attendee/creator role dependencies.

## Database and models

- **`backend/app/db/database.py`** — Reads `DATABASE_URL`, loads local environment variables, creates the SQLAlchemy engine and session factory, and defines the shared declarative model base. SQLite connections are configured for FastAPI's threaded request handling and have foreign-key enforcement enabled.
- **`backend/app/models/user.py`** and **`backend/app/models/auth_session.py`** — Define accounts and persisted token sessions. Session records support server-side logout/revocation and account deactivation.
- **`backend/app/models/event.py`** — Defines event details, seat-count constraints, nullable creator ownership for historical records, and published/cancelled state.
- **`backend/app/models/booking.py`** — Defines event bookings, booking timestamps, and nullable attendee ownership for historical records.
- **`backend/app/models/__init__.py`** — Exposes the models to Alembic metadata.

The current database URL is set in `backend/.env.example`:

```dotenv
DATABASE_URL=sqlite:///./event_booking.db
```

The relative SQLite path is resolved from the current working directory. Run Alembic and the application from `backend/`. Use `alembic upgrade head` to create or migrate the database; the application does not make schema changes at startup. The Alembic revisions add authentication and nullable ownership without assigning historical records to invented accounts. `backend/migrations/migrate_sqlite_schema.py` remains the one-time converter for the earlier `title`/`capacity` schema. SQLite does not retain timezone offsets, so event and booking timestamps are stored as UTC values.

## Schemas: API input and output

- **`backend/app/schemas/auth.py`** — Defines role-limited registration/login inputs, password policy, and safe account/token responses.
- **`backend/app/schemas/event.py`** — Defines validated event creation, partial updates, and response schemas. Event dates require a timezone, and updates reject null values for required fields.
- **`backend/app/schemas/booking.py`** — Defines booking, attendee booking-list, and creator booking response schemas.
- **`backend/app/schemas/__init__.py`** — Re-exports the schema classes for convenient imports.

These schemas keep external JSON contracts separate from database table definitions. FastAPI uses them both to validate requests and to describe the API in OpenAPI.

## Repositories: database operations

- **`backend/app/repositories/auth_repository.py`** — Persists and retrieves users and revocable access-token sessions.
- **`backend/app/repositories/event_repository.py`** — Inserts and searches events, and scopes creator operations and booking queries to owned events.
- **`backend/app/repositories/booking_repository.py`** — Performs owner-scoped booking reads and conditional seat reservation/deletion operations.
- **`backend/app/repositories/__init__.py`** — Package marker; repository modules are imported explicitly by the services.

Repositories contain persistence operations, not HTTP response handling. This lets services enforce business rules without depending on FastAPI.

## Services: business rules

- **`backend/app/services/auth_service.py`** and **`backend/app/core/security.py`** — Hash passwords with Argon2id, issue/validate signed short-lived JWTs, and revoke persisted sessions.
- **`backend/app/services/event_service.py`** — Enforces future-event, ownership, capacity-edit, and cancellation rules.
- **`backend/app/services/booking_service.py`** — Enforces event/booking ownership and future-event policies in atomic booking and cancellation transactions.
- **`backend/app/services/exceptions.py`** — Defines domain errors that endpoint handlers translate into HTTP responses.
- **`backend/app/services/__init__.py`** — Package marker for service modules.

The conditional update is important for enforcing capacity: the seat check and decrement happen in the database as one operation instead of relying on a separate read followed by a write.

## Tests and project configuration

- **`backend/tests/conftest.py`** — Provides a temporary in-memory SQLite database and a FastAPI `TestClient` fixture. It overrides the normal database dependency so tests do not use the local development database file.
- **`backend/tests/api/test_event_booking.py`** and **`backend/tests/api/test_auth_and_authorization.py`** — Check the OpenAPI contract, authentication, token revocation, roles, ownership, validation, and API behavior.
- **`backend/tests/services/test_booking_service.py`** — Tests booking/cancellation transactions and concurrent attempts for the last seat.
- **`backend/tests/services/test_schema_migration.py`** — Verifies the SQLite schema migration preserves records, checks constraints, and requires dates before modifying the old database.
- **`backend/tests/migrations/test_auth_migration.py`** — Tests fresh and existing/partially initialized database upgrades while checking historical data and nullable ownership.
- **`backend/alembic.ini`**, **`backend/migrations/env.py`**, and **`backend/migrations/versions/`** — Configure and implement versioned database migrations.
- **`backend/migrations/migrate_sqlite_schema.py`** — Backs up and converts only the original legacy event/booking table definitions while preserving IDs and data.
- **`backend/pyproject.toml`** — Declares backend dependencies, test extras, Python package discovery, and pytest settings.
- **`backend/.env.example`** — Documents the database URL, allowed CORS origins, private JWT secret setting, and access-token lifetime. The local `.env` is ignored by Git.
- **`backend/README.md`** — Provides setup, run, endpoint, and test commands.

The `__init__.py` files under `backend/app/` mark Python packages. The `.gitkeep` files preserve folders that are currently empty, such as `app/core/`; they do not contain runtime behavior.

## What happens during a booking request

For `POST /events/{event_id}/book`, the request follows this path:

1. **Authentication dependency** (`api/dependencies.py`) validates the bearer JWT, persisted session, and active account; role dependencies ensure the caller is an attendee.
2. **Endpoint** (`api/v1/endpoints/bookings.py`) receives the event ID and request-scoped session. The account ID and name come from the authenticated user, not the request body.
3. **Service** (`services/booking_service.py`) applies booking rules and asks the repository to reserve one seat.
4. **Repository** (`repositories/booking_repository.py`) conditionally decrements `available_seats` only for a published future event with capacity remaining. This prevents two concurrent requests from reserving the same last seat.
5. If no seat was reserved, the service distinguishes a missing, cancelled, started, or full event and raises the corresponding domain error. The endpoint returns the matching `4xx` response.
6. If a seat was reserved, the repository captures the application system clock in UTC and creates the booking before commit. If booking creation fails, the seat decrement is rolled back.
7. The response schema formats the booking as JSON. After the request, the dependency closes the session.

Cancellation uses the same layering: the service verifies ownership and event policy, conditionally deletes the booking, and increments the associated event's available seats in one transaction. A missing or unowned booking returns `404`; a successful cancellation returns `204 No Content`.

## Running and checking the backend

From the `backend/` directory:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>
- OpenAPI JSON: <http://127.0.0.1:8000/openapi.json>

Run the tests from the same directory:

```bash
pytest
```
