from typing import Annotated, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_attendee
from app.models.user import User
from app.schemas.booking import (
    BookingCancellation,
    BookingCreate,
    BookingResponse,
    MyBookingResponse,
)
from app.services import booking_service
from app.services.exceptions import (
    AlreadyBookedAsSelfError,
    BookingNotFoundError,
    EventAlreadyStartedError,
    EventCancelledError,
    EventNotFoundError,
    EventSoldOutError,
    InsufficientSeatsError,
    InvalidCancellationQuantityError,
)

router = APIRouter(tags=["bookings"])
DbSession = Annotated[Session, Depends(get_db)]
AttendeeAccount = Annotated[User, Depends(require_attendee)]
CurrentAccount = Annotated[User, Depends(get_current_user)]


@router.post(
    "/events/{event_id}/book",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def book_event(
    event_id: int,
    db: DbSession,
    attendee: AttendeeAccount,
    booking_data: BookingCreate = Body(default=BookingCreate()),
) -> BookingResponse:
    try:
        return booking_service.book_event(
            db,
            event_id,
            attendee.id,
            attendee.name,
            booking_data.quantity,
            booking_data.attendee_names,
            booking_data.includes_booker,
        )
    except AlreadyBookedAsSelfError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You already have a ticket for yourself at this event. "
                "You can still book tickets for other attendees."
            ),
        ) from exc
    except EventNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        ) from exc
    except EventSoldOutError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is fully booked.",
        ) from exc
    except InsufficientSeatsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Not enough seats remain for this booking.",
        ) from exc
    except EventCancelledError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancelled events cannot be booked.",
        ) from exc
    except EventAlreadyStartedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Events cannot be booked after they start.",
        ) from exc


@router.get("/bookings/me", response_model=List[MyBookingResponse])
def list_my_bookings(
    db: DbSession,
    attendee: AttendeeAccount,
) -> List[MyBookingResponse]:
    records = booking_service.list_user_bookings(db, attendee.id)
    return [
        MyBookingResponse(
            id=booking.id,
            event_id=booking.event_id,
            user_name=booking.user_name,
            quantity=booking.quantity,
            attendee_names=booking.attendee_names,
            seat_numbers=booking.seat_numbers,
            includes_booker=booking.includes_booker,
            booking_date=booking.booking_date,
            event_name=event.name,
            event_date=event.date,
            event_status=event.status,
        )
        for booking, event in records
    ]


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: DbSession,
    user: CurrentAccount,
) -> BookingResponse:
    try:
        booking, _event = booking_service.get_authorized_booking(
            db, booking_id, user.id, user.role
        )
        return booking
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        ) from exc


@router.delete(
    "/bookings/{booking_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cancel_booking(
    booking_id: int,
    db: DbSession,
    attendee: AttendeeAccount,
    quantity: Annotated[Optional[int], Query(ge=1)] = None,
    cancellation_data: Optional[BookingCancellation] = Body(default=None),
) -> Response:
    if quantity is not None and cancellation_data is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either seat_numbers or the legacy quantity parameter, not both.",
        )
    try:
        booking_service.cancel_booking(
            db,
            booking_id,
            attendee.id,
            seat_numbers=(
                cancellation_data.seat_numbers
                if cancellation_data is not None
                else None
            ),
            quantity=quantity,
        )
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        ) from exc
    except InvalidCancellationQuantityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The selected seats are invalid or the booking has changed. Refresh and try again.",
        ) from exc
    except EventAlreadyStartedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bookings cannot be cancelled after the event starts.",
        ) from exc
    except EventCancelledError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bookings for a cancelled event are retained.",
        ) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
