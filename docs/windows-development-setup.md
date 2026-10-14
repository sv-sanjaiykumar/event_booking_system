# Windows development setup

The repository includes [`setupdev.bat`](../setupdev.bat), a Windows batch
script that prepares the Event Booking System backend and frontend for local
development.

## What the script does

When run from the project root, the script:

1. Checks that Python and npm are available on `PATH`.
2. Creates `backend/.venv` if it does not already exist.
3. Installs the backend package and its test dependencies from
   `backend/pyproject.toml`.
4. Copies `backend/.env.example` to `backend/.env` only if `.env` does not
   already exist.
5. Creates a random local `JWT_SECRET_KEY` if `.env` contains an empty key.
   An existing non-empty key is preserved.
6. Applies the database migrations with Alembic.
7. Installs frontend dependencies with `npm install` in `frontend/`.
8. Stops with a nonzero exit code if a required setup step fails.

The script does not seed sample events or overwrite an existing environment
file or signing key.

## Prerequisites

- Windows with Python 3.9 or newer installed and available as `python`.
- Node.js and npm installed and available as `npm`.
- Internet access for installing Python and npm packages.

## Run setup

Open Command Prompt or PowerShell in the repository root and run:

```bat
setupdev.bat
```

Do not run the script from inside the `backend` or `frontend` directory. It
uses its own file location to find the project folders.

## Start the application

After successful setup, use two terminals.

Backend terminal:

```bat
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload
```

Frontend terminal:

```bat
cd frontend
npm run dev
```

Alternatively, run [`runapplication.bat`](../runapplication.bat) from the
project root. It starts Uvicorn and Vite in separate Command Prompt windows
and keeps each window open so server output and errors remain visible. Wait
until both windows report that their servers are ready before opening the
application. Close the windows or press `Ctrl+C` in each one to stop the
servers.

The frontend is served at <http://localhost:5173>. The API and interactive
OpenAPI documentation are available at <http://127.0.0.1:8000/docs>.

The automatically generated JWT signing key is only for local development.
Keep `backend/.env` private and stable between restarts; changing the key
invalidates active access tokens. Configure a separate strong secret for each
deployed environment.

## Troubleshooting

- If Python is not found, install Python and enable its PATH option, or reopen
  the terminal after updating PATH.
- If npm is not found, install Node.js (which includes npm) and reopen the
  terminal.
- If `runapplication.bat` says the virtual environment is missing, run
  `setupdev.bat` successfully first.
- If a step fails, read the error printed immediately before
  `Backend setup failed` or the npm failure. Fix that prerequisite and run
  `setupdev.bat` again; existing `.venv`, `backend/.env`, and installed npm
  packages are reused.
- Database migrations use the `DATABASE_URL` in `backend/.env` and should be
  run from `backend/`, as the script does. To insert optional sample records,
  follow [the backend seed-data instructions](../backend/README.md#loading-sample-data).

## Related documentation

- [Backend setup and API guide](../backend/README.md)
- [Frontend setup guide](../frontend/README.md)
- [Project structure guide](./project-structure.md)
- [Application runner script](../runapplication.bat)
