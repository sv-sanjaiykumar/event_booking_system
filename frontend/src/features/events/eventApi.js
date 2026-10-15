import { apiClient } from "../../api/client.js";

export async function fetchEvents({ signal } = {}) {
  return fetchAllPages("/events/", signal);
}

export async function fetchEvent(eventId) {
  const { data } = await apiClient.get(`/events/${eventId}`);
  return data;
}

export async function bookEvent(
  eventId,
  quantity = 1,
  attendeeNames,
  includesBooker = true,
) {
  const { data } = await apiClient.post(`/events/${eventId}/book`, {
    quantity,
    attendee_names: attendeeNames,
    includes_booker: includesBooker,
  });
  return data;
}

export async function cancelBooking(bookingId, seatNumbers) {
  await apiClient.delete(`/bookings/${bookingId}`, {
    data: seatNumbers === undefined ? undefined : { seat_numbers: seatNumbers },
  });
}

export async function fetchMyBookings() {
  const { data } = await apiClient.get("/bookings/me");
  return data;
}

export async function createEvent(event) {
  const { data } = await apiClient.post("/events/", event);
  return data;
}

export async function updateEvent(eventId, changes) {
  const { data } = await apiClient.patch(`/events/${eventId}`, changes);
  return data;
}

export async function fetchCreatorEvents({ page = 1, pageSize = 100 } = {}) {
  const { data } = await apiClient.get("/creator/events", {
    params: { page, page_size: pageSize },
  });
  return data;
}

export async function fetchAllCreatorEvents() {
  return fetchAllPages("/creator/events");
}

async function fetchAllPages(path, signal) {
  const items = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const { data } = await apiClient.get(path, {
      params: { page, page_size: pageSize },
      signal,
    });
    if (!Array.isArray(data)) {
      throw new Error("The API returned an invalid paginated list.");
    }
    items.push(...data);
    if (data.length < pageSize) return items;
    page += 1;
  }
}

export async function cancelEvent(eventId) {
  await apiClient.delete(`/events/${eventId}`);
}

export async function fetchEventBookings(eventId) {
  const { data } = await apiClient.get(
    `/creator/events/${eventId}/bookings`,
  );
  return data;
}
