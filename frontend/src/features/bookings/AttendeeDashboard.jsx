import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getApiErrorMessage } from "../../api/client.js";
import AccountHeader from "../auth/AccountHeader.jsx";
import { useAuth } from "../auth/useAuth.js";
import CancelBookingDialog from "./CancelBookingDialog.jsx";
import MyBookings from "./MyBookings.jsx";
import { cancelBooking, fetchMyBookings } from "../events/eventApi.js";
import { formatEventDate } from "../../components/EventCard.jsx";

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancellationError, setCancellationError] = useState("");

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setBookings(await fetchMyBookings());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Your bookings could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function handleCancel(quantity) {
    if (!bookingToCancel || cancellingBookingId !== null) return;
    const booking = bookingToCancel;
    setCancellingBookingId(booking.id);
    setCancellationError("");
    try {
      await cancelBooking(booking.id, quantity);
      setBookingToCancel(null);
      await loadBookings();
    } catch (requestError) {
      setCancellationError(
        getApiErrorMessage(requestError, "The booking could not be cancelled."),
      );
    } finally {
      setCancellingBookingId(null);
    }
  }

  return (
    <div className="site-shell">
      <AccountHeader />
      <main className="dashboard content-width">
        <section className="dashboard__intro">
          <p className="eyebrow">YOUR GATHERING PLACE</p>
          <h1>Welcome, {user.name.split(" ")[0]}<span>.</span></h1>
          <p>See what you’ve booked and find the next thing worth showing up for.</p>
          <Link className="button button--dark" to="/#events">
            Explore events <span aria-hidden="true">↗</span>
          </Link>
        </section>
        <section className="dashboard-stats" aria-label="Booking overview">
          <article className="dashboard-stat">
            <span>UPCOMING BOOKINGS</span>
            <strong>{bookings.filter((booking) =>
              booking.event_status === "published" &&
              new Date(booking.event_date) > new Date(),
            ).length}</strong>
          </article>
          <article className="dashboard-stat">
            <span>ALL BOOKING REFERENCES</span>
            <strong>{bookings.length}</strong>
          </article>
        </section>
        <MyBookings
          bookings={bookings}
          isLoading={isLoading}
          error={error}
          onCancel={(booking) => {
            setCancellationError("");
            setBookingToCancel({
              ...booking,
              event_date_label: formatEventDate(booking.event_date),
            });
          }}
          cancellingBookingId={cancellingBookingId}
        />
        {error && (
          <button className="button button--outline" type="button" onClick={() => void loadBookings()}>
            Try again
          </button>
        )}
      </main>
      {bookingToCancel && (
        <CancelBookingDialog
          booking={bookingToCancel}
          onClose={() => {
            if (cancellingBookingId !== bookingToCancel.id) {
              setBookingToCancel(null);
              setCancellationError("");
            }
          }}
          onConfirm={handleCancel}
          isCancelling={cancellingBookingId === bookingToCancel.id}
          error={cancellationError}
        />
      )}
    </div>
  );
}
