from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import require_auth

router = APIRouter(dependencies=[Depends(require_auth)])


class StickerOut(BaseModel):
    id: int
    code: str
    section_code: str
    section_name: str
    group_name: str
    number: str
    player_name: str
    quantity: int
    sort_order: int
    status: str

    class Config:
        from_attributes = True


class StickerUpdate(BaseModel):
    quantity: int


class BulkItem(BaseModel):
    code: str
    quantity: int


class BulkUpdate(BaseModel):
    items: List[BulkItem]


class BulkResult(BaseModel):
    updated: int
    not_found: List[str]


class SummaryOut(BaseModel):
    total: int
    coladas: int
    faltam: int
    percentual: float
    repetidas: int


class TrocasOut(BaseModel):
    faltam: List[str]
    repetidas: List[str]


class GroupProgress(BaseModel):
    group: str
    coladas: int
    total: int
    pct: float


class TeamProgress(BaseModel):
    section_code: str
    section_name: str
    group_name: str
    coladas: int
    total: int
    pct: float


class MostRepeated(BaseModel):
    code: str
    section_name: str
    quantity: int


class StatsOut(BaseModel):
    most_repeated: Optional[MostRepeated]
    closest_team: Optional[TeamProgress]
    closest_group: Optional[GroupProgress]
    group_progress: List[GroupProgress]


def _to_out(s: models.Sticker) -> StickerOut:
    return StickerOut(
        id=s.id,
        code=s.code,
        section_code=s.section_code,
        section_name=s.section_name,
        group_name=s.group_name,
        number=s.number,
        player_name=s.player_name or "",
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


@router.patch("/stickers/bulk", response_model=BulkResult)
def bulk_update_stickers(body: BulkUpdate, db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Lista vazia")
    codes = [item.code for item in body.items]
    sticker_map = {
        s.code: s
        for s in db.query(models.Sticker).filter(models.Sticker.code.in_(codes)).all()
    }
    not_found = []
    updated = 0
    for item in body.items:
        if item.quantity < 0:
            raise HTTPException(status_code=400, detail=f"Quantidade negativa: {item.code}")
        s = sticker_map.get(item.code)
        if not s:
            not_found.append(item.code)
            continue
        s.quantity = item.quantity
        updated += 1
    db.commit()
    return BulkResult(updated=updated, not_found=not_found)


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
    all_stickers = (
        db.query(models.Sticker)
        .filter(models.Sticker.group_name != "Raras")
        .all()
    )
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


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    stickers = (
        db.query(models.Sticker)
        .filter(models.Sticker.group_name != "Raras")
        .all()
    )

    # Most repeated sticker (quantity > 1)
    repeated = [s for s in stickers if s.quantity > 1]
    most_rep = max(repeated, key=lambda s: s.quantity, default=None)
    most_repeated = (
        MostRepeated(code=most_rep.code, section_name=most_rep.section_name, quantity=most_rep.quantity)
        if most_rep else None
    )

    # Group progress
    group_map: dict = {}
    for s in stickers:
        g = s.group_name
        if g not in group_map:
            group_map[g] = {"coladas": 0, "total": 0}
        group_map[g]["total"] += 1
        if s.quantity >= 1:
            group_map[g]["coladas"] += 1

    GROUP_ORDER = [
        "FWC",
        "Grupo A", "Grupo B", "Grupo C", "Grupo D",
        "Grupo E", "Grupo F", "Grupo G", "Grupo H",
        "Grupo I", "Grupo J", "Grupo K", "Grupo L",
        "Coca-Cola",
    ]

    group_progress = sorted(
        [
            GroupProgress(
                group=g,
                coladas=v["coladas"],
                total=v["total"],
                pct=round(v["coladas"] / v["total"] * 100, 1) if v["total"] else 0.0,
            )
            for g, v in group_map.items()
        ],
        key=lambda x: GROUP_ORDER.index(x.group) if x.group in GROUP_ORDER else 99,
    )

    # Team progress
    team_map: dict = {}
    for s in stickers:
        key = f"{s.section_code}__{s.section_name}"
        if key not in team_map:
            team_map[key] = {
                "section_code": s.section_code,
                "section_name": s.section_name,
                "group_name": s.group_name,
                "coladas": 0,
                "total": 0,
            }
        team_map[key]["total"] += 1
        if s.quantity >= 1:
            team_map[key]["coladas"] += 1

    incomplete_teams = [t for t in team_map.values() if t["coladas"] < t["total"]]
    closest = max(incomplete_teams, key=lambda t: t["coladas"] / t["total"] if t["total"] else 0, default=None)
    closest_team = (
        TeamProgress(pct=round(closest["coladas"] / closest["total"] * 100, 1), **closest)
        if closest else None
    )

    incomplete_groups = [g for g in group_progress if g.coladas < g.total]
    closest_group = max(incomplete_groups, key=lambda g: g.pct, default=None)

    return StatsOut(
        most_repeated=most_repeated,
        closest_team=closest_team,
        closest_group=closest_group,
        group_progress=group_progress,
    )


@router.get("/trocas", response_model=TrocasOut)
def get_trocas(db: Session = Depends(get_db)):
    all_stickers = (
        db.query(models.Sticker)
        .filter(models.Sticker.group_name != "Raras")
        .order_by(models.Sticker.sort_order)
        .all()
    )
    faltam = [s.code for s in all_stickers if s.quantity == 0]
    repetidas = [
        f"{s.code} ({s.quantity - 1}x)" for s in all_stickers if s.quantity > 1
    ]
    return TrocasOut(faltam=faltam, repetidas=repetidas)
