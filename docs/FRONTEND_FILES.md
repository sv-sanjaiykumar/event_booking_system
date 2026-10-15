# Frontend Files: Purpose and Data Flow

The React frontend uses Axios to call FastAPI for event, account, and booking
data. It does not access SQLite directly. Run `npm install` and `npm run dev`
from `frontend/`; see [the frontend guide](../frontend/README.md) for setup,
configuration, roles, and features.

## Application and API access

- **`src/main.jsx`** mounts the React application and global styles.
- **`src/app/App.jsx`** defines public and role-protected routes.
- **`src/api/client.js`** configures Axios and user-facing API error handling.
- **`src/features/auth/AuthProvider.jsx`** manages the short-lived access token
  in tab-scoped `sessionStorage` and restores the account through `/auth/me`.
- **`src/features/auth/RoleRoute.jsx`** protects attendee and creator pages;
  the API remains responsible for final authorization.

## Events

- **`src/features/events/eventApi.js`** contains event API calls for public
  discovery and details, creation and updates, creator events, cancellations,
  and creator-only event bookings.
- **`src/features/events/useEvents.js`** loads and refreshes public event data
  and seat availability.
- **`src/features/events/EventForm.jsx`** validates and submits event name,
  description, date/time, capacity, and optional venue address. The same form
  supports event creation and creator edits.
- **`src/features/events/CreateEventPage.jsx`** hosts creator event creation.
- **`src/features/events/EventDetailsPage.jsx`** shows event details and
  location, opens the booking dialog, and refreshes after booking.
- **`src/components/EventCard.jsx`** shows discovery information, including
  the optional address and current seat availability.
- **`src/features/events/CreatorDashboard.jsx`** shows owned events, supports
  edits and cancellation, lists attendee seats, and starts the Excel export.
- **`src/features/events/exportEventBookings.js`** creates a workbook with one
  row per attendee seat, including seat number and booking reference.

## Bookings and attendee account

- **`src/features/bookings/BookingDialog.jsx`** lets an attendee choose the
  number of seats, enter a name for each, choose whether one seat is for their
  own account, and confirm the assignment before the API request.
- **`src/features/bookings/AttendeeDashboard.jsx`** loads the attendee's
  server-side booking history.
- **`src/features/bookings/MyBookings.jsx`** displays bookings and individual
  seat numbers and names.
- **`src/features/bookings/CancelBookingDialog.jsx`** confirms full or selected
  seat cancellation before calling the API.

The backend enforces one self ticket per attendee per event. The attendee can
still make guest-only bookings. Cancellation releases only the selected seats;
the API then refreshes the event's availability.

## Request flows

### Create or edit an event

1. A creator opens the creation page or chooses to edit an owned event.
2. `EventForm.jsx` validates the fields and sends an optional `location` with
   the event data.
3. `eventApi.js` sends `POST /events/` or `PATCH /events/{event_id}`.
4. The API validates and saves the event; event cards and detail pages display
   the returned address when present.

### Book seats

1. An attendee opens an event and selects **Book a spot**.
2. `BookingDialog.jsx` collects attendee names and the self-booking choice.
3. `eventApi.js` sends the confirmed seat quantity, attendee names, and
   `includes_booker` value to `POST /events/{event_id}/book`.
4. The API reserves capacity, assigns distinct event seat numbers, and enforces
   the one-self-ticket-per-event rule.
5. The frontend reloads event availability and the attendee booking history.

### View and export event bookings

1. A creator opens **View bookings** for an event they own.
2. The dashboard fetches `GET /creator/events/{event_id}/bookings` and renders
   each attendee seat as a separate row.
3. The Excel export uses the same booking response and includes one row for
   each seat.

## Responsive design

**`src/styles.css`** contains the visual system, responsive layouts, form
states, and accessible focus and reduced-motion styles.
