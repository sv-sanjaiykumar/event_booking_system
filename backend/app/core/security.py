import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Tuple
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

ACCESS_TOKEN_ALGORITHM = "HS256"
ACCESS_TOKEN_ISSUER = "event-booking-system"
ACCESS_TOKEN_AUDIENCE = "event-booking-api"
password_hasher = PasswordHasher()


def _secret_key() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must be configured with at least 32 bytes."
        )
    return secret


def access_token_lifetime() -> timedelta:
    raw_value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    try:
        minutes = int(raw_value)
    except ValueError as exc:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be an integer.") from exc
    if not 1 <= minutes <= 60:
        raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be between 1 and 60.")
    return timedelta(minutes=minutes)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(user_id: int) -> Tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + access_token_lifetime()
    jti = str(uuid4())
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "jti": jti,
        "type": "access",
        "iss": ACCESS_TOKEN_ISSUER,
        "aud": ACCESS_TOKEN_AUDIENCE,
        "iat": now,
        "exp": expires_at,
    }
    token = jwt.encode(payload, _secret_key(), algorithm=ACCESS_TOKEN_ALGORITHM)
    return token, jti, expires_at.replace(tzinfo=None)


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        _secret_key(),
        algorithms=[ACCESS_TOKEN_ALGORITHM],
        issuer=ACCESS_TOKEN_ISSUER,
        audience=ACCESS_TOKEN_AUDIENCE,
        options={"require": ["sub", "jti", "type", "iat", "exp", "iss", "aud"]},
    )
