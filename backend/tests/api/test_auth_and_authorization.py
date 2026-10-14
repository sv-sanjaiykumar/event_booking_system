from datetime import datetime, timedelta, timezone

import jwt

from app.core.security import (
    ACCESS_TOKEN_AUDIENCE,
    ACCESS_TOKEN_ISSUER,
    ACCESS_TOKEN_ALGORITHM,
)
from app.models.user import User


def register_and_login(
    client, role, email, name="Test User", password="StrongPassword123!"
):
    registered = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password,
            "role": role,
        },
    )
    assert registered.status_code == 201, registered.text
    login = client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert login.status_code == 200, login.text
    data = login.json()
    return data["user"], {"Authorization": "Bearer " + data["access_token"]}


def create_event(client, creator_headers, seats=2):
    event_date = datetime.now(timezone.utc) + timedelta(days=30)
    response = client.post(
        "/events/",
        headers=creator_headers,
        json={
            "name": "Owned event",
            "total_seats": seats,
            "date": event_date.isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_email_is_normalized_and_duplicates_are_rejected(client):
    first = client.post(
        "/auth/register",
        json={
            "name": "First",
            "email": "Person@Example.COM",
            "password": "StrongPassword123!",
            "role": "attendee",
        },
    )
    duplicate = client.post(
        "/auth/register",
        json={
            "name": "Second",
            "email": "person@example.com",
            "password": "StrongPassword123!",
            "role": "creator",
        },
    )

    assert first.status_code == 201
    assert first.json()["email"] == "person@example.com"
    assert "password_hash" not in first.json()
    assert duplicate.status_code == 409


def test_password_policy_and_role_validation(client):
    weak_password = client.post(
        "/auth/register",
        json={
            "name": "User",
            "email": "weak@example.com",
            "password": "alllowercase",
            "role": "attendee",
        },
    )
    unsupported_role = client.post(
        "/auth/register",
        json={
            "name": "User",
            "email": "role@example.com",
            "password": "StrongPassword123!",
            "role": "admin",
        },
    )

    assert weak_password.status_code == 422
    assert unsupported_role.status_code == 422


def test_login_me_logout_and_revocation(client):
    user, headers = register_and_login(
        client, "attendee", "session@example.com"
    )
    profile = client.get("/auth/me", headers=headers)
    logout = client.post("/auth/logout", headers=headers)
    after_logout = client.get("/auth/me", headers=headers)

    assert profile.status_code == 200
    assert profile.json()["id"] == user["id"]
    assert logout.status_code == 204
    assert after_logout.status_code == 401


def test_bad_credentials_are_generic_and_tampered_signature_is_rejected(client):
    _user, headers = register_and_login(
        client, "attendee", "signed@example.com"
    )
    bad_password = client.post(
        "/auth/login",
        json={"email": "signed@example.com", "password": "IncorrectPassword"},
    )
    token = headers["Authorization"].split(" ", 1)[1]
    token_parts = token.split(".")
    token_parts[2] = "A" * len(token_parts[2])
    tampered_token = ".".join(token_parts)
    tampered = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer " + tampered_token},
    )

    assert bad_password.status_code == 401
    assert bad_password.json()["detail"] == "Email or password is incorrect."
    assert tampered.status_code == 401


def test_invalid_tokens_and_missing_authentication_are_rejected(client):
    missing = client.get("/auth/me")
    malformed = client.get(
        "/auth/me", headers={"Authorization": "Bearer not.a.valid.token"}
    )
    wrong_claim_type_token = jwt.encode(
        {
            "sub": "999",
            "jti": "valid-shaped-jti",
            "type": "refresh",
            "iss": ACCESS_TOKEN_ISSUER,
            "aud": ACCESS_TOKEN_AUDIENCE,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        "unit-test-secret-key-not-for-production-000000000000",
        algorithm=ACCESS_TOKEN_ALGORITHM,
    )
    wrong_type = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer " + wrong_claim_type_token},
    )
    expired_token = jwt.encode(
        {
            "sub": "999",
            "jti": "expired-shaped-jti",
            "type": "access",
            "iss": ACCESS_TOKEN_ISSUER,
            "aud": ACCESS_TOKEN_AUDIENCE,
            "iat": datetime.now(timezone.utc) - timedelta(minutes=5),
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        "unit-test-secret-key-not-for-production-000000000000",
        algorithm=ACCESS_TOKEN_ALGORITHM,
    )
    expired = client.get(
        "/auth/me", headers={"Authorization": "Bearer " + expired_token}
    )

    assert missing.status_code == 401
    assert malformed.status_code == 401
    assert wrong_type.status_code == 401
    assert expired.status_code == 401


def test_inactive_user_cannot_use_an_existing_token(
    client, test_session_factory
):
    user, headers = register_and_login(
        client, "attendee", "inactive@example.com"
    )
    with test_session_factory() as db:
        account = db.get(User, user["id"])
        account.is_active = False
        db.commit()

    assert client.get("/auth/me", headers=headers).status_code == 401


def test_role_and_ownership_are_enforced(client):
    creator_one, creator_one_headers = register_and_login(
        client, "creator", "owner1@example.com"
    )
    _creator_two, creator_two_headers = register_and_login(
        client, "creator", "owner2@example.com"
    )
    attendee, attendee_headers = register_and_login(
        client, "attendee", "attendee1@example.com"
    )
    event = create_event(client, creator_one_headers)

    attendee_create = client.post(
        "/events/",
        headers=attendee_headers,
        json={
            "name": "Should be forbidden",
            "total_seats": 1,
            "date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        },
    )
    cross_owner_update = client.patch(
        f"/events/{event['id']}",
        headers=creator_two_headers,
        json={"name": "Hijacked"},
    )
    cross_owner_cancel = client.delete(
        f"/events/{event['id']}", headers=creator_two_headers
    )
    own_event_bookings = client.post(
        f"/events/{event['id']}/book", headers=attendee_headers
    )
    creator_bookings = client.get(
        f"/creator/events/{event['id']}/bookings",
        headers=creator_one_headers,
    )
    nonowner_bookings = client.get(
        f"/creator/events/{event['id']}/bookings",
        headers=creator_two_headers,
    )

    assert attendee_create.status_code == 403
    assert cross_owner_update.status_code == 404
    assert cross_owner_cancel.status_code == 404
    assert own_event_bookings.status_code == 201
    assert creator_bookings.status_code == 200
    assert creator_bookings.json()[0]["user_name"] == attendee["name"]
    assert nonowner_bookings.status_code == 404
    assert creator_one["id"] != attendee["id"]


def test_attendees_can_only_view_and_cancel_their_own_bookings(client):
    _creator, creator_headers = register_and_login(
        client, "creator", "creatorbookings@example.com"
    )
    _attendee_one, attendee_one_headers = register_and_login(
        client, "attendee", "attendeeone@example.com", name="First Attendee"
    )
    _attendee_two, attendee_two_headers = register_and_login(
        client, "attendee", "attendeetwo@example.com", name="Second Attendee"
    )
    event = create_event(client, creator_headers)
    booking = client.post(
        f"/events/{event['id']}/book", headers=attendee_one_headers
    ).json()

    my_bookings = client.get("/bookings/me", headers=attendee_one_headers)
    other_user_read = client.get(
        f"/bookings/{booking['id']}", headers=attendee_two_headers
    )
    other_user_cancel = client.delete(
        f"/bookings/{booking['id']}", headers=attendee_two_headers
    )
    owner_read = client.get(
        f"/bookings/{booking['id']}", headers=creator_headers
    )
    own_cancel = client.delete(
        f"/bookings/{booking['id']}", headers=attendee_one_headers
    )

    assert my_bookings.status_code == 200
    assert len(my_bookings.json()) == 1
    assert my_bookings.json()[0]["event_name"] == "Owned event"
    assert other_user_read.status_code == 404
    assert other_user_cancel.status_code == 404
    assert owner_read.status_code == 200
    assert own_cancel.status_code == 204


def test_event_edit_capacity_and_cancellation_policy(client):
    _creator, creator_headers = register_and_login(
        client, "creator", "eventpolicy@example.com"
    )
    _attendee, attendee_headers = register_and_login(
        client, "attendee", "policyattendee@example.com"
    )
    event = create_event(client, creator_headers, seats=2)
    booking = client.post(
        f"/events/{event['id']}/book", headers=attendee_headers
    ).json()
    client.post(f"/events/{event['id']}/book", headers=attendee_headers)

    invalid_capacity = client.patch(
        f"/events/{event['id']}",
        headers=creator_headers,
        json={"total_seats": 0},
    )
    capacity_below_existing_bookings = client.patch(
        f"/events/{event['id']}",
        headers=creator_headers,
        json={"total_seats": 1},
    )
    shrink_to_booked_count = client.patch(
        f"/events/{event['id']}",
        headers=creator_headers,
        json={"total_seats": 2},
    )
    cancel_event = client.delete(
        f"/events/{event['id']}", headers=creator_headers
    )
    public_cancelled_event = client.get(f"/events/{event['id']}")
    booking_cancel_after_event_cancel = client.delete(
        f"/bookings/{booking['id']}", headers=attendee_headers
    )
    retained_bookings = client.get(
        f"/creator/events/{event['id']}/bookings",
        headers=creator_headers,
    )

    assert invalid_capacity.status_code == 422
    assert capacity_below_existing_bookings.status_code == 409
    assert shrink_to_booked_count.status_code == 200
    assert shrink_to_booked_count.json()["available_seats"] == 0
    assert cancel_event.status_code == 204
    assert public_cancelled_event.status_code == 404
    assert booking_cancel_after_event_cancel.status_code == 409
    assert len(retained_bookings.json()) == 2
