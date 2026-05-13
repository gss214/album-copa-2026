# Album Copa 2026

FIFA World Cup 2026 sticker album tracker — mark what you have, track what's missing, and generate trade lists ready to share on WhatsApp.

## Features

- **Dashboard** — total stickers, pasted, missing, completion % and duplicate count
- **Album** — visual grid per team with click-to-mark stickers (right-click to unmark)
- **Trade lists** — auto-generated "missing" and "duplicates" lists formatted for WhatsApp

## Stack

- **Frontend**: React 19 · React Router · Tailwind CSS v4 · shadcn/ui · Recharts · Vite
- **Backend**: FastAPI · SQLAlchemy · SQLite
- **Infra**: Docker + Docker Compose

## Running

```bash
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:5173        |
| API docs | http://localhost:8000/docs   |

The database is seeded automatically on first run with all **994 stickers** from the album.

## Album structure

| Section               | Stickers              |
| --------------------- | --------------------- |
| Página Inicial (FWC)  | FWC00 – FWC08 (9)     |
| 48 teams × 20 each    | 960 stickers          |
| FIFA World Cup History| FWC09 – FWC19 (11)    |
| Coca-Cola             | CC1 – CC14 (14)       |
| **Total**             | **994**               |

## License

MIT
