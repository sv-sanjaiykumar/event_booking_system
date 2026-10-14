# Frontend files and data flow

## Application and routing

- `src/main.jsx` mounts the app in React Router and the shared authentication provider.
- `src/app/AppRoutes.jsx` declares public discovery and event-detail routes, authentication routes, and role-protected attendee and creator pages.
- `src/app/App.jsx` preserves the Gather event-discovery page, filters, availability refresh, authenticated booking flow, and server-backed booking section.
- `src/styles.css` contains shared Gather styling, responsive layouts, dialogs, dashboards, and form states.

## Authentication

- `src/api/client.js` configures the shared Axios instance, sends the short-lived bearer token from tab-scoped session storage, and handles expired sessions.
- `src/features/auth/authApi.js` holds the register, login, logout, and current-profile API calls.
- `src/features/auth/AuthProvider.jsx` restores a session by calling the backend profile endpoint, exposes the authenticated user and actions, and clears state on logout or expiry.
- `src/features/auth/useAuth.js` provides the shared auth context.
- `src/features/auth/RoleRoute.jsx` blocks protected routes until session initialization finishes and checks the role returned by the API.
- `src/features/auth/LoginPage.jsx` and `RegisterPage.jsx` provide accessible, validated authentication forms.
- `src/features/auth/AccountHeader.jsx` provides role-aware navigation and sign-out.

The bearer token is tab-scoped and never used to decide a role; the frontend loads the current profile from the API. Backend checks remain authoritative for all protected actions.

## Events and bookings

- `src/features/events/eventApi.js` contains Axios calls for paginated public event discovery/details, creator events, event mutation, creator-visible bookings, attendee bookings, and booking/cancellation.
- `src/features/events/useEvents.js` loads events and refreshes availability while the document is visible.
- `src/components/EventCard.jsx` renders event information and availability and links to event details.
- `src/features/events/EventDetailsPage.jsx` shows a public event detail view and supports attendee booking.
- `src/features/events/CreatorDashboard.jsx` loads only the signed-in creator's events and exposes event editing, cancellation, capacity, attendee booking details, and per-event Excel attendee exports.
- `src/features/events/exportEventBookings.js` creates and downloads an `.xlsx` workbook using only the attendee fields returned by the creator-authorized API.
- `src/features/events/CreateEventPage.jsx` provides a dedicated creator-only page for publishing events; `EventForm.jsx` shares event field validation and timezone conversion with event editing.
- `src/features/bookings/AttendeeDashboard.jsx` displays booking history fetched from the backend.
- `src/features/bookings/MyBookings.jsx` presents booking references, event details, booking time, status, and eligible cancellation controls.
- `src/features/bookings/BookingDialog.jsx` confirms an authenticated attendee booking without accepting an attendee name from the browser.
- `src/features/bookings/CancelBookingDialog.jsx` provides the in-app cancellation confirmation and error state.

All event and booking data is retrieved and changed through FastAPI. Booking history is not stored in browser storage.

## Tests and local run

- `src/app/App.test.jsx` covers discovery, authenticated booking, cancellation, and availability refresh.
- `src/features/auth/AuthFlows.test.jsx` covers registration/login, role routing, session restoration, expiry, and logout.
- `src/features/events/CreatorDashboard.test.jsx` covers creator-scoped events, attendee details, and cancellation confirmation.
- `src/features/events/CreateEventPage.test.jsx` covers event validation, API submission, and returning to the creator dashboard.

Run `npm test` and `npm run build` from `frontend/`. Set `VITE_API_BASE_URL` in `.env` to the backend API origin when it is not `http://127.0.0.1:8000`.
