import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { getApiErrorMessage } from "../../api/client.js";
import { formatEventDate } from "../../components/EventCard.jsx";
import AccountHeader from "../auth/AccountHeader.jsx";
import { useAuth } from "../auth/useAuth.js";
import EventForm from "./EventForm.jsx";
import { downloadEventBookings } from "./exportEventBookings.js";
import {
  cancelEvent,
  fetchAllCreatorEvents,
  fetchEventBookings,
  updateEvent,
} from "./eventApi.js";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [eventBookings, setEventBookings] = useState({});
  const [eventBookingErrors, setEventBookingErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventToCancel, setEventToCancel] = useState(null);
  const [isCancellingEvent, setIsCancellingEvent] = useState(false);
  const keepEventButtonRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const ownedEvents = await fetchAllCreatorEvents();
      setEvents(ownedEvents);
      const results = await Promise.all(
        ownedEvents.map(async (event) => {
          try {
            return [event.id, await fetchEventBookings(event.id), ""];
          } catch (requestError) {
            return [
              event.id,
              [],
              getApiErrorMessage(
                requestError,
                `Bookings for ${event.name} could not be loaded.`,
              ),
            ];
          }
        }),
      );
      setEventBookings(
        Object.fromEntries(results.map(([id, bookings]) => [id, bookings])),
      );
      const bookingErrors = Object.fromEntries(
        results.filter(([, , issue]) => issue).map(([id, , issue]) => [id, issue]),
      );
      setEventBookingErrors(bookingErrors);
      const errors = results.map(([, , issue]) => issue).filter(Boolean);
      if (errors.length) setError(errors.join(" "));
    } catch (requestError) {
      setEvents([]);
      setEventBookings({});
      setEventBookingErrors({});
      setError(
        getApiErrorMessage(requestError, "Your events could not be loaded."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!eventToCancel) return undefined;
    keepEventButtonRef.current?.focus();
    function handleDialogKeys(keyboardEvent) {
      if (keyboardEvent.key === "Escape" && !isCancellingEvent) {
        setEventToCancel(null);
      }
      if (keyboardEvent.key === "Tab") {
        const buttons = document.querySelectorAll(
          ".event-cancel-dialog button:not(:disabled)",
        );
        const firstButton = buttons[0];
        const lastButton = buttons[buttons.length - 1];
        if (keyboardEvent.shiftKey && document.activeElement === firstButton) {
          keyboardEvent.preventDefault();
          lastButton?.focus();
        } else if (
          !keyboardEvent.shiftKey &&
          document.activeElement === lastButton
        ) {
          keyboardEvent.preventDefault();
          firstButton?.focus();
        }
      }
    }
    window.addEventListener("keydown", handleDialogKeys);
    return () => window.removeEventListener("keydown", handleDialogKeys);
  }, [eventToCancel, isCancellingEvent]);

  const totalBookings = Object.values(eventBookings).reduce(
    (total, bookings) => total + bookings.length,
    0,
  );
  const bookedSeats = events.reduce(
    (total, event) => total + event.total_seats - event.available_seats,
    0,
  );
  const availableSeats = events.reduce(
    (total, event) => total + event.available_seats,
    0,
  );

  async function handleUpdate(eventId, payload) {
    await updateEvent(eventId, payload);
    setEditingEventId(null);
    setNotice("Your event details have been updated.");
    await loadDashboard();
  }

  async function handleDownloadAttendees(event, bookings) {
    try {
      await downloadEventBookings(event, bookings);
    } catch {
      setError(`The attendee spreadsheet for ${event.name} could not be downloaded.`);
    }
  }

  async function handleCancelEvent() {
    if (!eventToCancel || isCancellingEvent) return;
    setIsCancellingEvent(true);
    setError("");
    try {
      await cancelEvent(eventToCancel.id);
      setEventToCancel(null);
      setNotice(`${eventToCancel.name} has been cancelled. Existing bookings are retained.`);
      await loadDashboard();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The event could not be cancelled."));
    } finally {
      setIsCancellingEvent(false);
    }
  }

  return (
    <div className="site-shell">
      <AccountHeader />
      <main className="dashboard content-width">
        <section className="dashboard__intro">
          <p className="eyebrow">CREATOR STUDIO</p>
          <h1>Make room for good things, {user.name.split(" ")[0]}<span>.</span></h1>
          <p>Manage your gatherings and see how the community is showing up.</p>
        </section>
        <section className="dashboard-stats" aria-label="Creator overview">
          <article className="dashboard-stat"><span>YOUR EVENTS</span><strong>{events.length}</strong></article>
          <article className="dashboard-stat"><span>BOOKINGS</span><strong>{totalBookings}</strong></article>
          <article className="dashboard-stat"><span>SEATS BOOKED</span><strong>{bookedSeats}</strong></article>
          <article className="dashboard-stat"><span>SEATS AVAILABLE</span><strong>{availableSeats}</strong></article>
        </section>

        {(notice || location.state?.notice) && (
          <p className="form-message form-message--success" role="status">
            {notice || location.state.notice}
          </p>
        )}
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}

        <section className="creator-events" aria-labelledby="creator-events-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LINEUP</p>
              <h2 id="creator-events-title">Manage your events<span>.</span></h2>
            </div>
            <button className="button button--outline" type="button" onClick={() => void loadDashboard()} disabled={loading}>
              {loading ? "Updating…" : "Refresh"}
            </button>
          </div>
          {loading ? (
            <p className="empty-bookings" role="status">Loading your events…</p>
          ) : events.length === 0 ? (
            <div className="empty-events">
              <span aria-hidden="true">✳</span>
              <h3>No events are connected to your creator account yet.</h3>
              <p>
                Events created before creator ownership was introduced remain
                unassigned. Any event you create will appear here.
              </p>
              <Link className="button button--dark empty-events__action" to="/creator/events/new">
                Create your first event <span aria-hidden="true">↗</span>
              </Link>
            </div>
          ) : (
            <div className="creator-event-list">
              {events.map((event) => {
                const bookings = eventBookings[event.id] || [];
                const isCancelled = event.status === "cancelled";
                return (
                  <article className="creator-event" key={event.id}>
                    <div className="creator-event__heading">
                      <div>
                        <p className="event-card__datetime">{formatEventDate(event.date)}</p>
                        <h3>{event.name}</h3>
                      </div>
                      <span className={isCancelled ? "event-status event-status--cancelled" : "event-status"}>
                        {isCancelled ? "Cancelled" : "Published"}
                      </span>
                    </div>
                    <p className="creator-event__description">
                      {event.description || "No event description added."}
                    </p>
                    <div className="creator-event__metrics">
                      <span><strong>{event.total_seats - event.available_seats}</strong> booked</span>
                      <span><strong>{event.available_seats}</strong> available</span>
                      <span><strong>{event.total_seats}</strong> capacity</span>
                    </div>
                    {editingEventId === event.id && !isCancelled && (
                      <EventForm
                        initial={event}
                        submitLabel="Save event"
                        onSubmit={(payload) => handleUpdate(event.id, payload)}
                        onCancel={() => setEditingEventId(null)}
                      />
                    )}
                    <div className="creator-event__actions">
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                      >
                        {expandedEventId === event.id ? "Hide bookings" : `View bookings (${bookings.length})`}
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        disabled={loading || bookings.length === 0 || Boolean(eventBookingErrors[event.id])}
                        title={
                          eventBookingErrors[event.id]
                            ? "Attendee data could not be loaded."
                            : bookings.length === 0
                              ? "There are no attendees to export."
                              : "Download attendee details as an Excel workbook."
                        }
                        onClick={() => void handleDownloadAttendees(event, bookings)}
                      >
                        Download attendees
                      </button>
                      {!isCancelled && new Date(event.date) > new Date() && (
                        <>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setEditingEventId(editingEventId === event.id ? null : event.id)}
                          >
                            {editingEventId === event.id ? "Close editor" : "Edit event"}
                          </button>
                          <button
                            className="text-button text-button--danger"
                            type="button"
                            onClick={() => setEventToCancel(event)}
                          >
                            Cancel event
                          </button>
                        </>
                      )}
                    </div>
                    {expandedEventId === event.id && (
                      bookings.length === 0 ? (
                        <p className="empty-bookings">No bookings to show for this event.</p>
                      ) : (
                        <ul className="creator-bookings">
                          {bookings.map((booking) => (
                            <li key={booking.id}>
                              <span>{booking.user_name}</span>
                              <span>{booking.quantity ?? 1} {(booking.quantity ?? 1) === 1 ? "seat" : "seats"}</span>
                              <span>Booking #{booking.id}</span>
                              <time dateTime={booking.booking_date}>
                                {new Date(booking.booking_date).toLocaleString()}
                              </time>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      {eventToCancel && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isCancellingEvent) setEventToCancel(null);
        }}>
          <section
            className="booking-dialog event-cancel-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-event-title"
            aria-describedby="cancel-event-description"
          >
            <button
              className="icon-button booking-dialog__close"
              type="button"
              aria-label="Close event cancellation dialog"
              disabled={isCancellingEvent}
              onClick={() => setEventToCancel(null)}
            >
              ×
            </button>
            <p className="eyebrow">CHANGE OF PLANS</p>
            <h2 id="cancel-event-title">Cancel this event?</h2>
            <p className="cancel-dialog__event">{eventToCancel.name}</p>
            <p className="cancel-dialog__description" id="cancel-event-description">
              The event will no longer be bookable. Existing bookings will be retained.
            </p>
            <div className="cancel-dialog__actions">
              <button ref={keepEventButtonRef} className="button button--outline" type="button" disabled={isCancellingEvent} onClick={() => setEventToCancel(null)}>
                Keep event
              </button>
              <button className="button button--cancel" type="button" disabled={isCancellingEvent} onClick={() => void handleCancelEvent()}>
                {isCancellingEvent ? "Cancelling…" : "Cancel event"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
