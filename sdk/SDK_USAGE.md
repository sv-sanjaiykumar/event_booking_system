# Event Booking Python SDK

The `event_sdk` package in this directory is generated from the FastAPI
OpenAPI document with OpenAPI Generator. Do not hand-edit generated client
code; change the API schema and regenerate the SDK instead.

## Generate or regenerate

Start the backend from `backend/`:

```bash
uvicorn app.main:app --reload
```

Install the generator CLI if needed, then run the repository script:

```bash
npm install -g @openapitools/openapi-generator-cli
../scripts/generate_sdk.sh
```

The script reads `http://127.0.0.1:8000/openapi.json`, uses the Python client
generator, and writes the generated package here. Set `OPENAPI_URL` if the API
is running at another address:

```bash
OPENAPI_URL=http://localhost:8000/openapi.json ../scripts/generate_sdk.sh
```

## Install

Use Python 3.10 or newer, as required by the generated package:

```bash
python -m pip install .
```

## Browse public events

The method names come from the operation IDs in the OpenAPI schema. For this
API, the generated method for `GET /events/` is
`list_events_events_get`.

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

## Call authenticated operations

Login with the generated authentication API, then use the returned bearer
token in the configuration for protected API operations:

```python
import os

from event_sdk import ApiClient, Configuration, UserLogin
from event_sdk.api.authentication_api import AuthenticationApi
from event_sdk.api.events_api import EventsApi

configuration = Configuration(host="http://127.0.0.1:8000")
with ApiClient(configuration) as client:
    auth_api = AuthenticationApi(client)
    token = auth_api.login_auth_login_post(
        UserLogin(
            email="attendee@example.com",
            password=os.environ["EVENT_API_PASSWORD"],
        )
    )

authenticated_configuration = Configuration(
    host="http://127.0.0.1:8000",
    access_token=token.access_token,
)
with ApiClient(authenticated_configuration) as client:
    events_api = EventsApi(client)
    events = events_api.list_events_events_get(page=1, page_size=20)
    print(events)
```

Use credentials from a local test account and do not hard-code real passwords
or access tokens. Generated methods and model fields reflect the OpenAPI
document at generation time; regenerate after API contract changes.

## Tests

Install the generated development dependencies and run its generated tests:

```bash
python -m pip install --group dev
pytest
```
