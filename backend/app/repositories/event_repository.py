from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate


def create_event(db: Session, event_data: EventCreate, creator_id: int) -> Event:
    event = Event(
        creator_id=creator_id,
        name=event_data.name,
        description=event_data.description,
        total_seats=event_data.total_seats,
        available_seats=event_data.total_seats,
        date=event_data.date.astimezone(timezone.utc).replace(tzinfo=None),
        status="published",
    )
    db.add(event)
    db.flush()
    return event


def published_event_exists_at_date(
    db: Session,
    name: str,
    event_date: datetime,
    exclude_event_id: Optional[int] = None,
) -> bool:
    statement = select(Event.id).where(
        Event.status == "published",
        func.lower(func.trim(Event.name)) == name.strip().lower(),
        Event.date == event_date,
    )
    if exclude_event_id is not None:
        statement = statement.where(Event.id != exclude_event_id)
    return db.scalar(statement.limit(1)) is not None


def get_event(db: Session, event_id: int) -> Optional[Event]:
    return db.get(Event, event_id)


def list_events(db: Session) -> list[Event]:
    return list(
        db.scalars(
            select(Event)
            .where(Event.status == "published")
            .order_by(Event.date, Event.id)
        )
    )


def search_events(
    db: Session, query: Optional[str], offset: int, limit: int
) -> List[Event]:
    statement = select(Event).where(Event.status == "published")
    if query:
        statement = statement.where(
            func.lower(Event.name).contains(query.lower())
        )
    return list(
        db.scalars(statement.order_by(Event.date, Event.id).offset(offset).limit(limit))
    )


def get_owned_event(db: Session, event_id: int, creator_id: int) -> Optional[Event]:
    return db.scalar(
        select(Event).where(
            Event.id == event_id,
            Event.creator_id == creator_id,
        )
    )


def list_owned_events(
    db: Session, creator_id: int, offset: int, limit: int
) -> List[Event]:
    return list(
        db.scalars(
            select(Event)
            .where(Event.creator_id == creator_id)
            .order_by(Event.date, Event.id)
            .offset(offset)
            .limit(limit)
        )
    )


def count_event_bookings(db: Session, event_id: int) -> int:
    return int(
        db.scalar(
            select(func.count(Booking.id)).where(Booking.event_id == event_id)
        )
        or 0
    )


def update_event_fields(db: Session, event: Event, values: dict) -> Event:
    if "date" in values:
        values["date"] = values["date"].astimezone(timezone.utc).replace(tzinfo=None)
    for field_name, value in values.items():
        setattr(event, field_name, value)
    db.flush()
    return event


def cancel_event(db: Session, event: Event) -> None:
    event.status = "cancelled"
    db.flush()


def get_event_owner(db: Session, event_id: int) -> Optional[User]:
    return db.scalar(
        select(User)
        .join(Event, Event.creator_id == User.id)
        .where(Event.id == event_id)
    )
