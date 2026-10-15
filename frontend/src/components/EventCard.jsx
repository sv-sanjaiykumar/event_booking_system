const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const visuals = [
  { className: "event-card__visual--coral", symbol: "✳", category: "Culture" },
  { className: "event-card__visual--blue", symbol: "◒", category: "Ideas" },
  { className: "event-card__visual--green", symbol: "✳", category: "Community" },
  { className: "event-card__visual--gold", symbol: "◉", category: "Experience" },
];

export function formatEventDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export default function EventCard({
  event,
  onBook,
  isBooking,
  canBook = true,
  bookingPrompt = "Sign in to book",
}) {
  const visual = visuals[(event.id - 1) % visuals.length] || visuals[0];
  const soldOut = event.available_seats <= 0;
  const limited = !soldOut && event.available_seats <= 5;
  const fillPercentage = Math.min(
    100,
    Math.max(
      0,
      ((event.total_seats - event.available_seats) / event.total_seats) * 100,
    ),
  );

  return (
    <article className="event-card">
      <div className={`event-card__visual ${visual.className}`}>
        <span className="event-card__category">{visual.category}</span>
        <span className="event-card__art" aria-hidden="true">
          {visual.symbol}
        </span>
        <span className="event-card__date-badge">
          {new Date(event.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="event-card__body">
        <p className="event-card__datetime">{formatEventDate(event.date)}</p>
        <h3><Link to={`/events/${event.id}`}>{event.name}</Link></h3>
        <p className="event-card__description">
          {event.description || "A good gathering starts with showing up."}
        </p>
        {event.location && (
          <p className="event-card__location">⌖ {event.location}</p>
        )}

        <div className="event-card__availability">
          <div className="availability__label">
            <span className={soldOut ? "availability__sold-out" : ""}>
              {soldOut
                ? "Fully booked"
                : `${event.available_seats} ${
                    event.available_seats === 1 ? "spot" : "spots"
                  } left`}
            </span>
            <span>{event.total_seats} total</span>
          </div>
          <div
            className="availability__track"
            role="progressbar"
            aria-label={`${event.name} seats booked`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fillPercentage)}
          >
            <span style={{ width: `${fillPercentage}%` }} />
          </div>
        </div>

        <button
          className={`button ${soldOut ? "button--muted" : "button--dark"} event-card__button`}
          type="button"
          disabled={soldOut || isBooking}
          onClick={() => onBook(event)}
        >
          {soldOut
            ? "Join next time"
            : isBooking
              ? "Booking…"
              : !canBook
                ? bookingPrompt
                : limited
                ? "Book your last spot"
                : "Find your place"}
          {!soldOut && !isBooking && (
            <span aria-hidden="true" className="button__arrow">
              ↗
            </span>
          )}
        </button>
      </div>
    </article>
  );
}
import { Link } from "react-router-dom";
