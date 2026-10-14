from collections.abc import Callable, Generator
from typing import Any, Dict, TypedDict

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.database import SessionLocal
from app.models.user import User
from app.services import auth_service
from app.services.exceptions import InvalidSessionError


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


bearer_scheme = HTTPBearer(auto_error=False)


class CurrentPrincipal(TypedDict):
    user: User
    jti: str


def get_current_principal(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentPrincipal:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication is required or the access token is invalid.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
        jti = payload["jti"]
        if payload["type"] != "access" or not isinstance(jti, str):
            raise ValueError("Invalid access token claims.")
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise unauthorized from exc

    try:
        user = auth_service.get_active_user_for_session(db, user_id, jti)
    except InvalidSessionError as exc:
        raise unauthorized from exc
    db.commit()
    return {"user": user, "jti": jti}


def get_current_user(
    principal: CurrentPrincipal = Depends(get_current_principal),
) -> User:
    return principal["user"]


def require_role(role: str) -> Callable[..., User]:
    def role_dependency(user: User = Depends(get_current_user)) -> User:
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This action is not permitted for your account role.",
            )
        return user

    return role_dependency


require_attendee = require_role("attendee")
require_creator = require_role("creator")