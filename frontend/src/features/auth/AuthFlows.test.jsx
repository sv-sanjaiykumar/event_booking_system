import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppRoutes from "../../app/AppRoutes.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import {
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "./authApi.js";
import {
  fetchAllCreatorEvents,
  fetchEvent,
  fetchEventBookings,
  fetchEvents,
  fetchMyBookings,
} from "../events/eventApi.js";

vi.mock("./authApi.js", () => ({
  fetchCurrentUser: vi.fn(),
  loginAccount: vi.fn(),
  logoutAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock("../events/eventApi.js", () => ({
  fetchAllCreatorEvents: vi.fn(),
  fetchCreatorEvents: vi.fn(),
  fetchEventBookings: vi.fn(),
  fetchEvents: vi.fn(),
  fetchMyBookings: vi.fn(),
  bookEvent: vi.fn(),
  cancelBooking: vi.fn(),
  fetchEvent: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  cancelEvent: vi.fn(),
}));

const attendee = {
  id: 4,
  name: "Avery Attendee",
  email: "avery@example.com",
  role: "attendee",
  is_active: true,
};
const creator = {
  id: 9,
  name: "Casey Creator",
  email: "casey@example.com",
  role: "creator",
  is_active: true,
};

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <AppRoutes />
        <CurrentPath />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function CurrentPath() {
  const { pathname } = useLocation();
  return <div data-testid="current-path">{pathname}</div>;
}

describe("authentication and role routing", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    fetchCurrentUser.mockResolvedValue(attendee);
    loginAccount.mockResolvedValue({
      access_token: "opaque-short-lived-test-token",
      user: attendee,
    });
    logoutAccount.mockResolvedValue(undefined);
    registerAccount.mockResolvedValue(attendee);
    fetchAllCreatorEvents.mockResolvedValue([]);
    fetchEventBookings.mockResolvedValue([]);
    fetchEvents.mockResolvedValue([]);
    fetchMyBookings.mockResolvedValue([]);
  });

  it("shows event discovery at /events", async () => {
    renderApp("/events");

    expect(await screen.findByText("THE LINEUP")).toBeInTheDocument();
    expect(fetchEvents).toHaveBeenCalled();
  });

  it("redirects the root URL to /events", async () => {
    renderApp("/");

    expect(await screen.findByTestId("current-path")).toHaveTextContent("/events");
    expect(await screen.findByText("THE LINEUP")).toBeInTheDocument();
  });

  it("opens the event detail page for /events/:eventId", async () => {
    fetchEvent.mockResolvedValueOnce({
      id: 42,
      name: "A specific event",
      description: "Event details.",
      total_seats: 10,
      available_seats: 4,
      date: "2030-11-20T18:00:00Z",
      status: "published",
    });
    renderApp("/events/42");

    expect(await screen.findByRole("heading", { name: "A specific event" })).toBeInTheDocument();
    expect(fetchEvent).toHaveBeenCalledWith("42");
  });

  it("redirects unauthenticated visitors from a protected route to login", async () => {
    renderApp("/attendee/dashboard");

    expect(await screen.findByRole("heading", { name: "Good to see you." })).toBeInTheDocument();
    expect(fetchCurrentUser).not.toHaveBeenCalled();
  });

  it("redirects an authenticated user away from the other role's dashboard", async () => {
    window.sessionStorage.setItem("gather.access-token.v1", "attendee-token");
    fetchCurrentUser.mockResolvedValueOnce(attendee);
    renderApp("/creator/dashboard");

    expect(
      await screen.findByRole("heading", { name: /Welcome, Avery/ }),
    ).toBeInTheDocument();
    expect(fetchAllCreatorEvents).not.toHaveBeenCalled();
  });

  it("logs in and redirects to the dashboard for the backend role", async () => {
    loginAccount.mockResolvedValueOnce({
      access_token: "opaque-short-lived-test-token",
      user: creator,
    });
    renderApp("/login");

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "casey@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("CREATOR STUDIO")).toBeInTheDocument();
    expect(loginAccount).toHaveBeenCalledWith({
      email: "casey@example.com",
      password: "StrongPassword123!",
    });
    expect(window.sessionStorage.getItem("gather.access-token.v1")).toBe(
      "opaque-short-lived-test-token",
    );
  });

  it("restores a tab-scoped token by asking the backend for the profile", async () => {
    window.sessionStorage.setItem("gather.access-token.v1", "existing-token");
    fetchCurrentUser.mockResolvedValueOnce(attendee);
    renderApp("/attendee/dashboard");

    expect(
      await screen.findByRole("heading", { name: /Welcome, Avery/ }),
    ).toBeInTheDocument();
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: "My bookings" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /My bookings/ })).toBeInTheDocument();
  });

  it("allows creators to open the dedicated event creation page", async () => {
    window.sessionStorage.setItem("gather.access-token.v1", "creator-token");
    fetchCurrentUser.mockResolvedValueOnce(creator);
    renderApp("/creator/events/new");

    expect(await screen.findByRole("heading", { name: /Create an event/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Event name")).toBeInTheDocument();
  });

  it("clears an expired session and redirects to login", async () => {
    window.sessionStorage.setItem("gather.access-token.v1", "expired-token");
    fetchCurrentUser.mockResolvedValueOnce(attendee);
    renderApp("/attendee/dashboard");
    await screen.findByRole("heading", { name: /Welcome, Avery/ });

    window.dispatchEvent(new CustomEvent("auth:expired"));

    expect(await screen.findByRole("heading", { name: "Good to see you." })).toBeInTheDocument();
    expect(window.sessionStorage.getItem("gather.access-token.v1")).toBeNull();
  });

  it("signs out and clears the session without deleting server bookings", async () => {
    window.sessionStorage.setItem("gather.access-token.v1", "existing-token");
    fetchCurrentUser.mockResolvedValueOnce(creator);
    renderApp("/creator/dashboard");
    await screen.findByText("CREATOR STUDIO");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(window.sessionStorage.getItem("gather.access-token.v1")).toBeNull();
    });
    expect(logoutAccount).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("link", { name: "Join Gather" })).toBeInTheDocument();
  });

  it("validates password strength and matching confirmation before registration", async () => {
    renderApp("/register");

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Avery" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "avery@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "weakpassword" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "differentpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("at least 12 characters");
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it("submits the selected role to the backend and returns to sign in", async () => {
    renderApp("/register");

    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Casey Creator" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "casey@example.com" },
    });
    fireEvent.change(screen.getByLabelText("I’m here as"), {
      target: { value: "creator" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("heading", { name: "Good to see you." })).toBeInTheDocument();
    expect(registerAccount).toHaveBeenCalledWith({
      name: "Casey Creator",
      email: "casey@example.com",
      password: "StrongPassword123!",
      role: "creator",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Your account is ready");
  });
});
