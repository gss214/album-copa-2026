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
│   ├── models.py        # SQLAlchemy: Sticker
│   ├── database.py      # SQLite engine + session
│   ├── seed.py          # Populates all 994 stickers on first run
│   └── routers/
│       └── stickers.py  # GET /stickers, PATCH /stickers/{code}, GET /summary, GET /trocas
├── frontend/
│   ├── components.json  # shadcn/ui config (New York style, Zinc base)
│   ├── jsconfig.json    # Path alias @/* → src/*
│   └── src/
│       ├── api/         # fetch helpers (api.getStickers, updateSticker, getSummary, getTrocas)
│       ├── lib/
│       │   ├── utils.js # cn() — clsx + tailwind-merge
│       │   └── logos.js # section_code → /logos/*.png mapping
│       ├── components/ui/ # shadcn/ui: Button, Card, Table, Input, Badge
│       └── pages/
│           ├── Dashboard.jsx  # Stats + pie chart
│           ├── Album.jsx      # Visual sticker grid per team, click to mark
│           └── Trocas.jsx     # Auto-generated trade lists for WhatsApp
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

## Album Structure (994 stickers total)

- **FWC** — Página Inicial: FWC00–FWC08 (9 stickers)
- **Teams** — 48 teams × 20 stickers each = 960 stickers (Grupos A–L, 4 teams per group)
- **FWC** — FIFA World Cup History: FWC09–FWC19 (11 stickers)
- **CC** — Coca-Cola: CC1–CC14 (14 stickers)

Seed runs automatically on backend startup (`seed.py`). If the DB already has rows, seed is skipped.

## API Endpoints

```
GET   /api/stickers                    List stickers (query: group_name, section_code)
PATCH /api/stickers/{code}             Update quantity { quantity: N }
GET   /api/summary                     Dashboard stats (total, coladas, faltam, percentual, repetidas)
GET   /api/trocas                      Trade lists (faltam: string[], repetidas: string[])
```

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
