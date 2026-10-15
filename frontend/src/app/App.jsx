import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getApiErrorMessage } from "../api/client.js";
import BrandMark from "../components/BrandMark.jsx";
import EventCard, { formatEventDate } from "../components/EventCard.jsx";
import AccountHeader from "../features/auth/AccountHeader.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import BookingDialog from "../features/bookings/BookingDialog.jsx";
import CancelBookingDialog from "../features/bookings/CancelBookingDialog.jsx";
import MyBookings from "../features/bookings/MyBookings.jsx";
import {
  bookEvent,
  cancelBooking,
  fetchMyBookings,
} from "../features/events/eventApi.js";
import { useEvents } from "../features/events/useEvents.js";

function formatUpdatedTime(date) {
  if (!date) return "Waiting for updates";
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

export default function DiscoveryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { events, error, isLoading, isRefreshing, lastUpdated, refresh } =
    useEvents();
  const [bookings, setBookings] = useState([]);
  const [bookingsError, setBookingsError] = useState("");
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancellationError, setCancellationError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const searchInput = useRef(null);

  const refreshBookings = useCallback(async () => {
    if (!user || user.role !== "attendee") {
      setBookings([]);
      setBookingsError("");
      setIsLoadingBookings(false);
      return;
    }
    setIsLoadingBookings(true);
    setBookingsError("");
    try {
      setBookings(await fetchMyBookings());
    } catch (requestError) {
      setBookingsError(
        getApiErrorMessage(requestError, "Your bookings could not be loaded."),
      );
    } finally {
      setIsLoadingBookings(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    void refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    const handleSearchShortcut = (keyboardEvent) => {
      if (
        (keyboardEvent.metaKey || keyboardEvent.ctrlKey) &&
        keyboardEvent.key.toLowerCase() === "k"
      ) {
        keyboardEvent.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return events.filter((event) => {
      const matchesQuery =
        !normalizedQuery ||
        `${event.name} ${event.description || ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && event.available_seats > 0);
      return matchesQuery && matchesFilter;
    });
  }, [events, filter, query]);

  async function handleBook(quantity, attendeeNames, includesBooker) {
    if (!selectedEvent) return;
    const event = selectedEvent;
    setIsSaving(true);
    setActionError("");
    setNotice("");
    try {
      const booking = await bookEvent(
        event.id,
        quantity,
        attendeeNames,
        includesBooker,
      );
      setSelectedEvent(null);
      setNotice(
        `You’re in! Booking #${booking.id} for ${booking.quantity} ${
          booking.quantity === 1 ? "seat" : "seats"
        } is confirmed for ${event.name}.`,
      );
      await Promise.all([refresh(), refreshBookings()]);
    } catch (bookingError) {
      setActionError(
        getApiErrorMessage(bookingError, "Your booking could not be completed."),
      );
      if (bookingError?.response?.status === 409) await refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmCancelBooking(seatNumbers) {
    if (!bookingToCancel) return;
    const booking = bookingToCancel;
    const cancelledQuantity = seatNumbers.length;
    const remainingQuantity = (booking.quantity ?? 1) - cancelledQuantity;
    setCancellingBookingId(booking.id);
    setCancellationError("");
    setActionError("");
    setNotice("");
    try {
      await cancelBooking(booking.id, seatNumbers);
      setBookingToCancel(null);
      setNotice(
        `${cancelledQuantity} ${
          cancelledQuantity === 1 ? "seat has" : "seats have"
        } been cancelled from booking #${booking.id}. ${
          remainingQuantity > 0
            ? `${remainingQuantity} ${
                remainingQuantity === 1 ? "seat remains" : "seats remain"
              } booked.`
            : "The booking is fully cancelled."
        }`,
      );
      await Promise.all([refresh(), refreshBookings()]);
    } catch (cancellationRequestError) {
      setCancellationError(
        getApiErrorMessage(
          cancellationRequestError,
          "The booking could not be cancelled.",
        ),
      );
    } finally {
      setCancellingBookingId(null);
    }
  }

  function openBooking(event) {
    setActionError("");
    setNotice("");
    if (!user) {
      navigate("/login", {
        state: { from: { pathname: `/events/${event.id}` } },
      });
      return;
    }
    if (user.role !== "attendee") {
      setActionError("Event creators cannot make attendee bookings.");
      return;
    }
    setSelectedEvent({
      ...event,
      dateLabel: formatEventDate(event.date),
      attendeeName: user.name,
    });
  }

  return (
    <div className="site-shell" id="top">
      <AccountHeader />

      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow"><span className="eyebrow__dot" /> GOOD THINGS HAPPEN TOGETHER</p>
            <h1>Make room for<br />something <em>good.</em></h1>
            <p className="hero__description">
              A little less scrolling, a little more showing up. Find the
              gatherings worth putting on your calendar.
            </p>
            <a className="button button--dark hero__button" href="#events">
              Explore what’s on <span aria-hidden="true">↓</span>
            </a>
            <div className="hero__social-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>A</span><span>M</span><span>J</span><span>+</span>
              </div>
              <p><strong>Good company, guaranteed.</strong><br />Your next favorite memory is out there.</p>
            </div>
          </div>
          <div className="hero__art" aria-label="Illustration of people gathering">
            <div className="hero-art__sun" />
            <div className="hero-art__circle hero-art__circle--one" />
            <div className="hero-art__circle hero-art__circle--two" />
            <div className="hero-art__poster">
              <span>OUT THERE<br />IS WHERE<br /><i>it happens.</i></span>
              <small>GATHER · 2026</small>
            </div>
            <div className="hero-art__spark hero-art__spark--one">✳</div>
            <div className="hero-art__spark hero-art__spark--two">✳</div>
            <div className="hero-art__caption">THE GOOD KIND OF PLANS <span>✳</span></div>
          </div>
          <div className="hero__vertical-note">MEET PEOPLE. MAKE MOMENTS.</div>
        </section>

        <div className="ticker" aria-label="Discover events">
          <div className="ticker__track">
            {Array.from({ length: 2 }, (_, loopIndex) => (
              <span className="ticker__group" key={loopIndex} aria-hidden={loopIndex === 1}>
                {["Find your people", "Try something new", "Make a little magic", "Show up for life"].map((text) => (
                  <span key={text}>{text}<i>✳</i></span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <section className="events-section content-width" id="events">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE LINEUP</p>
              <h2>Worth stepping out for<span>.</span></h2>
            </div>
            <div className="live-indicator" aria-live="polite">
              <span className={isRefreshing ? "live-indicator__dot live-indicator__dot--syncing" : "live-indicator__dot"} />
              <span>{isRefreshing ? "Updating seats" : "Live availability"}</span>
              <span className="live-indicator__time">{formatUpdatedTime(lastUpdated)}</span>
              <button
                className="icon-button refresh-button"
                type="button"
                onClick={() => void refresh()}
                aria-label="Refresh event availability"
                title="Refresh now"
              >
                ↻
              </button>
            </div>
          </div>

          {actionError && (
            <div className="alert alert--error" role="alert">
              <span>{actionError}</span>
              <button type="button" className="alert__close" onClick={() => setActionError("")} aria-label="Dismiss error">×</button>
            </div>
          )}
          {notice && (
            <div className="alert alert--success" role="status">
              <span>{notice}</span>
              <button type="button" className="alert__close" onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
            </div>
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              <span>{error}</span>
              <button className="button button--small" type="button" onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          )}

          <div className="event-tools">
            <div className="event-filters" role="group" aria-label="Filter events">
              <button
                className={filter === "all" ? "filter-chip filter-chip--active" : "filter-chip"}
                type="button"
                onClick={() => setFilter("all")}
              >
                All events <span>{events.length}</span>
              </button>
              <button
                className={filter === "available" ? "filter-chip filter-chip--active" : "filter-chip"}
                type="button"
                onClick={() => setFilter("available")}
              >
                Spots available
              </button>
            </div>
            <label className="search-field">
              <span className="search-field__icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search events</span>
              <input
                ref={searchInput}
                type="search"
                aria-label="Search events"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find your kind of thing"
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          {isLoading ? (
            <div className="event-grid" aria-label="Loading events">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="event-skeleton" key={index}>
                  <div className="event-skeleton__image shimmer" />
                  <div className="event-skeleton__line shimmer" />
                  <div className="event-skeleton__line event-skeleton__line--short shimmer" />
                  <div className="event-skeleton__button shimmer" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="event-grid">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onBook={openBooking}
                  canBook={user?.role === "attendee"}
                  bookingPrompt={user?.role === "creator" ? "For attendees" : "Sign in to book"}
                  isBooking={isSaving && selectedEvent?.id === event.id}
                />
              ))}
            </div>
          ) : (
            <div className="empty-events">
              <span aria-hidden="true">✳</span>
              <h3>{events.length ? "Nothing matches just yet." : "The calendar is taking a little breath."}</h3>
              <p>{events.length ? "Try another search or check all events." : "Check back soon for something good."}</p>
              {events.length > 0 && (
                <button className="text-button" type="button" onClick={() => { setQuery(""); setFilter("all"); }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        <section className="manifesto">
          <div className="manifesto__stamp" aria-hidden="true">GO<br />OUT<br /><span>✳</span></div>
          <div>
            <p className="eyebrow">A FRIENDLY REMINDER</p>
            <p className="manifesto__quote">“The best things rarely happen<br />when you’re just <em>thinking about it.</em>”</p>
          </div>
          <a className="manifesto__link" href="#events">Make a plan <span aria-hidden="true">↗</span></a>
        </section>

        {user?.role === "attendee" && <div className="content-width">
          <MyBookings
            bookings={bookings}
            isLoading={isLoadingBookings}
            error={bookingsError}
            onCancel={(booking) => {
              setCancellationError("");
              setBookingToCancel({
                ...booking,
                event_date_label: formatEventDate(booking.event_date),
              });
            }}
            cancellingBookingId={cancellingBookingId}
          />
        </div>}
      </main>

      <footer className="footer">
        <div className="content-width footer__inner">
          <BrandMark compact />
          <p>Less scrolling. More stories.</p>
          <span>© {new Date().getFullYear()} Gather</span>
        </div>
      </footer>

      {selectedEvent && (
        <BookingDialog
          event={selectedEvent}
          onClose={() => {
            if (!isSaving) setSelectedEvent(null);
          }}
          onSubmit={handleBook}
          isSaving={isSaving}
          error={actionError}
        />
      )}
      {bookingToCancel && (
        <CancelBookingDialog
          booking={bookingToCancel}
          onClose={() => {
            if (cancellingBookingId !== bookingToCancel.id) {
              setBookingToCancel(null);
              setCancellationError("");
            }
          }}
          onConfirm={confirmCancelBooking}
          isCancelling={cancellingBookingId === bookingToCancel.id}
          error={cancellationError}
        />
      )}
    </div>
  );
}
