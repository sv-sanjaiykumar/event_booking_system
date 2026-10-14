from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.db.database import Base
from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate
from app.services import booking_service, event_service
from app.services.exceptions import (
    BookingNotFoundError,
    EventSoldOutError,
)


def create_account(db, role):
    user = User(
        name=role.title(),
        email=f"{role}@service.test",
        password_hash=hash_password("StrongPassword123!"),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


def future_event_data(name, capacity):
    return EventCreate(
        name=name,
        total_seats=capacity,
        date=datetime.now(timezone.utc) + timedelta(days=30),
    )


def test_booking_rejects_over_capacity_without_consuming_a_seat(
    test_session_factory,
):
    with test_session_factory() as db:
        creator = create_account(db, "creator")
        attendee = create_account(db, "attendee")
        event = event_service.create_event(
            db, future_event_data("Full event", 1), creator.id
        )
        event_id = event.id
        attendee_id = attendee.id

    with test_session_factory() as db:
        booking_service.book_event(db, event_id, attendee_id, "Attendee")

    with test_session_factory() as db:
        with pytest.raises(EventSoldOutError):
            booking_service.book_event(db, event_id, attendee_id, "Attendee")

    with test_session_factory() as db:
        event = event_service.get_event(db, event_id)
        assert event.available_seats == 0


def test_canceling_booking_releases_one_seat_only(test_session_factory):
    with test_session_factory() as db:
        creator = create_account(db, "creator")
        attendee = create_account(db, "attendee")
        event = event_service.create_event(
            db, future_event_data("Cancelable event", 1), creator.id
        )
        booking = booking_service.book_event(
            db, event.id, attendee.id, attendee.name
        )
        event_id = event.id
        booking_id = booking.id
        attendee_id = attendee.id

    with test_session_factory() as db:
        booking_service.cancel_booking(db, booking_id, attendee_id)

    with test_session_factory() as db:
        with pytest.raises(BookingNotFoundError):
            booking_service.cancel_booking(db, booking_id, attendee_id)

    with test_session_factory() as db:
        event = event_service.get_event(db, event_id)
        assert event.available_seats == 1


def test_concurrent_bookings_cannot_reserve_the_same_last_seat(tmp_path):
    engine = create_engine(
        "sqlite:///" + str(tmp_path / "concurrent-booking.db"),
        connect_args={"timeout": 15},
    )
    session_factory = sessionmaker(
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        bind=engine,
    )
    Base.metadata.create_all(bind=engine)
    with session_factory() as db:
        creator = create_account(db, "creator")
        attendee = create_account(db, "attendee")
        event = event_service.create_event(
            db, future_event_data("Last seat", 1), creator.id
        )
        event_id = event.id
        attendee_id = attendee.id

    start = Barrier(2)

    def book_at_once():
        start.wait()
        with session_factory() as db:
            try:
                booking_service.book_event(
                    db, event_id, attendee_id, "Attendee"
                )
                return "booked"
            except EventSoldOutError:
                return "sold_out"

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _index: book_at_once(), range(2)))

        assert sorted(results) == ["booked", "sold_out"]
        with session_factory() as db:
            event = db.get(Event, event_id)
            booking_count = db.scalar(
                select(func.count(Booking.id)).where(
                    Booking.event_id == event_id
                )
            )
            assert event.available_seats == 0
            assert booking_count == 1
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
