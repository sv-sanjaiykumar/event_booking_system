import { AxiosError } from "axios";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DiscoveryPage from "./App.jsx";
import {
  bookEvent,
  cancelBooking,
  fetchEvents,
  fetchMyBookings,
} from "../features/events/eventApi.js";

const { auth } = vi.hoisted(() => ({
  auth: { user: { id: 1, name: "Alex Morgan", role: "attendee" } },
}));

vi.mock("../features/auth/useAuth.js", () => ({
  useAuth: () => auth,
}));

vi.mock("../features/events/eventApi.js", () => ({
  bookEvent: vi.fn(),
  cancelBooking: vi.fn(),
  fetchEvents: vi.fn(),
  fetchMyBookings: vi.fn(),
}));

const event = {
  id: 1,
  name: "Neighbourhood Supper",
  description: "A shared table and good conversation.",
  total_seats: 4,
  available_seats: 2,
  date: "2026-11-20T18:00:00Z",
};

const booking = {
  id: 24,
  event_id: 1,
  user_name: "Alex Morgan",
  booking_date: "2026-10-13T12:30:00Z",
  event_name: event.name,
  event_date: event.date,
  event_status: "published",
};

function renderDiscovery() {
  return render(
    <MemoryRouter>
      <DiscoveryPage />
    </MemoryRouter>,
  );
}

describe("public event discovery", () => {
  beforeEach(() => {
    auth.user = { id: 1, name: "Alex Morgan", role: "attendee" };
    fetchEvents.mockResolvedValue([event]);
    fetchMyBookings.mockResolvedValue([]);
    bookEvent.mockResolvedValue({
      id: 24,
      event_id: event.id,
      user_name: "Alex Morgan",
      booking_date: "2026-10-13T12:30:00Z",
    });
    cancelBooking.mockResolvedValue(undefined);
  });

  it("shows events and seat availability fetched from the API", async () => {
    renderDiscovery();

    expect(await screen.findByRole("heading", { name: event.name })).toBeInTheDocument();
    expect(screen.getByText("2 spots left")).toBeInTheDocument();
    expect(fetchEvents).toHaveBeenCalled();
  });

  it("books with authenticated identity through the API", async () => {
    renderDiscovery();

    fireEvent.click(await screen.findByRole("button", { name: /book your last spot/i }));
    expect(
      within(await screen.findByRole("dialog")).getByText("Alex Morgan"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    expect(await screen.findByText(/booking #24 is confirmed/i)).toBeInTheDocument();
    expect(bookEvent).toHaveBeenCalledWith(event.id);
    expect(fetchMyBookings).toHaveBeenCalled();
    expect(await screen.findByText("2 spots left")).toBeInTheDocument();
  });

  it("loads bookings from the backend and cancels only after confirmation", async () => {
    fetchMyBookings
      .mockResolvedValueOnce([booking])
      .mockResolvedValueOnce([]);
    renderDiscovery();

    const bookingReference = await screen.findByText(/Booking #24/);
    const bookingRow = bookingReference.closest("li");
    fireEvent.click(within(bookingRow).getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("alertdialog", { name: "Cancel this booking?" }),
    ).toBeInTheDocument();
    expect(cancelBooking).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel booking" }));

    expect(cancelBooking).toHaveBeenCalledWith(24);
    expect(await screen.findByText(/has been cancelled/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMyBookings).toHaveBeenCalledTimes(2));
    expect(document.querySelector(".booking-list li")).toBeNull();
  });

  it("keeps a server-loaded booking when cancellation is dismissed", async () => {
    fetchMyBookings.mockResolvedValueOnce([booking]);
    renderDiscovery();

    const bookingReference = await screen.findByText(/Booking #24/);
    fireEvent.click(within(bookingReference.closest("li")).getByRole("button", { name: "Cancel" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep my booking" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(cancelBooking).not.toHaveBeenCalled();
    expect(screen.getByText(/Booking #24/)).toBeInTheDocument();
  });

  it("shows cancellation failures in the confirmation popup", async () => {
    const cancellationError = new AxiosError("Request failed");
    cancellationError.response = { data: { detail: "Booking not found." } };
    cancelBooking.mockRejectedValueOnce(cancellationError);
    fetchMyBookings.mockResolvedValueOnce([booking]);
    renderDiscovery();

    const bookingReference = await screen.findByText(/Booking #24/);
    fireEvent.click(within(bookingReference.closest("li")).getByRole("button", { name: "Cancel" }));
    fireEvent.click(await screen.findByRole("button", { name: "Yes, cancel booking" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Booking not found.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Booking #24/)).toBeInTheDocument();
  });

  it("routes unauthenticated attendees to sign-in before booking", async () => {
    auth.user = null;
    renderDiscovery();

    fireEvent.click(await screen.findByRole("button", { name: /sign in to book/i }));
    expect(await screen.findByRole("heading", { name: event.name })).toBeInTheDocument();
    expect(bookEvent).not.toHaveBeenCalled();
  });

  it("refreshes seat availability when manually requested", async () => {
    renderDiscovery();
    await screen.findByRole("heading", { name: event.name });

    fireEvent.click(screen.getByRole("button", { name: "Refresh event availability" }));

    await waitFor(() => expect(fetchEvents).toHaveBeenCalledTimes(2));
  });

  it("focuses event search with the platform search shortcut", async () => {
    renderDiscovery();
    await screen.findByRole("heading", { name: event.name });

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(screen.getByRole("searchbox", { name: "Search events" })).toHaveFocus();
  });
});
