# Python SDK: concept, generation, and usage

## What the SDK is

The Event Booking Python SDK is a Python client for the FastAPI service. It
lets Python programs call the same HTTP API used by the React frontend without
having to manually build URLs, serialize request bodies, parse responses, or
add authentication headers for each operation.

The SDK is a client library, not a second backend. It does not read or write
SQLite directly. A typical request follows this path:

```text
Python application
    -> generated SDK method
    -> HTTP request
    -> FastAPI endpoint and validation
    -> application services and database
    -> HTTP response
    -> generated SDK model
    -> Python application
```

The backend remains the source of truth for validation, authorization,
ownership, seat availability, and database changes.

## How OpenAPI generation works

FastAPI publishes an OpenAPI document at `/openapi.json`. This document
describes the API's paths, HTTP methods, parameters, request and response
schemas, authentication requirements, and operation identifiers.

OpenAPI Generator reads that document and creates Python code from it. The
generator does not invent API behavior: it reflects the contract documented
by FastAPI. The generated client includes:

- API classes grouped by tags, such as `EventsApi`, `BookingsApi`, and
  `AuthenticationApi`.
- Python request and response models generated from the API schemas.
- An HTTP client and configuration for the server URL and bearer token.
- Generated documentation and tests.

An operation's generated Python method name is based on its OpenAPI operation
identifier. For example, `GET /events/` is exposed as
`EventsApi.list_events_events_get`. Generated names may change if the API's
operation identifiers change, so consult the generated package/docs after
updating the API contract.

## Generate or regenerate the client

The backend must be running so the generator can fetch its OpenAPI document.
From the project root, install the OpenAPI Generator CLI if it is not already
available and run the repository script:

```bash
npm install -g @openapitools/openapi-generator-cli
./scripts/generate_sdk.sh
```

The script uses `http://127.0.0.1:8000/openapi.json`, selects the `python`
generator, and writes the package to `sdk/event_sdk/`. To use a different
backend URL:

```bash
OPENAPI_URL=http://localhost:8000/openapi.json ./scripts/generate_sdk.sh
```

The generated project currently requires Python 3.10 or newer. Install the
package from its directory:

```bash
cd sdk
python -m pip install .
```

Generated source files should not be edited manually. Make API contract
changes in the FastAPI application, then regenerate the client; otherwise a
later generation can overwrite manual edits.

## Public API example

The event-list endpoint is public, so it can be called without an access
token:

```python
from event_sdk import ApiClient, Configuration
from event_sdk.api.events_api import EventsApi

configuration = Configuration(host="http://127.0.0.1:8000")

with ApiClient(configuration) as client:
    events_api = EventsApi(client)
    events = events_api.list_events_events_get(page=1, page_size=20)
    for event in events:
        print(event.name, event.available_seats)
```

The generated API returns typed model instances rather than raw dictionaries.
For example, event data can be accessed through attributes such as
`event.name` and `event.available_seats`.

## Authenticated API example

Booking, cancellation, and creator-management operations require
authentication. First call the generated login operation, then configure an
API client with the returned bearer access token:

```python
import os

from event_sdk import ApiClient, Configuration, UserLogin
from event_sdk.api.authentication_api import AuthenticationApi
from event_sdk.api.bookings_api import BookingsApi

public_configuration = Configuration(host="http://127.0.0.1:8000")
with ApiClient(public_configuration) as client:
    auth_api = AuthenticationApi(client)
    token = auth_api.login_auth_login_post(
        UserLogin(
            email=os.environ["EVENT_API_EMAIL"],
            password=os.environ["EVENT_API_PASSWORD"],
        )
    )

authenticated_configuration = Configuration(
    host="http://127.0.0.1:8000",
    access_token=token.access_token,
)
with ApiClient(authenticated_configuration) as client:
    bookings_api = BookingsApi(client)
    bookings = bookings_api.list_my_bookings_bookings_me_get()
    print(bookings)
```

Supply credentials through environment variables rather than committing them
to source control. The backend determines the account identity and role from
the token; the SDK cannot grant permissions that the account does not have.

## When to regenerate

Regenerate the SDK whenever a backend change alters the public API contract,
including:

- Adding, removing, or renaming an endpoint or HTTP operation.
- Changing query/path parameters or request-body fields.
- Changing response fields, types, or status codes.
- Changing authentication requirements or API tags.

After regeneration, review the generated operations and models, install the
package in a Python 3.10+ environment, and run the SDK's tests from `sdk/`:

```bash
python -m pip install --group dev
pytest
```

This validates the generated client package and its generated tests; API
behavior should also be covered by the backend's own tests.

## Related resources

- [SDK package usage and generation notes](../sdk/SDK_USAGE.md)
- [SDK generation script](../scripts/generate_sdk.sh)
- [Backend API setup](../backend/README.md)
