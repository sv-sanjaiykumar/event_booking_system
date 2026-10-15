from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event


def reserve_seats(
    db: Session, event_id: int, quantity: int, now: datetime
) -> int:
    result = db.execute(
        update(Event)
        .where(
            Event.id == event_id,
            Event.available_seats >= quantity,
            Event.status == "published",
            Event.date > now,
        )
        .values(available_seats=Event.available_seats - quantity)
    )
    return result.rowcount or 0


def create_booking(
    db: Session,
    event_id: int,
    user_id: int,
    user_name: str,
    quantity: int,
    attendee_names: list[str],
    seat_numbers: list[int],
    includes_booker: bool,
) -> Booking:
    booking = Booking(
        event_id=event_id,
        user_id=user_id,
        user_name=user_name,
        quantity=quantity,
        attendee_names=attendee_names,
        seat_numbers=seat_numbers,
        includes_booker=includes_booker,
        booking_date=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    db.add(booking)
    db.flush()
    return booking


def get_booking_for_user(
    db: Session, booking_id: int, user_id: int
) -> Optional[Booking]:
    return db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
        )
    )


def get_booking_for_creator(
    db: Session, booking_id: int, creator_id: int
) -> Optional[Booking]:
    return db.scalar(
        select(Booking)
        .join(Event, Booking.event_id == Event.id)
        .where(Booking.id == booking_id, Event.creator_id == creator_id)
    )


def list_user_bookings(db: Session, user_id: int) -> list[tuple[Booking, Event]]:
    result = db.execute(
            select(Booking, Event)
            .join(Event, Booking.event_id == Event.id)
            .where(Booking.user_id == user_id)
            .order_by(Booking.booking_date.desc(), Booking.id.desc())
    )
    return [(booking, event) for booking, event in result]


def list_event_bookings(
    db: Session, event_id: int, creator_id: int
) -> list[Booking]:
    return list(
        db.scalars(
            select(Booking)
            .join(Event, Booking.event_id == Event.id)
            .where(
                Booking.event_id == event_id,
                Event.creator_id == creator_id,
            )
            .order_by(Booking.booking_date, Booking.id)
        )
    )


def list_event_seat_numbers(db: Session, event_id: int) -> list[int]:
    bookings = db.scalars(
        select(Booking.seat_numbers).where(Booking.event_id == event_id)
    )
    return [seat_number for numbers in bookings for seat_number in (numbers or [])]


def user_has_booked_self_for_event(
    db: Session, event_id: int, user_id: int
) -> bool:
    return db.scalar(
        select(Booking.id)
        .where(
            Booking.event_id == event_id,
            Booking.user_id == user_id,
            Booking.includes_booker.is_(True),
        )
        .limit(1)
    ) is not None


def delete_booking(
    db: Session,
    booking_id: int,
    user_id: int,
    quantity: int,
    attendee_names: list[str],
    seat_numbers: list[int],
) -> int:
    result = db.execute(
        delete(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
            Booking.quantity == quantity,
            Booking.attendee_names == attendee_names,
            Booking.seat_numbers == seat_numbers,
        )
    )
    return result.rowcount or 0


def cancel_booking_seats(
    db: Session,
    booking_id: int,
    user_id: int,
    quantity: int,
    expected_quantity: int,
    expected_attendee_names: list[str],
    remaining_attendee_names: list[str],
    expected_seat_numbers: list[int],
    remaining_seat_numbers: list[int],
    expected_includes_booker: bool,
    remaining_includes_booker: bool,
) -> int:
    result = db.execute(
        update(Booking)
        .where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
            Booking.quantity == expected_quantity,
            Booking.attendee_names == expected_attendee_names,
            Booking.seat_numbers == expected_seat_numbers,
            Booking.includes_booker.is_(expected_includes_booker),
        )
        .values(
            quantity=expected_quantity - quantity,
            attendee_names=remaining_attendee_names,
            seat_numbers=remaining_seat_numbers,
            includes_booker=remaining_includes_booker,
        )
    )
    return result.rowcount or 0


def release_seats(db: Session, event_id: int, quantity: int) -> int:
    result = db.execute(
        update(Event)
        .where(
            Event.id == event_id,
            Event.available_seats + quantity <= Event.total_seats,
        )
        .values(available_seats=Event.available_seats + quantity)
    )
    return result.rowcount or 0
