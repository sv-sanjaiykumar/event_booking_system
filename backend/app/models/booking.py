from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Text, TIMESTAMP, func
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_name: Mapped[str] = mapped_column(Text, nullable=False)
    booking_date: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.current_timestamp()
    )
