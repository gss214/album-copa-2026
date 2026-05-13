from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
import models
from seed import seed_stickers, seed_rare_stickers
from routers import stickers

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Album Copa 2026 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stickers.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_stickers(db)
        seed_rare_stickers(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Album Copa 2026 API"}
