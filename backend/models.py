from __future__ import annotations

from sqlalchemy import Column, Integer, String
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
