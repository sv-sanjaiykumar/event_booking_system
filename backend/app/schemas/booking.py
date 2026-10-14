from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BookingCreate(BaseModel):
    user_name: str = Field(min_length=1, max_length=200)


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    user_name: str
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
    booking_date: datetime

    @field_validator("booking_date", mode="before")
    @classmethod
    def database_booking_date_is_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
