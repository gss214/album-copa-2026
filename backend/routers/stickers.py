from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models

router = APIRouter()


class StickerOut(BaseModel):
    id: int
    code: str
    section_code: str
    section_name: str
    group_name: str
    number: str
    quantity: int
    sort_order: int
    status: str

    class Config:
        from_attributes = True


class StickerUpdate(BaseModel):
    quantity: int


class SummaryOut(BaseModel):
    total: int
    coladas: int
    faltam: int
    percentual: float
    repetidas: int


class TrocasOut(BaseModel):
    faltam: List[str]
    repetidas: List[str]


def _to_out(s: models.Sticker) -> StickerOut:
    return StickerOut(
        id=s.id,
        code=s.code,
        section_code=s.section_code,
        section_name=s.section_name,
        group_name=s.group_name,
        number=s.number,
        quantity=s.quantity,
        sort_order=s.sort_order,
        status="Tenho" if s.quantity >= 1 else "Falta",
    )


@router.get("/stickers", response_model=List[StickerOut])
def list_stickers(
    group_name: Optional[str] = None,
    section_code: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Sticker).order_by(models.Sticker.sort_order)
    if group_name:
        q = q.filter(models.Sticker.group_name == group_name)
    if section_code:
        q = q.filter(models.Sticker.section_code == section_code)
    return [_to_out(s) for s in q.all()]


@router.patch("/stickers/{code}", response_model=StickerOut)
def update_sticker(code: str, body: StickerUpdate, db: Session = Depends(get_db)):
    sticker = db.query(models.Sticker).filter(models.Sticker.code == code).first()
    if not sticker:
        raise HTTPException(status_code=404, detail="Figurinha não encontrada")
    if body.quantity < 0:
        raise HTTPException(status_code=400, detail="Quantidade não pode ser negativa")
    sticker.quantity = body.quantity
    db.commit()
    db.refresh(sticker)
    return _to_out(sticker)


@router.get("/summary", response_model=SummaryOut)
def get_summary(db: Session = Depends(get_db)):
    all_stickers = db.query(models.Sticker).all()
    total = len(all_stickers)
    coladas = sum(1 for s in all_stickers if s.quantity >= 1)
    faltam = total - coladas
    percentual = round((coladas / total * 100) if total else 0, 1)
    repetidas = sum(max(0, s.quantity - 1) for s in all_stickers)
    return SummaryOut(
        total=total,
        coladas=coladas,
        faltam=faltam,
        percentual=percentual,
        repetidas=repetidas,
    )


@router.get("/trocas", response_model=TrocasOut)
def get_trocas(db: Session = Depends(get_db)):
    all_stickers = (
        db.query(models.Sticker).order_by(models.Sticker.sort_order).all()
    )
    faltam = [s.code for s in all_stickers if s.quantity == 0]
    repetidas = [
        f"{s.code} ({s.quantity - 1}x)" for s in all_stickers if s.quantity > 1
    ]
    return TrocasOut(faltam=faltam, repetidas=repetidas)
