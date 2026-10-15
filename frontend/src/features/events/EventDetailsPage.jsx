import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getApiErrorMessage } from "../../api/client.js";
import { formatEventDate } from "../../components/EventCard.jsx";
import AccountHeader from "../auth/AccountHeader.jsx";
import { useAuth } from "../auth/useAuth.js";
import BookingDialog from "../bookings/BookingDialog.jsx";
import { bookEvent, fetchEvent, fetchMyBookings } from "./eventApi.js";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  async function loadEvent() {
    setIsLoading(true);
    setError("");
    try {
      setEvent(await fetchEvent(eventId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "This event could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEvent();
  }, [eventId]);

  async function confirmBooking(quantity) {
    if (!event || isBooking) return;
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }
    if (user.role !== "attendee") {
      setError("Only attendee accounts can book an event.");
      return;
    }
    setIsBooking(true);
    setError("");
    let booking;
    try {
      booking = await bookEvent(event.id, quantity);
      setShowBookingDialog(false);
      setNotice(
        `Booking #${booking.id} for ${booking.quantity} ${
          booking.quantity === 1 ? "seat" : "seats"
        } is confirmed. It’s in My bookings.`,
      );
    } catch (requestError) {
      if (requestError?.response?.status === 409) {
        await loadEvent();
      }
      setError(getApiErrorMessage(requestError, "Your booking could not be completed."));
      setIsBooking(false);
      return;
    }
    try {
      await Promise.all([loadEvent(), fetchMyBookings()]);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          `Booking #${booking.id} succeeded, but the booking history could not be refreshed.`,
        ),
      );
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="site-shell">
      <AccountHeader />
      <main className="event-detail content-width">
        <Link className="topbar__link" to="/events">← Back to events</Link>
        {isLoading ? (
          <p className="auth-loading" role="status">Loading event…</p>
        ) : error && !event ? (
          <div className="alert alert--error" role="alert">
            {error} <Link to="/events">Return to discovery</Link>
          </div>
        ) : event && (
          <article className="event-detail__card">
            <p className="eyebrow">THE GATHERING</p>
            <h1>{event.name}</h1>
            <p className="event-detail__date">{formatEventDate(event.date)}</p>
            <p className="event-detail__description">
              {event.description || "A good gathering starts with showing up."}
            </p>
            <div className="dashboard-stats">
              <div className="dashboard-stat">
                <span>AVAILABLE SPOTS</span>
                <strong>{event.available_seats}</strong>
              </div>
              <div className="dashboard-stat">
                <span>TOTAL CAPACITY</span>
                <strong>{event.total_seats}</strong>
              </div>
            </div>
            {notice && <p className="form-message form-message--success" role="status">{notice}</p>}
            {error && <p className="form-message form-message--error" role="alert">{error}</p>}
            <button
              className="button button--dark"
              type="button"
              disabled={event.available_seats < 1 || user?.role === "creator"}
              onClick={() => {
                if (!user) {
                  navigate("/login", { state: { from: { pathname: `/events/${eventId}` } } });
                } else if (user.role !== "attendee") {
                  setError("Only attendee accounts can book an event.");
                } else {
                  setShowBookingDialog(true);
                }
              }}
            >
              {event.available_seats < 1
                ? "Fully booked"
                : user?.role === "attendee"
                  ? "Book a spot"
                  : user?.role === "creator"
                    ? "Attendees only"
                    : "Sign in to book"}
            </button>
          </article>
        )}
      </main>
      {showBookingDialog && event && (
        <BookingDialog
          event={{ ...event, dateLabel: formatEventDate(event.date), attendeeName: user.name }}
          onClose={() => {
            if (!isBooking) setShowBookingDialog(false);
          }}
          onSubmit={confirmBooking}
          isSaving={isBooking}
          error={error}
        />
      )}
    </div>
  );
}
