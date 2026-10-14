from datetime import datetime, timezone
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event
from app.repositories import booking_repository, event_repository
from app.services.exceptions import (
    EventAlreadyStartedError,
    EventCancelledError,
    BookingNotFoundError,
    EventNotFoundError,
    EventSoldOutError,
    PermissionDeniedError,
)


def book_event(
    db: Session, event_id: int, user_id: int, user_name: str
) -> Booking:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    try:
        seats_reserved = booking_repository.reserve_one_seat(db, event_id, now)
        if not seats_reserved:
            event = event_repository.get_event(db, event_id)
            if event is None:
                raise EventNotFoundError
            if event.status != "published":
                raise EventCancelledError
            if event.date <= now:
                raise EventAlreadyStartedError
            raise EventSoldOutError
        booking = booking_repository.create_booking(
            db, event_id, user_id, user_name
        )
        db.commit()
        return booking
    except Exception:
        db.rollback()
        raise


def get_user_booking(db: Session, booking_id: int, user_id: int) -> Tuple[Booking, Event]:
    booking = booking_repository.get_booking_for_user(db, booking_id, user_id)
    if booking is None:
        raise BookingNotFoundError
    event = event_repository.get_event(db, booking.event_id)
    if event is None:
        raise BookingNotFoundError
    return booking, event


def list_user_bookings(db: Session, user_id: int) -> List[Tuple[Booking, Event]]:
    return booking_repository.list_user_bookings(db, user_id)


def get_authorized_booking(
    db: Session, booking_id: int, user_id: int, role: str
) -> Tuple[Booking, Event]:
    booking = booking_repository.get_booking_for_user(db, booking_id, user_id)
    if booking is None and role == "creator":
        booking = booking_repository.get_booking_for_creator(
            db, booking_id, user_id
        )
    if booking is None:
        raise BookingNotFoundError
    event = event_repository.get_event(db, booking.event_id)
    if event is None:
        raise BookingNotFoundError
    return booking, event


def cancel_booking(db: Session, booking_id: int, user_id: int) -> None:
    booking = booking_repository.get_booking_for_user(db, booking_id, user_id)
    if booking is None:
        db.rollback()
        raise BookingNotFoundError
    event = event_repository.get_event(db, booking.event_id)
    if event is None:
        db.rollback()
        raise BookingNotFoundError
    if event.status != "published":
        db.rollback()
        raise EventCancelledError
    if event.date <= datetime.now(timezone.utc).replace(tzinfo=None):
        db.rollback()
        raise EventAlreadyStartedError
    try:
        event_id = booking.event_id
        if not booking_repository.delete_booking(db, booking_id):
            raise BookingNotFoundError
        if not booking_repository.release_one_seat(db, event_id):
            raise RuntimeError("Could not restore the event's available seat.")
        db.commit()
    except Exception:
        db.rollback()
        raise
