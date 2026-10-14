import { useState } from "react";

import { getApiErrorMessage } from "../../api/client.js";

function eventPayload(formData) {
  const eventName = formData.name.trim();
  const [firstCharacter, ...remainingCharacters] = eventName;
  if (
    !firstCharacter ||
    !/^\p{L}$/u.test(firstCharacter) ||
    remainingCharacters.some((character) => !/^[\p{L}\p{N} ]$/u.test(character))
  ) {
    throw new Error(
      "Event name must start with a letter and contain only letters, numbers, and spaces.",
    );
  }
  const date = new Date(formData.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Choose a valid event date and time.");
  }
  if (date <= new Date()) {
    throw new Error("The event date must be in the future.");
  }
  const totalSeats = Number(formData.total_seats);
  if (!Number.isInteger(totalSeats) || totalSeats < 1) {
    throw new Error("Capacity must be a positive whole number.");
  }
  return {
    name: eventName,
    description: formData.description.trim() || null,
    total_seats: totalSeats,
    date: date.toISOString(),
  };
}

function toLocalDateTime(value) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EventForm({ initial = {}, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [date, setDate] = useState(
    initial.date ? toLocalDateTime(initial.date) : "",
  );
  const [totalSeats, setTotalSeats] = useState(
    initial.total_seats ? String(initial.total_seats) : "",
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    let payload;
    try {
      payload = eventPayload({
        name,
        description,
        date,
        total_seats: totalSeats,
      });
    } catch (validationError) {
      setError(validationError.message);
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await onSubmit(payload);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "The event could not be saved. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  const fieldId = (field) => `${initial.id ? `edit-${field}-${initial.id}` : `create-event-${field}`}`;

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      {error && <p className="form-message form-message--error" role="alert">{error}</p>}
      <label htmlFor={fieldId("name")}>Event name</label>
      <input
        id={fieldId("name")}
        required
        maxLength={200}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <p className="field-hint">
        Start with a letter. Use only letters, numbers, and spaces.
      </p>
      <label htmlFor={fieldId("description")}>Description</label>
      <textarea
        id={fieldId("description")}
        maxLength={5000}
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <label htmlFor={fieldId("date")}>Event date and time</label>
      <input
        id={fieldId("date")}
        type="datetime-local"
        required
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <p className="field-hint">Your local time zone is converted to a timezone-aware UTC date for the API.</p>
      <label htmlFor={fieldId("capacity")}>Total seat capacity</label>
      <input
        id={fieldId("capacity")}
        type="number"
        min="1"
        step="1"
        required
        value={totalSeats}
        onChange={(event) => setTotalSeats(event.target.value)}
      />
      <div className="event-form__actions">
        <button className="button button--dark" type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button className="button button--outline" type="button" onClick={onCancel} disabled={isSaving}>
            Keep current details
          </button>
        )}
      </div>
    </form>
  );
}
