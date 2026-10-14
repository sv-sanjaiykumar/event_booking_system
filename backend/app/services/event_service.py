from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.event import Event
from app.repositories import booking_repository, event_repository
from app.schemas.event import EventCreate, EventUpdate
from app.services.exceptions import (
    CapacityBelowBookingsError,
    EventAlreadyStartedError,
    EventCancelledError,
    DuplicateEventError,
    EventNotEditableError,
    EventNotFoundError,
)


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _is_duplicate_event_integrity_error(error: IntegrityError) -> bool:
    original = error.orig
    constraint_name = getattr(
        getattr(original, "diag", None), "constraint_name", None
    )
    return (
        constraint_name == "uq_events_published_name_date"
        or "uq_events_published_name_date" in str(original)
    )


def create_event(db: Session, event_data: EventCreate, creator_id: int) -> Event:
    normalized_date = _utc_naive(event_data.date)
    if normalized_date <= _now_utc_naive():
        raise EventAlreadyStartedError
    try:
        if event_repository.published_event_exists_at_date(
            db, event_data.name, normalized_date
        ):
            raise DuplicateEventError
        event = event_repository.create_event(db, event_data, creator_id)
        db.commit()
        return event
    except IntegrityError as exc:
        db.rollback()
        if _is_duplicate_event_integrity_error(exc):
            raise DuplicateEventError from exc
        raise
    except Exception:
        db.rollback()
        raise


def list_events(
    db: Session, query: Optional[str], page: int, page_size: int
) -> List[Event]:
    return event_repository.search_events(
        db, query, (page - 1) * page_size, page_size
    )


def list_creator_events(
    db: Session, creator_id: int, page: int, page_size: int
) -> List[Event]:
    return event_repository.list_owned_events(
        db, creator_id, (page - 1) * page_size, page_size
    )


def get_event(db: Session, event_id: int) -> Event:
    event = event_repository.get_event(db, event_id)
    if event is None or event.status != "published":
        raise EventNotFoundError
    return event


def update_owned_event(
    db: Session, event_id: int, creator_id: int, update_data: EventUpdate
) -> Event:
    event = event_repository.get_owned_event(db, event_id, creator_id)
    if event is None:
        raise EventNotFoundError
    if event.status != "published":
        raise EventCancelledError
    if event.date <= _now_utc_naive():
        raise EventAlreadyStartedError

    values = update_data.model_dump(exclude_unset=True)
    new_date = values.get("date", event.date)
    normalized_date = _utc_naive(new_date) if new_date is not None else None
    if normalized_date is not None and normalized_date <= _now_utc_naive():
        raise EventAlreadyStartedError
    if "total_seats" in values:
        booked_count = event_repository.count_event_bookings(db, event_id)
        if values["total_seats"] < booked_count:
            raise CapacityBelowBookingsError
        values["available_seats"] = values["total_seats"] - booked_count
    try:
        if event_repository.published_event_exists_at_date(
            db,
            values.get("name", event.name),
            normalized_date or event.date,
            exclude_event_id=event_id,
        ):
            raise DuplicateEventError
        updated_event = event_repository.update_event_fields(db, event, values)
        db.commit()
        return updated_event
    except IntegrityError as exc:
        db.rollback()
        if _is_duplicate_event_integrity_error(exc):
            raise DuplicateEventError from exc
        raise
    except Exception:
        db.rollback()
        raise


def cancel_owned_event(db: Session, event_id: int, creator_id: int) -> None:
    event = event_repository.get_owned_event(db, event_id, creator_id)
    if event is None:
        raise EventNotFoundError
    if event.status != "published":
        raise EventCancelledError
    if event.date <= _now_utc_naive():
        raise EventAlreadyStartedError
    try:
        event_repository.cancel_event(db, event)
        db.commit()
    except Exception:
        db.rollback()
        raise


def get_owned_event_bookings(
    db: Session, event_id: int, creator_id: int
):
    event = event_repository.get_owned_event(db, event_id, creator_id)
    if event is None:
        raise EventNotFoundError
    return booking_repository.list_event_bookings(db, event_id, creator_id)
