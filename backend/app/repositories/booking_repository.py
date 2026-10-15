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
    db: Session, event_id: int, user_id: int, user_name: str, quantity: int
) -> Booking:
    booking = Booking(
        event_id=event_id,
        user_id=user_id,
        user_name=user_name,
        quantity=quantity,
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


def delete_booking(
    db: Session, booking_id: int, user_id: int, quantity: int
) -> int:
    result = db.execute(
        delete(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
            Booking.quantity == quantity,
        )
    )
    return result.rowcount or 0


def cancel_booking_seats(
    db: Session, booking_id: int, user_id: int, quantity: int
) -> Optional[int]:
    result = db.execute(
        update(Booking)
        .where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
            Booking.quantity > quantity,
        )
        .values(quantity=Booking.quantity - quantity)
        .returning(Booking.quantity)
    )
    return result.scalar_one_or_none()


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
