# Event Booking System: Project Structure

This document explains the purpose of the main folders and files in the Event Booking System. The repository is organized as a monorepo: the FastAPI backend, React frontend, and Python SDK live together but can be developed and tested independently.

## Backend — `backend/`

The backend handles HTTP requests, business rules, authentication, and database operations.

For a file-by-file guide to the implemented backend and its request flow, see [Backend Files: Purpose and Request Flow](./backend-files.md).

- **`app/main.py`** — Creates the FastAPI application, registers API routes, configures middleware, and sets up the OpenAPI documentation endpoints.
- **`app/api/`** — Holds the HTTP-facing API code: routes, shared dependencies, and API versioning.
  - **`dependencies.py`** — Shared request-time helpers, such as retrieving the current user or providing a database session.
  - **`v1/api.py`** — Combines the version 1 routes into a router, so they can be registered in `main.py`.
- **`v1/endpoints/`** — Route modules for authentication, event discovery and creator management, and attendee bookings/cancellations.
- **`app/core/`** — Application-wide configuration and infrastructure: environment settings, authentication/security helpers, and logging.
- **`app/db/`** — Database setup, such as creating connections and sessions and defining shared model metadata.
- **`app/models/`** — SQLAlchemy table definitions for users, events (including optional venue address), sessions, and bookings with attendee and seat details.
- **`app/schemas/`** — Pydantic models that validate event and booking requests and shape API responses, including the generated OpenAPI contract.
- **`app/services/`** — Business rules for authentication, event ownership and editing, seat availability, one self ticket per attendee per event, and cancellation.
- **`app/repositories/`** — Database queries and persistence operations. This keeps data access separate from the booking rules that use it.
- **`migrations/`** — Alembic database migration scripts, used to evolve the schema as the application changes.
- **`tests/`** — Automated backend tests.
  - **`api/`** — Tests HTTP endpoints and their responses.
  - **`services/`** — Tests business rules, such as preventing bookings once an event is full.
  - **`conftest.py`** — Shared pytest fixtures, for example a test database or test client.
- **`pyproject.toml`** — Backend Python project configuration: dependencies, packaging settings, and tool configuration.
- **`.env.example`** — A template showing which environment variables need to be configured, without storing actual secrets.

## Frontend — `frontend/`

The frontend is the browser-based interface attendees and organizers use to browse events and manage bookings.

- **`public/`** — Static assets served as-is, such as a favicon.
- **`src/main.jsx`** — The frontend entry point. It mounts the React application in the browser.
- **`src/app/`** — Application-wide setup, such as routing, shared providers, and global configuration.
- **`src/api/`** — The code that communicates with the backend, such as functions to fetch events or submit bookings.
- **`src/components/`** — Reusable UI pieces used in multiple places, such as buttons, form fields, or event cards.
- **`src/features/`** — Authentication, event creation/discovery/management, and attendee booking flows, grouped with their API and UI code.
- **`src/components/`** — Shared interface components, including the public event card and brand mark.
- **`src/styles.css`** — Application-wide styles and responsive layouts.
- **`src/features/` test files** — Component and utility tests colocated with the relevant feature.
- **`package.json`** — JavaScript dependencies and scripts, such as starting the development server or running tests.
- **`vite.config.js`** — Configuration for Vite, the frontend development server and build tool.

## Python SDK — `sdk/`

The SDK lets other Python programs call the Event Booking API through a client generated from FastAPI's OpenAPI document.

- **`event_sdk/`** — Generated installable Python package, including API classes, request/response models, HTTP client, and configuration.
- **`test/`** — Tests generated alongside the SDK.
- **`docs/`** — API and model reference generated from the OpenAPI document.
- **`pyproject.toml`** — Generated package metadata and runtime dependencies.
- **`README.md`** — Generator-provided package information; see the [Python SDK guide](./python-sdk.md) and [SDK_USAGE.md](../sdk/SDK_USAGE.md) for project-specific concepts, generation, and usage steps.
- **`../scripts/generate_sdk.sh`** — Regenerates the SDK from the running backend's `/openapi.json` endpoint.

## Project-level files and folders

- **`scripts/`** — Repeatable helper commands for tasks such as starting the app, running checks, or generating an API client.
- **`setupdev.bat`** — Prepares the backend virtual environment and dependencies, applies database migrations, and installs frontend packages on Windows.
- **`runapplication.bat`** — Starts the FastAPI backend and React development server in separate Windows terminal windows.
- **`docs/`** — Project-specific documentation, such as API usage and system design notes.
- **`.github/workflows/`** — GitHub Actions automation for tasks such as running tests and lint checks on changes.
- **`.env.example`** — A top-level template for configuration shared across project components.
- **`.gitignore`** — Tells Git which generated files and local-only files not to track, such as virtual environments, build output, and secret environment files.
- **`docker-compose.yml`** — Optionally starts multiple local services together, such as the backend and a database.
- **`Makefile`** — Provides short aliases for common development commands, if the team wants them.
- **`README.md`** — The project’s main guide: what it does, prerequisites, setup, and how to run its components.

## How the pieces work together

A user browses events in the React frontend. The frontend calls a FastAPI endpoint. The endpoint validates the request using a schema, calls the relevant service, and the service uses a repository to read or update the database. FastAPI returns a response matching its schema, and the frontend displays it. A separate Python program can perform similar API operations through the Python SDK.

This structure is a guide to where responsibilities belong. Individual files and feature folders can be added as the corresponding functionality is implemented.
