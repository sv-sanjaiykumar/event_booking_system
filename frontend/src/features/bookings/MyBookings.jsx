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
          {bookings.map((booking) => (
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
                <small>
                  Booked {new Date(booking.booking_date).toLocaleString()}
                </small>
              </div>
              {booking.event_status === "published" &&
                new Date(booking.event_date) > new Date() && (
                  <button
                    className="text-button"
                    type="button"
                    disabled={cancellingBookingId === booking.id}
                    onClick={() => onCancel(booking)}
                  >
                    {cancellingBookingId === booking.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
