import { formatEventDate } from "../../components/EventCard.jsx";

export default function MyBookings({
  bookings,
  onCancel,
  cancellingBookingId,
  isLoading = false,
  error = "",
}) {
  return (
    <section className="my-bookings" id="my-bookings" aria-labelledby="my-bookings-title">
      <div className="my-bookings__heading">
        <div>
          <p className="eyebrow">YOUR PLANS</p>
          <h2 id="my-bookings-title">My bookings<span>.</span></h2>
        </div>
        <span className="booking-count">{bookings.length}</span>
      </div>

      {isLoading ? (
        <div className="empty-bookings" role="status">Loading your bookings…</div>
      ) : error ? (
        <div className="alert alert--error" role="alert">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-bookings">
          <span className="empty-bookings__icon" aria-hidden="true">↗</span>
          <p>Your next good story starts with a booking.</p>
          <a href="/#events">Explore events</a>
        </div>
      ) : (
        <ul className="booking-list">
          {bookings.map((booking) => {
            const attendeeNames = booking.attendee_names?.length === (booking.quantity ?? 1)
              ? booking.attendee_names
              : Array(booking.quantity ?? 1).fill(booking.user_name);
            const seatNumbers = booking.seat_numbers?.length === (booking.quantity ?? 1)
              ? booking.seat_numbers
              : Array.from({ length: booking.quantity ?? 1 }, (_, index) => index + 1);
            const canCancel = booking.event_status === "published" &&
              new Date(booking.event_date) > new Date();
            const cancelUnavailableReason = booking.event_status === "cancelled"
              ? "This event has been cancelled."
              : "This event has already started.";

            return (
              <li className="booking-row" key={booking.id}>
                <div className="booking-row__date">
                  {new Date(booking.event_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="booking-row__details">
                  <strong>{booking.event_name}</strong>
                  <span>
                    {formatEventDate(booking.event_date)} · {booking.user_name}
                  </span>
                  <small>
                    Booking #{booking.id} · {booking.event_status === "cancelled"
                      ? "Event cancelled"
                      : new Date(booking.event_date) <= new Date()
                        ? "Event completed"
                        : "Confirmed"}
                  </small>
                  <small>
                    {booking.quantity ?? 1} {(booking.quantity ?? 1) === 1 ? "seat" : "seats"} booked
                  </small>
                  <ol className="booking-row__seat-list" aria-label="Booked seats">
                    {attendeeNames.slice(0, 3).map((name, index) => (
                      <li key={`${booking.id}-seat-${index + 1}`}>
                        Seat {seatNumbers[index]}: {name}
                      </li>
                    ))}
                  </ol>
                  {attendeeNames.length > 3 && (
                    <details className="booking-row__attendees">
                      <summary>View remaining {attendeeNames.length - 3} seats</summary>
                      <ol>
                        {attendeeNames.slice(3).map((name, index) => (
                          <li key={`${booking.id}-seat-${index + 4}`}>
                            Seat {seatNumbers[index + 3]}: {name}
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                  <small>
                    Booked {new Date(booking.booking_date).toLocaleString()}
                  </small>
                </div>
                <button
                  className="text-button booking-row__cancel"
                  type="button"
                  disabled={!canCancel || cancellingBookingId === booking.id}
                  title={canCancel ? "Cancel this booking" : cancelUnavailableReason}
                  onClick={() => onCancel(booking)}
                >
                  {cancellingBookingId === booking.id ? "Cancelling…" : "Cancel"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
