from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator


class BookingCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    attendee_names: Optional[List[str]] = None
    includes_booker: bool = True

    @field_validator("attendee_names")
    @classmethod
    def validate_attendee_names(
        cls, names: Optional[List[str]], info: ValidationInfo
    ) -> Optional[List[str]]:
        if names is None:
            return names
        quantity = info.data.get("quantity", 1)
        if len(names) != quantity:
            raise ValueError("Provide one attendee name for each booked seat.")
        normalized_names = [name.strip() for name in names]
        if any(not name for name in normalized_names):
            raise ValueError("Attendee names cannot be empty.")
        if any(len(name) > 120 for name in normalized_names):
            raise ValueError("Attendee names cannot exceed 120 characters.")
        return normalized_names


class BookingCancellation(BaseModel):
    seat_numbers: List[int] = Field(min_length=1)

    @field_validator("seat_numbers")
    @classmethod
    def validate_seat_numbers(cls, seat_numbers: List[int]) -> List[int]:
        if any(seat_number < 1 for seat_number in seat_numbers):
            raise ValueError("Seat numbers must be positive.")
        if len(set(seat_numbers)) != len(seat_numbers):
            raise ValueError("Seat numbers must not be repeated.")
        return seat_numbers


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_name: str
    quantity: int
    attendee_names: List[str]
    seat_numbers: List[int] = Field(default_factory=list)
    includes_booker: bool = False
    booking_date: datetime

    @field_validator("booking_date", mode="before")
    @classmethod
    def database_booking_date_is_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


class MyBookingResponse(BookingResponse):
    event_name: str
    event_date: datetime
    event_status: str


class CreatorBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_name: str
    quantity: int
    attendee_names: List[str]
    seat_numbers: List[int] = Field(default_factory=list)
    includes_booker: bool = False
    booking_date: datetime

    @field_validator("booking_date", mode="before")
    @classmethod
    def database_booking_date_is_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
