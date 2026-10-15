import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreatorDashboard from "./CreatorDashboard.jsx";
import {
  cancelEvent,
  fetchAllCreatorEvents,
  fetchEventBookings,
  updateEvent,
} from "./eventApi.js";
import { downloadEventBookings } from "./exportEventBookings.js";

vi.mock("../auth/useAuth.js", () => ({
  useAuth: () => ({
    user: {
      id: 11,
      name: "Casey Creator",
      email: "casey@example.com",
      role: "creator",
    },
    logout: vi.fn(),
  }),
}));

vi.mock("./eventApi.js", () => ({
  cancelEvent: vi.fn(),
  fetchAllCreatorEvents: vi.fn(),
  fetchEventBookings: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("./exportEventBookings.js", () => ({
  downloadEventBookings: vi.fn(),
}));

const ownEvent = {
  id: 7,
  name: "Garden Workshop",
  description: "Grow something together.",
  total_seats: 12,
  available_seats: 9,
  date: "2030-11-28T10:00:00Z",
  status: "published",
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <CreatorDashboard />
    </MemoryRouter>,
  );
}

describe("creator dashboard", () => {
  beforeEach(() => {
    fetchAllCreatorEvents.mockResolvedValue([ownEvent]);
    fetchEventBookings.mockResolvedValue([
      {
        id: 33,
        event_id: ownEvent.id,
        user_name: "Attendee Name",
        quantity: 2,
        attendee_names: ["Attendee Name", "Guest Name"],
        booking_date: "2026-10-14T03:00:00Z",
      },
      {
        id: 34,
        event_id: ownEvent.id,
        user_name: "Another Attendee",
        booking_date: "2026-10-14T03:10:00Z",
      },
      {
        id: 35,
        event_id: ownEvent.id,
        user_name: "Third Attendee",
        booking_date: "2026-10-14T03:20:00Z",
      },
    ]);
    updateEvent.mockResolvedValue(ownEvent);
    cancelEvent.mockResolvedValue(undefined);
  });

  it("shows events and attendee details returned by the creator-only APIs", async () => {
    renderDashboard();

    expect(await screen.findByRole("heading", { name: ownEvent.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create event" })).toHaveAttribute(
      "href",
      "/creator/events/new",
    );
    expect(screen.queryByRole("button", { name: "Publish event" })).not.toBeInTheDocument();
    expect(screen.getAllByText("3")).toHaveLength(3);
    expect(
      document.querySelector(".creator-event__metrics").textContent,
    ).toContain("3 booked");
    expect(fetchAllCreatorEvents).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download attendees" }));
    await waitFor(() => {
      expect(downloadEventBookings).toHaveBeenCalledWith(
        ownEvent,
        expect.arrayContaining([
          expect.objectContaining({ id: 33, user_name: "Attendee Name" }),
        ]),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "View bookings (3)" }));
    expect(await screen.findByText(/Booked by Attendee Name/)).toBeInTheDocument();
    expect(screen.getByText(/Seat 2: Guest Name/)).toBeInTheDocument();
    expect(screen.getByText("Booking #33")).toBeInTheDocument();
    expect(screen.queryByText("attendee@example.com")).not.toBeInTheDocument();
  });

  it("disables attendee export when an event has no bookings", async () => {
    fetchEventBookings.mockResolvedValueOnce([]);
    renderDashboard();

    await screen.findByRole("heading", { name: ownEvent.name });
    expect(screen.getByRole("button", { name: "Download attendees" })).toBeDisabled();
    expect(downloadEventBookings).not.toHaveBeenCalled();
  });

  it("explains the empty creator state and links to event creation", async () => {
    fetchAllCreatorEvents.mockResolvedValueOnce([]);
    renderDashboard();

    expect(
      await screen.findByRole("heading", {
        name: "No events are connected to your creator account yet.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Events created before creator ownership/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first event" }),
    ).toHaveAttribute("href", "/creator/events/new");
  });

  it("confirms event cancellation before calling the API", async () => {
    renderDashboard();
    await screen.findByRole("heading", { name: ownEvent.name });

    fireEvent.click(screen.getByRole("button", { name: "Cancel event" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Cancel this event?",
    });
    expect(cancelEvent).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel event" }));

    await waitFor(() => expect(cancelEvent).toHaveBeenCalledWith(ownEvent.id));
  });
});
