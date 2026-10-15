import { useEffect, useRef, useState } from "react";

export default function BookingDialog({ event, onClose, onSubmit, isSaving, error }) {
  const submitRef = useRef(null);
  const [quantity, setQuantity] = useState("1");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    submitRef.current?.focus();
    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming, isSaving, onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(eventObject) => {
      if (eventObject.target === eventObject.currentTarget && !isSaving) onClose();
    }}>
      <section
        className="booking-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
      >
        <button
          className="icon-button booking-dialog__close"
          type="button"
          aria-label="Close booking dialog"
          disabled={isSaving}
          onClick={onClose}
        >
          ×
        </button>
        <p className="eyebrow">MAKE IT HAPPEN</p>
        <h2 id="booking-title">
          {isConfirming ? "Confirm your booking." : "You’re almost there."}
        </h2>
        <p className="booking-dialog__event">{event.name}</p>
        <p className="booking-dialog__date">{event.dateLabel}</p>
        <div className="booking-dialog__identity">
          Booking as <strong>{event.attendeeName}</strong>
          <p className="field-hint">
            Your booking will be linked to your signed-in attendee account.
          </p>
        </div>
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        {!isConfirming ? (
          <form onSubmit={(eventObject) => {
            eventObject.preventDefault();
            const seatQuantity = Number(quantity);
            if (Number.isInteger(seatQuantity) && seatQuantity >= 1 && seatQuantity <= event.available_seats) {
              setIsConfirming(true);
            }
          }}>
            <label htmlFor="booking-quantity">Number of seats</label>
            <input
              id="booking-quantity"
              type="number"
              min="1"
              max={event.available_seats}
              step="1"
              required
              value={quantity}
              onChange={(eventObject) => setQuantity(eventObject.target.value)}
              disabled={isSaving}
            />
            <p className="field-hint">
              Choose from 1 to {event.available_seats} available {event.available_seats === 1 ? "seat" : "seats"}.
            </p>
            <button
              ref={submitRef}
              className="button button--dark booking-dialog__submit"
              type="submit"
              disabled={
                isSaving ||
                !Number.isInteger(Number(quantity)) ||
                Number(quantity) < 1 ||
                Number(quantity) > event.available_seats
              }
            >
              Review booking <span aria-hidden="true">↗</span>
            </button>
          </form>
        ) : (
          <div className="booking-dialog__confirmation">
            <p role="status">
              You’re about to book {quantity} {Number(quantity) === 1 ? "seat" : "seats"} for this event.
              Your booking will be created only after you confirm below.
            </p>
            <button
              className="text-button"
              type="button"
              disabled={isSaving}
              onClick={() => setIsConfirming(false)}
            >
              Go back and change details
            </button>
            <button
              ref={submitRef}
              className="button button--dark booking-dialog__submit"
              type="button"
              disabled={isSaving}
              onClick={() => onSubmit(Number(quantity))}
            >
              {isSaving
                ? "Saving your spot…"
                : `Yes, book ${quantity} ${Number(quantity) === 1 ? "seat" : "seats"}`}
              {!isSaving && <span aria-hidden="true">↗</span>}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
