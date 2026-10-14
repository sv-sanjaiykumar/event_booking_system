from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRole(str, Enum):
    attendee = "attendee"
    creator = "creator"


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role: UserRole

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        result = value.strip()
        if not result:
            raise ValueError("Name must not be blank.")
        return result

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def password_must_have_strength(cls, value: str) -> str:
        if value != value.strip():
            raise ValueError("Password must not begin or end with whitespace.")
        if len(value) < 12:
            raise ValueError("Password must be at least 12 characters long.")
        categories = (
            any(char.islower() for char in value),
            any(char.isupper() for char in value),
            any(char.isdigit() for char in value),
            any(not char.isalnum() for char in value),
        )
        if sum(categories) < 3:
            raise ValueError(
                "Password must include characters from at least three of these "
                "groups: lowercase, uppercase, numbers, and symbols."
            )
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class AuthMessage(BaseModel):
    message: str
