pip install -e ".[test]"# Event Booking System

This project is organized as a monorepo containing a FastAPI backend, React frontend, and Python SDK.

See [the project structure guide](./docs/project-structure.md) for an explanation of the folders and files and how the application components work together.

For FastAPI setup, endpoint details, and backend tests, see the [backend guide](./backend/README.md).

For frontend installation, local development, and browser-based booking features, see the [frontend guide](./frontend/README.md).

The Python client is generated from the live OpenAPI schema. See the [Python SDK concept and usage guide](./docs/python-sdk.md) and the [SDK package instructions](./sdk/SDK_USAGE.md).

For Windows development setup and one-command startup, see the [Windows setup guide](./docs/windows-development-setup.md). Run [`setupdev.bat`](./setupdev.bat) once to prepare dependencies and [`runapplication.bat`](./runapplication.bat) to start the backend and frontend.