from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event
from app.repositories import booking_repository, event_repository
from app.services.exceptions import (
    AlreadyBookedAsSelfError,
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
    db: Session,
    event_id: int,
    user_id: int,
    user_name: str,
    quantity: int = 1,
    attendee_names: Optional[List[str]] = None,
    includes_booker: bool = True,
) -> Booking:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if quantity < 1:
        raise ValueError("Booking quantity must be at least one.")
    seat_names = (
        [user_name] * quantity
        if attendee_names is None
        else [name.strip() for name in attendee_names]
    )
    if len(seat_names) != quantity or any(not name.strip() for name in seat_names):
        raise ValueError("Provide one non-empty attendee name for each booked seat.")
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
        if includes_booker and booking_repository.user_has_booked_self_for_event(
            db, event_id, user_id
        ):
            raise AlreadyBookedAsSelfError
        event = event_repository.get_event(db, event_id)
        if event is None:
            raise EventNotFoundError
        occupied_seats = set(
            booking_repository.list_event_seat_numbers(db, event_id)
        )
        available_seat_numbers = [
            seat_number
            for seat_number in range(1, event.total_seats + 1)
            if seat_number not in occupied_seats
        ]
        if len(available_seat_numbers) < quantity:
            raise InsufficientSeatsError
        booking = booking_repository.create_booking(
            db,
            event_id,
            user_id,
            user_name,
            quantity,
            seat_names,
            available_seat_numbers[:quantity],
            includes_booker,
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
    db: Session,
    booking_id: int,
    user_id: int,
    seat_numbers: Optional[List[int]] = None,
    quantity: Optional[int] = None,
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
    attendee_names = booking.attendee_names or [booking.user_name] * booking.quantity
    if len(attendee_names) != booking.quantity:
        attendee_names = [booking.user_name] * booking.quantity
    assigned_seat_numbers = booking.seat_numbers or list(
        range(1, booking.quantity + 1)
    )
    if len(assigned_seat_numbers) != booking.quantity:
        assigned_seat_numbers = list(range(1, booking.quantity + 1))
    if seat_numbers is not None:
        selected_seats = seat_numbers
    elif quantity is not None:
        selected_seats = list(range(1, quantity + 1))
    else:
        selected_seats = list(range(1, booking.quantity + 1))
    if (
        not selected_seats
        or len(set(selected_seats)) != len(selected_seats)
        or any(
            seat_number < 1 or seat_number > booking.quantity
            for seat_number in selected_seats
        )
    ):
        db.rollback()
        raise InvalidCancellationQuantityError
    selected_seats = sorted(selected_seats)
    cancellation_quantity = len(selected_seats)
    cancelled_seat_set = set(selected_seats)
    remaining_attendee_names = [
        name
        for seat_number, name in enumerate(attendee_names, start=1)
        if seat_number not in cancelled_seat_set
    ]
    try:
        event_id = booking.event_id
        if cancellation_quantity == booking.quantity:
            if not booking_repository.delete_booking(
                db,
                booking_id,
                user_id,
                booking.quantity,
                attendee_names,
                assigned_seat_numbers,
            ):
                raise InvalidCancellationQuantityError
        elif not booking_repository.cancel_booking_seats(
            db,
            booking_id,
            user_id,
            cancellation_quantity,
            booking.quantity,
            attendee_names,
            remaining_attendee_names,
            assigned_seat_numbers,
            [
                seat_number
                for position, seat_number in enumerate(
                    assigned_seat_numbers, start=1
                )
                if position not in cancelled_seat_set
            ],
            booking.includes_booker,
            booking.includes_booker and 1 not in cancelled_seat_set,
        ):
            raise InvalidCancellationQuantityError
        if not booking_repository.release_seats(
            db, event_id, cancellation_quantity
        ):
            raise RuntimeError("Could not restore the booking's reserved seats.")
        db.commit()
    except Exception:
        db.rollback()
        raise
