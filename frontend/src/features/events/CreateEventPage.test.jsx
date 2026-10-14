import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreateEventPage from "./CreateEventPage.jsx";
import { createEvent } from "./eventApi.js";

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
  createEvent: vi.fn(),
}));

function renderCreateEventPage() {
  return render(
    <MemoryRouter initialEntries={["/creator/events/new"]}>
      <Routes>
        <Route path="/creator/events/new" element={<CreateEventPage />} />
        <Route path="/creator/dashboard" element={<h1>Creator dashboard</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("creator event creation page", () => {
  beforeEach(() => {
    createEvent.mockResolvedValue({ id: 8 });
  });

  it("validates and submits event details, then returns to the creator dashboard", async () => {
    renderCreateEventPage();

    expect(screen.getByRole("link", { name: "Create event" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Event name"), {
      target: { value: "Evening Meetup" },
    });
    fireEvent.change(screen.getByLabelText("Event date and time"), {
      target: { value: "2030-12-01T18:30" },
    });
    fireEvent.change(screen.getByLabelText("Total seat capacity"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish event" }));

    await waitFor(() => expect(createEvent).toHaveBeenCalledWith({
      name: "Evening Meetup",
      description: null,
      total_seats: 25,
      date: expect.stringMatching(/Z$/),
    }));
    expect(await screen.findByRole("heading", { name: "Creator dashboard" })).toBeInTheDocument();
  });

  it("shows validation errors without calling the API", async () => {
    renderCreateEventPage();
    fireEvent.change(screen.getByLabelText("Event name"), {
      target: { value: "Past event" },
    });
    fireEvent.change(screen.getByLabelText("Event date and time"), {
      target: { value: "2020-01-01T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Total seat capacity"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish event" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The event date must be in the future.",
    );
    expect(createEvent).not.toHaveBeenCalled();
  });
});
