# Frontend Files: Purpose and Data Flow

This guide describes the React frontend files, what they do, and how the interface talks to the FastAPI backend. The frontend uses Axios for all event and booking API operations; it never opens or reads the SQLite database directly.

## Application startup and page

- **`index.html`** — Vite's HTML entry document. It provides the page metadata and the root element where React mounts.
- **`src/main.jsx`** — Creates the React root, renders the application in `React.StrictMode`, and imports the global stylesheet.
- **`src/app/App.jsx`** — The top-level screen and UI coordinator. It composes the header, discovery hero, event filters/search, event cards, booking sections, and confirmation dialogs. It invokes the event and booking hooks/API functions, handles success and error messages, and refreshes event data after a booking or cancellation.
- **`src/styles.css`** — Global design tokens, responsive layout, event cards, buttons, status messages, loading skeletons, booking form, and the Gather-styled booking/cancellation dialogs. It includes reduced-motion and mobile layout rules.

## API access

- **`src/api/client.js`** — Creates the shared Axios client with a configurable API base URL, request timeout, and JSON headers. It also converts backend/API failures into readable user-facing messages.
- **`src/features/events/eventApi.js`** — Contains the HTTP operations:
  - `fetchEvents()` calls `GET /events/`.
  - `bookEvent()` calls `POST /events/{event_id}/book` with the required `user_name`.
  - `cancelBooking()` calls `DELETE /bookings/{booking_id}`.

Keep HTTP request code in this API layer rather than adding database access or fetch logic to visual components.

## Events feature

- **`src/features/events/useEvents.js`** — Loads event data, exposes loading/refresh/error state, prevents overlapping refresh calls, and updates availability every 15 seconds while the page is visible. It also refreshes when the tab becomes visible again and cleans up its timer/listener on unmount.
- **`src/components/EventCard.jsx`** — Displays an event's name, description, scheduled date/time, total seats, remaining seats, and booking progress. It disables booking for sold-out events and calls a parent callback when the user chooses to book.

The event date is the scheduled event time; seat availability comes from the API and is refreshed on a timer, tab focus, manual refresh, and after booking/cancellation. This is periodic polling (near-real-time), not a server push/WebSocket connection.

## Booking feature

- **`src/features/bookings/BookingDialog.jsx`** — Shows a form for the attendee name before submitting a booking. It focuses the name field when opened and can be dismissed with Escape, the close button, or clicking outside unless a booking is being submitted.
- **`src/features/bookings/CancelBookingDialog.jsx`** — Shows an in-site, Gather-styled confirmation popup instead of the browser's native `window.confirm`. Users can keep the booking or confirm cancellation. While the request is in progress, its controls are disabled; a failed cancellation is shown within the dialog. Escape, the close button, and clicking outside dismiss the dialog when no request is running.
- **`src/features/bookings/MyBookings.jsx`** — Renders this browser's saved bookings and lets a user open the cancellation confirmation dialog.
- **`src/features/bookings/useSavedBookings.js`** — Validates and stores booking IDs and display data in `localStorage` under `gather.saved-bookings.v1`.

The backend currently has no API for listing bookings by attendee. As a result, the My bookings list only includes bookings made in the same browser profile. Clearing browser storage removes this shortcut list, although it does not delete bookings from the server. Keep a booking ID if browser data may be cleared.

## Tests and tooling

- **`src/app/App.test.jsx`** — Component tests for loading events, booking, cancellation, dismissal and failure of the cancellation dialog, availability refresh, and the search keyboard shortcut. API operations are mocked so these tests do not modify the backend database.
- **`src/testSetup.js`** — Configures the test `localStorage` implementation and testing-library cleanup.
- **`vite.config.js`** — Configures React's Vite plugin, the local development server, and Vitest's jsdom test environment.
- **`package.json`** — Lists React, Axios, Vite, and test dependencies and the `dev`, `build`, `preview`, and test scripts.
- **`package-lock.json`** — Locks installed npm dependency versions to make installs reproducible.
- **`.env.example`** — Documents `VITE_API_BASE_URL`; copy it to `.env` to change the backend URL for local development.
- **`README.md`** — Quick-start commands, frontend features, environment setup, and validation commands.
- **`public/`** — Static files served directly by Vite; it is currently empty apart from its `.gitkeep`.
- **`tests/`** — Reserved for tests that are separate from the co-located `src/app/App.test.jsx`.

## Request flows

### Load events and availability

1. `src/main.jsx` mounts `App`.
2. `App` calls `useEvents()`, which calls `fetchEvents()`.
3. `eventApi.js` sends the request through the shared Axios client in `src/api/client.js`.
4. The backend returns the event list; `useEvents` stores it in React state.
5. `EventCard` displays the current counts. The hook repeats the request every 15 seconds while visible, or when the user requests a refresh.

### Make a booking

1. The user selects an event on its event card.
2. `BookingDialog` collects the required name.
3. `App` calls `bookEvent(event.id, userName)`.
4. On success, the frontend saves the returned booking ID and display details in `localStorage`, displays a success message, and refreshes event availability.
5. If the event filled before the request arrived, the backend's `409 Conflict` is shown as an error and availability is refreshed.

### Cancel a booking

1. The user chooses **Cancel** from a saved item in **My bookings**.
2. `CancelBookingDialog` asks for confirmation inside the site UI. Dismissing it makes no API request.
3. On confirmation, `App` calls `cancelBooking(booking.id)`.
4. If the API succeeds, the browser removes that booking from its saved list, displays confirmation, and refreshes availability.
5. If the API returns an error, the booking remains saved and the error appears in the confirmation popup.

## Run and verify the frontend

From `frontend/`:

```bash
npm install
cp -n .env.example .env
npm run dev
```

Run FastAPI separately from `backend/` and configure its `CORS_ORIGINS` to allow the frontend origin (by default, `http://127.0.0.1:5173` and `http://localhost:5173`).

```bash
npm test
npm run build
```
