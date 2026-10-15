import { useEffect, useRef, useState } from "react";

export default function CancelBookingDialog({
  booking,
  onClose,
  onConfirm,
  isCancelling,
  error,
}) {
  const keepButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const bookedQuantity = booking.quantity ?? 1;
  const [quantity, setQuantity] = useState("1");

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
        const focusableControls = document.querySelectorAll(
          ".cancel-dialog button:not(:disabled), .cancel-dialog input:not(:disabled)",
        );
        const firstButton = focusableControls[0];
        const lastButton = focusableControls[focusableControls.length - 1];
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
          Choose how many of your {bookedQuantity} booked{" "}
          {bookedQuantity === 1 ? "seat" : "seats"} to cancel. Only the seats you
          cancel will be released, and any remaining seats stay booked.
        </p>
        <label className="cancel-dialog__quantity-label" htmlFor="cancel-quantity">
          Seats to cancel
        </label>
        <input
          id="cancel-quantity"
          className="cancel-dialog__quantity"
          type="number"
          min="1"
          max={bookedQuantity}
          step="1"
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={isCancelling}
        />
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
            disabled={
              isCancelling ||
              !Number.isInteger(Number(quantity)) ||
              Number(quantity) < 1 ||
              Number(quantity) > bookedQuantity
            }
            onClick={() => onConfirm(Number(quantity))}
          >
            {isCancelling
              ? "Cancelling…"
              : `Cancel ${quantity} ${Number(quantity) === 1 ? "seat" : "seats"}`}
          </button>
        </div>
      </section>
    </div>
  );
}
