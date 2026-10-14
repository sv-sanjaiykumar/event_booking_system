from datetime import datetime, timezone
from typing import Tuple

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    access_token_lifetime,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories import auth_repository
from app.schemas.auth import UserLogin, UserRegister
from app.services.exceptions import (
    DuplicateEmailError,
    InvalidCredentialsError,
    InvalidSessionError,
)


def register_user(db: Session, registration: UserRegister) -> User:
    try:
        if auth_repository.get_user_by_email(db, str(registration.email)):
            raise DuplicateEmailError
        user = auth_repository.create_user(
            db,
            registration.name,
            str(registration.email),
            hash_password(registration.password),
            registration.role.value,
        )
        db.commit()
        return user
    except DuplicateEmailError:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateEmailError from exc
    except Exception:
        db.rollback()
        raise


def login_user(db: Session, credentials: UserLogin) -> Tuple[str, User, int]:
    user = auth_repository.get_user_by_email(db, str(credentials.email))
    if user is None or not verify_password(
        user.password_hash, credentials.password
    ):
        db.rollback()
        raise InvalidCredentialsError
    if not user.is_active:
        db.rollback()
        raise InvalidCredentialsError

    token, jti, expires_at = create_access_token(user.id)
    try:
        auth_repository.create_session(db, user.id, jti, expires_at)
        db.commit()
    except Exception:
        db.rollback()
        raise
    return token, user, int(access_token_lifetime().total_seconds())


def get_active_user_for_session(db: Session, user_id: int, jti: str) -> User:
    auth_session = auth_repository.get_session_by_jti(db, jti)
    user = auth_repository.get_user_by_id(db, user_id)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if (
        auth_session is None
        or auth_session.user_id != user_id
        or auth_session.revoked_at is not None
        or auth_session.expires_at <= now
        or user is None
        or not user.is_active
    ):
        raise InvalidSessionError
    return user


def logout_user(db: Session, jti: str, user_id: int) -> None:
    auth_session = auth_repository.get_session_by_jti(db, jti)
    if (
        auth_session is None
        or auth_session.user_id != user_id
        or auth_session.revoked_at is not None
    ):
        db.rollback()
        raise InvalidSessionError
    auth_repository.revoke_session(
        auth_session, datetime.now(timezone.utc).replace(tzinfo=None)
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
