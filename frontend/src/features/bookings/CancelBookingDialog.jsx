import { useEffect, useRef } from "react";

export default function CancelBookingDialog({
  booking,
  onClose,
  onConfirm,
  isCancelling,
  error,
}) {
  const keepButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    keepButtonRef.current?.focus();

    function handleKeyDown(keyboardEvent) {
      if (keyboardEvent.key === "Escape" && !isCancelling) {
        onCloseRef.current();
      }

      if (keyboardEvent.key === "Tab") {
        const buttons = document.querySelectorAll(
          ".cancel-dialog button:not(:disabled)",
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

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isCancelling]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCancelling) onClose();
      }}
    >
      <section
        className="booking-dialog cancel-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <button
          className="icon-button booking-dialog__close"
          type="button"
          aria-label="Close cancellation dialog"
          disabled={isCancelling}
          onClick={onClose}
        >
          ×
        </button>
        <span className="cancel-dialog__icon" aria-hidden="true">↗</span>
        <p className="eyebrow">CHANGE OF PLANS</p>
        <h2 id="cancel-dialog-title">Cancel this booking?</h2>
        <p className="cancel-dialog__event">{booking.event_name}</p>
        <p className="booking-dialog__date">{booking.event_date_label}</p>
        <p className="cancel-dialog__description" id="cancel-dialog-description">
          Your booking will be removed and the seat will be available for
          someone else. You can always make a new plan later.
        </p>
        {error && (
          <p className="cancel-dialog__error" role="alert">
            {error}
          </p>
        )}
        <div className="cancel-dialog__actions">
          <button
            ref={keepButtonRef}
            className="button button--outline"
            type="button"
            disabled={isCancelling}
            onClick={onClose}
          >
            Keep my booking
          </button>
          <button
            className="button button--cancel"
            type="button"
            disabled={isCancelling}
            onClick={onConfirm}
          >
            {isCancelling ? "Cancelling…" : "Yes, cancel booking"}
          </button>
        </div>
      </section>
    </div>
  );
}
