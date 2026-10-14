from datetime import datetime, timedelta, timezone

import pytest


def register_user(client, role="creator", email="creator@example.com", name="Alex"):
    response = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "StrongPassword123!",
            "role": role,
        },
    )
    assert response.status_code == 201
    login = client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPassword123!"},
    )
    assert login.status_code == 200
    return login.json()["user"], {
        "Authorization": "Bearer " + login.json()["access_token"]
    }


def future_date(days=30):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def create_event(client, headers, capacity=2):
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "name": "Community Meetup",
            "total_seats": capacity,
            "date": future_date(),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_public_listing_and_creator_event_creation(client):
    _creator, creator_headers = register_user(client)
    created = create_event(client, creator_headers, capacity=5)

    assert created["available_seats"] == 5
    assert client.get("/events/").json() == [created]
    assert client.get(f"/events/{created['id']}").json() == created
    assert client.get(
        "/creator/events", headers=creator_headers
    ).json() == [created]
    assert client.get("/events/?q=community&page=1&page_size=10").json() == [
        created
    ]
    assert client.get("/events/?q=missing").json() == []


def test_same_name_and_time_are_unique_across_creators(client):
    _creator, first_creator_headers = register_user(
        client, email="first-creator@example.com"
    )
    _other_creator, other_creator_headers = register_user(
        client, email="other-creator@example.com"
    )
    date = future_date()
    equivalent_date = datetime.fromisoformat(date).astimezone(
        timezone(timedelta(hours=5, minutes=30))
    ).isoformat()
    first = client.post(
        "/events/",
        headers=first_creator_headers,
        json={
            "name": "Shared Showcase",
            "total_seats": 10,
            "date": date,
        },
    )
    duplicate = client.post(
        "/events/",
        headers=other_creator_headers,
        json={
            "name": "  shared showcase  ",
            "total_seats": 5,
            "date": equivalent_date,
        },
    )
    different_name = client.post(
        "/events/",
        headers=other_creator_headers,
        json={
            "name": "Different Showcase",
            "total_seats": 5,
            "date": date,
        },
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == (
        "An event with this name is already scheduled at this date and time."
    )
    assert different_name.status_code == 201
    assert different_name.json()["date"] == first.json()["date"]


def test_event_update_cannot_create_duplicate_name_and_time(client):
    _creator, creator_headers = register_user(client)
    date = future_date()
    first = client.post(
        "/events/",
        headers=creator_headers,
        json={"name": "First Showcase", "total_seats": 10, "date": date},
    )
    second = client.post(
        "/events/",
        headers=creator_headers,
        json={"name": "Second Showcase", "total_seats": 10, "date": date},
    )
    duplicate_update = client.patch(
        f"/events/{second.json()['id']}",
        headers=creator_headers,
        json={"name": "First Showcase"},
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert duplicate_update.status_code == 409


def test_unknown_event_returns_404(client):
    response = client.get("/events/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found."


def test_booking_capacity_and_owner_cancellation(client):
    _creator, creator_headers = register_user(client)
    event = create_event(client, creator_headers)
    attendee, attendee_headers = register_user(
        client, role="attendee", email="attendee@example.com"
    )
    booking_started_at = datetime.now(timezone.utc)
    first_booking = client.post(
        f"/events/{event['id']}/book",
        headers=attendee_headers,
    )
    second_booking = client.post(
        f"/events/{event['id']}/book",
        headers=attendee_headers,
    )
    full_event_booking = client.post(
        f"/events/{event['id']}/book",
        headers=attendee_headers,
    )

    assert first_booking.status_code == 201
    assert second_booking.status_code == 201
    assert first_booking.json()["user_name"] == attendee["name"]
    booking_time = datetime.fromisoformat(
        first_booking.json()["booking_date"].replace("Z", "+00:00")
    )
    assert booking_started_at <= booking_time <= datetime.now(timezone.utc)
    assert full_event_booking.status_code == 409
    assert client.get(f"/events/{event['id']}").json()["available_seats"] == 0

    cancellation = client.delete(
        f"/bookings/{first_booking.json()['id']}", headers=attendee_headers
    )
    replacement_booking = client.post(
        f"/events/{event['id']}/book", headers=attendee_headers
    )

    assert cancellation.status_code == 204
    assert replacement_booking.status_code == 201
    assert client.get(f"/events/{event['id']}").json()["available_seats"] == 0


def test_booking_unknown_event_returns_404(client):
    _user, headers = register_user(client, role="attendee")
    response = client.post("/events/999/book", headers=headers)

    assert response.status_code == 404


def test_cancel_unknown_booking_returns_404(client):
    _user, headers = register_user(client, role="attendee")
    response = client.delete("/bookings/999", headers=headers)

    assert response.status_code == 404


def test_event_capacity_must_be_positive(client):
    _user, headers = register_user(client)
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "name": "Invalid event",
            "total_seats": 0,
            "date": future_date(),
        },
    )

    assert response.status_code == 422


def test_event_date_requires_timezone(client):
    _user, headers = register_user(client)
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "name": "Missing timezone",
            "total_seats": 1,
            "date": "2030-10-20T18:00:00",
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    "name",
    [
        "2026 Conference",
        "Summer-Fest",
        "Music & Arts",
        "Meetup!",
        "Name_One",
    ],
)
def test_event_name_rejects_non_letter_start_or_special_characters(client, name):
    _user, headers = register_user(client)
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "name": name,
            "total_seats": 10,
            "date": future_date(),
        },
    )

    assert response.status_code == 422


def test_event_name_allows_letters_numbers_and_spaces(client):
    _user, headers = register_user(client)
    response = client.post(
        "/events/",
        headers=headers,
        json={
            "name": "Festival 2026",
            "total_seats": 10,
            "date": future_date(),
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Festival 2026"


def test_event_update_rejects_special_characters_in_name(client):
    _user, headers = register_user(client)
    event = client.post(
        "/events/",
        headers=headers,
        json={
            "name": "Festival 2026",
            "total_seats": 10,
            "date": future_date(),
        },
    )
    response = client.patch(
        f"/events/{event.json()['id']}",
        headers=headers,
        json={"name": "Festival 2026!"},
    )

    assert event.status_code == 201
    assert response.status_code == 422


def test_openapi_documents_auth_and_booking_routes(client):
    schema = client.get("/openapi.json").json()

    assert "/auth/register" in schema["paths"]
    assert "/auth/login" in schema["paths"]
    assert "/events/{event_id}/book" in schema["paths"]
    assert "/bookings/{booking_id}" in schema["paths"]
    assert "HTTPBearer" in schema["components"]["securitySchemes"]


def test_frontend_origin_can_send_authorization_header(client):
    response = client.options(
        "/events/",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"]
        == "http://127.0.0.1:5173"
    )
    assert "authorization" in response.headers[
        "access-control-allow-headers"
    ].lower()
