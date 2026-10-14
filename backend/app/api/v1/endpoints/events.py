from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_creator
from app.models.user import User
from app.schemas.booking import CreatorBookingResponse
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.services import event_service
from app.services.exceptions import (
    CapacityBelowBookingsError,
    EventAlreadyStartedError,
    EventCancelledError,
    EventNotFoundError,
    DuplicateEventError,
)

router = APIRouter(tags=["events"])
DbSession = Annotated[Session, Depends(get_db)]
CreatorAccount = Annotated[User, Depends(require_creator)]


@router.get("/events/", response_model=List[EventResponse])
def list_events(
    db: DbSession,
    q: Optional[str] = Query(default=None, max_length=200),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> List[EventResponse]:
    return event_service.list_events(db, q, page, page_size)


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: DbSession) -> EventResponse:
    try:
        return event_service.get_event(db, event_id)
    except EventNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        ) from exc


@router.post(
    "/events/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    event_data: EventCreate,
    db: DbSession,
    creator: CreatorAccount,
) -> EventResponse:
    try:
        return event_service.create_event(db, event_data, creator.id)
    except DuplicateEventError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An event with this name is already scheduled at this date and time.",
        ) from exc
    except EventAlreadyStartedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Event date must be in the future.",
        ) from exc


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    update_data: EventUpdate,
    db: DbSession,
    creator: CreatorAccount,
) -> EventResponse:
    try:
        return event_service.update_owned_event(
            db, event_id, creator.id, update_data
        )
    except EventNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        ) from exc
    except DuplicateEventError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An event with this name is already scheduled at this date and time.",
        ) from exc
    except EventCancelledError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancelled events cannot be edited.",
        ) from exc
    except EventAlreadyStartedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Events cannot be edited after they start.",
        ) from exc
    except CapacityBelowBookingsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Total seats cannot be less than the number of existing bookings.",
        ) from exc


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_event(
    event_id: int,
    db: DbSession,
    creator: CreatorAccount,
) -> Response:
    try:
        event_service.cancel_owned_event(db, event_id, creator.id)
    except EventNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        ) from exc
    except EventCancelledError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is already cancelled.",
        ) from exc
    except EventAlreadyStartedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Events cannot be cancelled after they start.",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/creator/events", response_model=List[EventResponse])
def list_creator_events(
    db: DbSession,
    creator: CreatorAccount,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> List[EventResponse]:
    return event_service.list_creator_events(db, creator.id, page, page_size)


@router.get(
    "/creator/events/{event_id}/bookings",
    response_model=List[CreatorBookingResponse],
)
def list_event_bookings(
    event_id: int,
    db: DbSession,
    creator: CreatorAccount,
) -> List[CreatorBookingResponse]:
    try:
        return event_service.get_owned_event_bookings(db, event_id, creator.id)
    except EventNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        ) from exc
