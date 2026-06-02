# Album Copa 2026 — AI Coding Guidelines

FIFA World Cup 2026 sticker album tracker.

## Stack

| Layer    | Technology                                                      |
| -------- | --------------------------------------------------------------- |
| Frontend | React 19 + React Router v6 + Tailwind CSS v4 + shadcn/ui + Vite |
| Backend  | FastAPI + Uvicorn (Python 3.11)                                  |
| Database | SQLite via SQLAlchemy (`album-copa-2026.db` at project root)     |

## Structure

```
album-copa-2026/
├── backend/
│   ├── main.py          # FastAPI app + CORS + startup seed
│   ├── models.py        # SQLAlchemy: Sticker, StickerLog (change history w/ timestamp)
│   ├── database.py      # SQLite engine + session
│   ├── seed.py          # Populates all 994 stickers on first run
│   ├── tests/           # pytest (conftest + test_auth, test_stickers)
│   └── routers/
│       └── stickers.py  # CRUD + /summary, /stats, /stats/activity, /trocas, /logs
├── frontend/
│   ├── components.json  # shadcn/ui config (New York style, Zinc base)
│   ├── jsconfig.json    # Path alias @/* → src/*
│   └── src/
│       ├── api/         # fetch helpers (getStickers, updateSticker, getSummary, getStats, getActivity, getTrocas, getLogs, ...)
│       ├── lib/
│       │   ├── utils.js # cn() — clsx + tailwind-merge
│       │   └── logos.js # section_code → /logos/*.png mapping
│       ├── components/
│       │   ├── ui/          # shadcn/ui: Button, Card, Table, Input, Badge
│       │   └── dashboard/   # shared Dashboard primitives (palette, SurfaceCard, AnimatedNumber) + cards (HighlightCard, GroupProgressBar, TeamRankList)
│       └── pages/
│           ├── Dashboard.jsx  # Metrics + donut, activity stats, highlights, team ranking, group progress
│           ├── Album.jsx      # Visual sticker grid per team, click to mark
│           ├── Trocas.jsx     # Auto-generated trade lists for WhatsApp
│           ├── Raras.jsx      # Rare stickers tracker
│           └── Logs.jsx       # Change history with undo
├── logos/               # Source logo PNGs (copied to frontend/public/logos/ for serving)
├── docker-compose.yml
└── CLAUDE.md
```

## Running

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

## Testing & Lint (via Docker)

The local toolchain may not match (repo targets Python 3.11 / Node 20), so run checks inside the containers:

```bash
# Backend tests (pytest) — installs test deps then runs the suite
docker compose run --rm --no-deps backend sh -c "pip install -r requirements-test.txt && python -m pytest -q"

# Frontend lint (eslint)
docker compose build frontend
docker compose run --rm --no-deps frontend npm run lint
```

Backend tests live in `backend/tests/` (`conftest.py` spins up a throwaway SQLite DB and overrides `get_db`). `requirements-test.txt` pins `pytest` + `httpx`.

## Album Structure (994 stickers total)

- **FWC** — Página Inicial: FWC00–FWC08 (9 stickers)
- **Teams** — 48 teams × 20 stickers each = 960 stickers (Grupos A–L, 4 teams per group)
- **FWC** — FIFA World Cup History: FWC09–FWC19 (11 stickers)
- **CC** — Coca-Cola: CC1–CC14 (14 stickers)

Seed runs automatically on backend startup (`seed.py`). If the DB already has rows, seed is skipped.

## API Endpoints

```
GET   /api/stickers                    List stickers (query: group_name, section_code)
PATCH /api/stickers/{code}             Update quantity { quantity: N } (logs the change)
PATCH /api/stickers/bulk               Bulk update { items: [{code, quantity}] }
POST  /api/stickers/clear-repeated     Reset all quantity>1 back to 1
GET   /api/summary                     Totals (total, coladas, faltam, percentual, repetidas)
GET   /api/stats                       Highlights + group/team progress + top_teams/bottom_teams (10 closest/farthest)
GET   /api/stats/activity              Activity from StickerLog: coladas/descoladas today & last 7d (BRT/UTC-3), avg/day, days_to_complete, last_activity
GET   /api/trocas                      Trade lists (faltam: string[], repetidas: string[])
GET   /api/logs                        Change history (query: limit 1–500)
POST  /api/logs/{id}/undo              Revert a logged change
```

Every quantity change (PATCH single/bulk, clear-repeated, undo) writes a `StickerLog` row with `created_at` (UTC). Daily stats convert to BRT via a fixed UTC-3 offset (Brazil has no DST since 2019) — no `zoneinfo`/`tzdata` needed.

## Frontend Design System (shadcn/ui)

- **Style**: New York, Zinc base, dark mode (`bg-zinc-950`)
- **Path alias**: `@` → `src/`
- **Button primary**: `bg-zinc-100 text-zinc-900`
- **Card borders**: `border-zinc-800`
- **Tailwind v4**: CSS-first via `@tailwindcss/vite` — no `tailwind.config.js`
- **Sticker tile states**: zinc=falta · emerald=tenho · amber=repetida (with count badge)

## Logos

All team logos live in `logos/` (source) and `frontend/public/logos/` (served).
The mapping `section_code → filename` is in `src/lib/logos.js`.
When adding a new logo, update both locations and the mapping file.

## Python version

Backend runs Python 3.11 in Docker. Use standard type hints (`list[str]`, `dict[str, ...]`).
For broader compatibility, keep `from __future__ import annotations` at the top of each file.
