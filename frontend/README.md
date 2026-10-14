# Gather frontend

React + Vite event discovery and booking interface. All event and booking data is read or changed through the FastAPI HTTP API using Axios; the frontend does not connect to SQLite.

For the purpose of each frontend file and the event, booking, cancellation, and availability data flows, see [Frontend Files: Purpose and Data Flow](./FRONTEND_FILES.md).

## Run locally

From `frontend/`:

```bash
npm install
cp -n .env.example .env
npm run dev
```

Start the backend separately from `backend/`:

```bash
uvicorn app.main:app --reload
```

Open <http://127.0.0.1:5173>. The API base URL defaults to `http://127.0.0.1:8000`; set `VITE_API_BASE_URL` in `frontend/.env` if it differs. Configure the backend's `CORS_ORIGINS` to include the frontend's exact origin for browser requests.

## Features

- Public event discovery with search, filters, event details, and availability polling.
- Attendee and creator registration/login, validated using the backend profile endpoint and role.
- Attendee dashboard with server-loaded booking history and eligible cancellations.
- Creator dashboard with owned events, capacity/booking summaries, event creation and updates, cancellation, and attendee names/booking references for owned events.
- Authenticated booking; attendee identity is determined by the backend token, not a submitted name or user ID.
- In-app cancellation confirmation; booking history is removed from the screen only after the API confirms cancellation.
- Refresh availability automatically every 15 seconds while the page is visible, when the tab becomes active, and manually with the refresh button.
- Layout adapts to mobile, tablet, and desktop and supports keyboard focus and reduced-motion preferences.

## Authentication and roles

The frontend uses the backend's bearer-token contract. The short-lived access token is stored in tab-scoped `sessionStorage` so a reload can restore the session; on initialization, the UI calls `GET /auth/me` and trusts only the returned user profile for role-based routing. Tokens are not stored in `localStorage`, shown in the UI, or logged. A `401` clears the tab session and redirects protected pages to sign-in; logout calls the backend to revoke the session and clears the local token. Keep the backend JWT secret private and use HTTPS in production.

The root route `/` redirects to event discovery at `/events`. Public event routes are `/events` and `/events/:eventId`; authentication routes are `/login` and `/register`. Protected routes include `/attendee/dashboard`, `/creator/dashboard`, and the creator-only `/creator/events/new` event creation page. API role and ownership checks remain authoritative; hiding UI controls does not grant access.

Registration accepts attendee or creator roles, matching backend validation. Passwords must be at least 12 characters with at least three of lowercase, uppercase, digits, and symbols. Event booking does not accept an attendee name or quantity: the backend associates one seat with the authenticated attendee. Event dates entered by creators are converted from local browser time to an ISO timestamp with a UTC offset.

Creator event names must start with a letter and may contain only letters, numbers, and spaces. The frontend checks this before submission and the backend validates it for all API requests.

The frontend only accesses event and booking data through Axios and the FastAPI API. Booking history is fetched from `GET /bookings/me`; it is not cached in browser storage.

Creators can download an `.xlsx` attendee workbook for each of their events from the creator dashboard. The export contains the event name/date and attendee name, booking reference, and booking timestamp returned by the creator-only bookings API; it does not include attendee email addresses.

## Checks

```bash
npm test
npm run build
```
