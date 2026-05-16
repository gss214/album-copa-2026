from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
import models
from seed import seed_stickers, seed_rare_stickers, seed_player_names, sync_fwc_names
from routers import stickers
from routers.auth_router import router as auth_router

models.Base.metadata.create_all(bind=engine)

# Add player_name column to existing DBs that predate this field.
with engine.connect() as _conn:
    from sqlalchemy import text as _text
    cols = [r[1] for r in _conn.execute(_text("PRAGMA table_info(stickers)")).fetchall()]
    if "player_name" not in cols:
        _conn.execute(_text("ALTER TABLE stickers ADD COLUMN player_name TEXT DEFAULT ''"))
        _conn.commit()

app = FastAPI(title="Album Copa 2026 API")

_cors_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(stickers.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_stickers(db)
        seed_rare_stickers(db)
        seed_player_names(db)
        sync_fwc_names(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Album Copa 2026 API"}
