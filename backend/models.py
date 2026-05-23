from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from database import Base


class Sticker(Base):
    __tablename__ = "stickers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    section_code = Column(String, nullable=False)
    section_name = Column(String, nullable=False)
    group_name = Column(String, nullable=False)
    number = Column(String, nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    player_name = Column(String, nullable=True, default="")


class StickerLog(Base):
    __tablename__ = "sticker_logs"

    id = Column(Integer, primary_key=True, index=True)
    sticker_code = Column(String, nullable=False, index=True)
    sticker_section_name = Column(String, nullable=False)
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
