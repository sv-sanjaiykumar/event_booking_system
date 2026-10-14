import { useEffect, useRef } from "react";

export default function BookingDialog({ event, onClose, onSubmit, isSaving, error }) {
  const submitRef = useRef(null);

  useEffect(() => {
    submitRef.current?.focus();
    const handleKeyDown = (keyboardEvent) => {
      if (keyboardEvent.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

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
        <h2 id="booking-title">You’re almost there.</h2>
        <p className="booking-dialog__event">{event.name}</p>
        <p className="booking-dialog__date">{event.dateLabel}</p>
        <div className="booking-dialog__identity">
          Booking as <strong>{event.attendeeName}</strong>
          <p className="field-hint">
            Your booking will be linked to your signed-in attendee account.
          </p>
        </div>
        {error && <p className="form-message form-message--error" role="alert">{error}</p>}
        <form onSubmit={(eventObject) => { eventObject.preventDefault(); onSubmit(); }}>
          <button
            ref={submitRef}
            className="button button--dark booking-dialog__submit"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving your spot…" : "Confirm booking"}
            {!isSaving && <span aria-hidden="true">↗</span>}
          </button>
        </form>
      </section>
    </div>
  );
}
