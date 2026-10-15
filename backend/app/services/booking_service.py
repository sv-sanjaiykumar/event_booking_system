from datetime import datetime, timezone
from typing import List, Optional, Tuple

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
    InsufficientSeatsError,
    InvalidCancellationQuantityError,
    PermissionDeniedError,
)


def book_event(
    db: Session, event_id: int, user_id: int, user_name: str, quantity: int = 1
) -> Booking:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if quantity < 1:
        raise ValueError("Booking quantity must be at least one.")
    try:
        seats_reserved = booking_repository.reserve_seats(
            db, event_id, quantity, now
        )
        if not seats_reserved:
            event = event_repository.get_event(db, event_id)
            if event is None:
                raise EventNotFoundError
            if event.status != "published":
                raise EventCancelledError
            if event.date <= now:
                raise EventAlreadyStartedError
            if event.available_seats < quantity:
                if event.available_seats == 0:
                    raise EventSoldOutError
                raise InsufficientSeatsError
            raise EventSoldOutError
        booking = booking_repository.create_booking(
            db, event_id, user_id, user_name, quantity
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


def cancel_booking(
    db: Session, booking_id: int, user_id: int, quantity: Optional[int] = None
) -> None:
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
    cancellation_quantity = booking.quantity if quantity is None else quantity
    if cancellation_quantity < 1 or cancellation_quantity > booking.quantity:
        db.rollback()
        raise InvalidCancellationQuantityError
    try:
        event_id = booking.event_id
        if cancellation_quantity == booking.quantity:
            if not booking_repository.delete_booking(
                db, booking_id, user_id, cancellation_quantity
            ):
                raise InvalidCancellationQuantityError
        elif booking_repository.cancel_booking_seats(
            db, booking_id, user_id, cancellation_quantity
        ) is None:
            raise InvalidCancellationQuantityError
        if not booking_repository.release_seats(
            db, event_id, cancellation_quantity
        ):
            raise RuntimeError("Could not restore the booking's reserved seats.")
        db.commit()
    except Exception:
        db.rollback()
        raise
