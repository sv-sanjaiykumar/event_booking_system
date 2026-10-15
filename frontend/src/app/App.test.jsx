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
  quantity: 1,
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
    bookEvent.mockImplementation(async (_eventId, quantity = 1) => ({
      id: 24,
      event_id: event.id,
      user_name: "Alex Morgan",
      quantity,
      booking_date: "2026-10-13T12:30:00Z",
    }));
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
    fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
    expect(bookEvent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, book 1 seat" }));

    expect(await screen.findByText(/booking #24 for 1 seat is confirmed/i)).toBeInTheDocument();
    expect(bookEvent).toHaveBeenCalledWith(event.id, 1, ["Alex Morgan"]);
    expect(fetchMyBookings).toHaveBeenCalled();
    expect(await screen.findByText("2 spots left")).toBeInTheDocument();
  });

  it("sends the selected number of seats when booking", async () => {
    fetchEvents
      .mockResolvedValueOnce([event])
      .mockResolvedValueOnce([{ ...event, available_seats: 0 }]);
    renderDiscovery();

    fireEvent.click(await screen.findByRole("button", { name: /book your last spot/i }));
    const seatQuantity = screen.getByLabelText("Number of seats");
    expect(seatQuantity).toHaveAttribute("max", "2");
    fireEvent.change(seatQuantity, {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Seat 2 · Guest"), {
      target: { value: "Taylor Guest" },
    });
    fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
    expect(bookEvent).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("about to book 2 seats");
    fireEvent.click(screen.getByRole("button", { name: "Yes, book 2 seats" }));

    expect(await screen.findByText(/booking #24 for 2 seats is confirmed/i)).toBeInTheDocument();
    expect(bookEvent).toHaveBeenCalledWith(event.id, 2, ["Alex Morgan", "Taylor Guest"]);
    expect(await screen.findByRole("button", { name: "Join next time" })).toBeInTheDocument();
  });

  it("prefills the booker name and allows them to change it", async () => {
    renderDiscovery();

    fireEvent.click(await screen.findByRole("button", { name: /book your last spot/i }));
    const attendeeName = screen.getByLabelText("Seat 1 · You or guest");
    expect(attendeeName).toHaveValue("Alex Morgan");
    fireEvent.change(attendeeName, { target: { value: "Alex Guest" } });
    fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
    expect(screen.getByText("Seat 1: Alex Guest")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yes, book 1 seat" }));

    expect(bookEvent).toHaveBeenCalledWith(event.id, 1, ["Alex Guest"]);
  });

  it("does not create a booking when the confirmation step is dismissed", async () => {
    renderDiscovery();

    fireEvent.click(await screen.findByRole("button", { name: /book your last spot/i }));
    fireEvent.click(screen.getByRole("button", { name: /review booking/i }));
    expect(screen.getByRole("status")).toHaveTextContent("Your booking will be created only after you confirm");
    expect(bookEvent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close booking dialog" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bookEvent).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation of 1 seat" }));

    expect(cancelBooking).toHaveBeenCalledWith(24, [1]);
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
    fireEvent.click(await screen.findByRole("button", { name: "Confirm cancellation of 1 seat" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Booking not found.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Booking #24/)).toBeInTheDocument();
  });

  it("cancels only the selected seats and keeps the rest of the booking", async () => {
    const multiSeatBooking = {
      ...booking,
      quantity: 3,
      attendee_names: ["Alex Morgan", "Taylor Guest", "Jordan Guest"],
    };
    fetchMyBookings
      .mockResolvedValueOnce([multiSeatBooking])
      .mockResolvedValueOnce([{ ...multiSeatBooking, quantity: 1 }]);
    renderDiscovery();

    const bookingReference = await screen.findByText(/Booking #24/);
    fireEvent.click(within(bookingReference.closest("li")).getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("radio", { name: "Cancel specific seats" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Seat 2: Taylor Guest" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Seat 3: Jordan Guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation of 2 seats" }));

    expect(cancelBooking).toHaveBeenCalledWith(24, [2, 3]);
    expect(await screen.findByText(/2 seats have been cancelled from booking #24/i)).toBeInTheDocument();
    expect(await screen.findByText(/1 seat booked/)).toBeInTheDocument();
    expect(screen.getByText(/Seat 1: Alex Morgan/)).toBeInTheDocument();
    expect(screen.getByText(/Booking #24/)).toBeInTheDocument();
  });

  it("offers full cancellation for all named seats in a booking", async () => {
    const multiSeatBooking = {
      ...booking,
      quantity: 2,
      attendee_names: ["Alex Morgan", "Taylor Guest"],
    };
    fetchMyBookings.mockResolvedValueOnce([multiSeatBooking]);
    renderDiscovery();

    const bookingReference = await screen.findByText(/Booking #24/);
    fireEvent.click(within(bookingReference.closest("li")).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("radio", { name: "Cancel all 2 seats" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation of 2 seats" }));

    expect(cancelBooking).toHaveBeenCalledWith(24, [1, 2]);
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
