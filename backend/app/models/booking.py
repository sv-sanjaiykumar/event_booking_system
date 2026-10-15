from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Text,
    TIMESTAMP,
    false,
    func,
)
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("quantity >= 1", name="ck_bookings_quantity_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_name: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    attendee_names: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list, server_default="'[]'"
    )
    seat_numbers: Mapped[list[int]] = mapped_column(
        JSON, nullable=False, default=list, server_default="'[]'"
    )
    includes_booker: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=false()
    )
    booking_date: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.current_timestamp()
    )
