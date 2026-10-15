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
  const attendeeNames =
    booking.attendee_names?.length === bookedQuantity
      ? booking.attendee_names
      : Array(bookedQuantity).fill(booking.user_name);
  const seatNumbers = booking.seat_numbers?.length === bookedQuantity
    ? booking.seat_numbers
    : Array.from({ length: bookedQuantity }, (_, index) => index + 1);
  const [cancellationType, setCancellationType] = useState("full");
  const [selectedSeatPositions, setSelectedSeatPositions] = useState([]);
  const cancelledSeatNumbers =
    cancellationType === "full"
      ? Array.from({ length: bookedQuantity }, (_, index) => index + 1)
      : selectedSeatPositions;

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
          Choose whether to cancel the entire booking or only specific seats.
          Cancelled seats will be returned to event availability.
        </p>
        {bookedQuantity > 1 ? (
          <fieldset className="cancel-dialog__options">
            <legend>Cancellation type</legend>
            <label>
              <input
                type="radio"
                name={`cancellation-type-${booking.id}`}
                value="full"
                checked={cancellationType === "full"}
                onChange={() => setCancellationType("full")}
                disabled={isCancelling}
              />
              Cancel all {bookedQuantity} seats
            </label>
            <label>
              <input
                type="radio"
                name={`cancellation-type-${booking.id}`}
                value="partial"
                checked={cancellationType === "partial"}
                onChange={() => setCancellationType("partial")}
                disabled={isCancelling}
              />
              Cancel specific seats
            </label>
          </fieldset>
        ) : (
          <p className="cancel-dialog__seat-summary">
            Seat {seatNumbers[0]}: {attendeeNames[0]}
          </p>
        )}
        {cancellationType === "partial" && (
          <fieldset className="cancel-dialog__options cancel-dialog__seat-options">
            <legend>Select seats to cancel</legend>
            {attendeeNames.map((name, index) => {
              const seatPosition = index + 1;
              const seatNumber = seatNumbers[index];
              return (
                <label key={seatNumber}>
                  <input
                    type="checkbox"
                    checked={selectedSeatPositions.includes(seatPosition)}
                    onChange={(event) => {
                      setSelectedSeatPositions((current) =>
                        event.target.checked
                          ? [...current, seatPosition]
                          : current.filter((selected) => selected !== seatPosition),
                      );
                    }}
                    disabled={isCancelling}
                  />
                  Seat {seatNumber}: {name}
                </label>
              );
            })}
            {selectedSeatPositions.length === bookedQuantity && (
              <p className="field-hint">
                To cancel every seat, choose “Cancel all seats” above.
              </p>
            )}
          </fieldset>
        )}
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
              cancelledSeatNumbers.length === 0 ||
              (cancellationType === "partial" &&
                cancelledSeatNumbers.length >= bookedQuantity)
            }
            onClick={() => onConfirm(cancelledSeatNumbers)}
          >
            {isCancelling
              ? "Cancelling…"
              : `Confirm cancellation of ${cancelledSeatNumbers.length} ${
                  cancelledSeatNumbers.length === 1 ? "seat" : "seats"
                }`}
          </button>
        </div>
      </section>
    </div>
  );
}
