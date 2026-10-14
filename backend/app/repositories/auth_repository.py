from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_session import AuthSession
from app.models.user import User


def get_user_by_email(db: Session, normalized_email: str) -> Optional[User]:
    return db.scalar(select(User).where(User.email == normalized_email))


def create_user(
    db: Session,
    name: str,
    email: str,
    password_hash: str,
    role: str,
) -> User:
    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.get(User, user_id)


def create_session(
    db: Session, user_id: int, jti: str, expires_at: datetime
) -> AuthSession:
    auth_session = AuthSession(user_id=user_id, jti=jti, expires_at=expires_at)
    db.add(auth_session)
    db.flush()
    return auth_session


def get_session_by_jti(db: Session, jti: str) -> Optional[AuthSession]:
    return db.scalar(select(AuthSession).where(AuthSession.jti == jti))


def revoke_session(auth_session: AuthSession, revoked_at: datetime) -> None:
    auth_session.revoked_at = revoked_at
