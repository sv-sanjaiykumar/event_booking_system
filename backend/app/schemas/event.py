from datetime import datetime, timezone
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


def _validated_event_name(value: str) -> str:
    name = value.strip()
    if not name:
        raise ValueError("Name must not be blank.")
    if not name[0].isalpha() or any(
        not (character.isalpha() or character.isdigit() or character == " ")
        for character in name
    ):
        raise ValueError(
            "Event name must start with a letter and contain only letters, "
            "numbers, and spaces."
        )
    return name


class EventCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    location: Optional[str] = Field(default=None, max_length=500)
    total_seats: int = Field(gt=0)
    date: datetime

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        return _validated_event_name(value)

    @field_validator("location")
    @classmethod
    def blank_location_is_none(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("date")
    @classmethod
    def date_must_include_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Date must include a timezone.")
        return value


class EventUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=5000)
    location: Optional[str] = Field(default=None, max_length=500)
    total_seats: Optional[int] = Field(default=None, gt=0)
    date: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def update_name_must_not_be_blank(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validated_event_name(value)

    @field_validator("location")
    @classmethod
    def update_blank_location_is_none(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("date")
    @classmethod
    def update_date_must_include_timezone(
        cls, value: Optional[datetime]
    ) -> Optional[datetime]:
        if value is not None and (
            value.tzinfo is None or value.utcoffset() is None
        ):
            raise ValueError("Date must include a timezone.")
        return value

    @model_validator(mode="after")
    def update_must_contain_fields(self) -> "EventUpdate":
        if not self.model_fields_set:
            raise ValueError("Provide at least one event field to update.")
        if any(
            getattr(self, field_name) is None
            for field_name in ("name", "total_seats", "date")
            if field_name in self.model_fields_set
        ):
            raise ValueError("Name, total_seats, and date cannot be null.")
        return self


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    total_seats: int
    available_seats: int
    date: datetime
    status: str

    @field_validator("date", mode="before")
    @classmethod
    def database_date_is_utc(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
