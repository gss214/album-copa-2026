# Album Copa 2026

FIFA World Cup 2026 sticker album tracker — mark what you have, track what's missing, and generate trade lists ready to share on WhatsApp.

## Features

- **Dashboard** — total stickers, pasted, missing, completion %, duplicates, most repeated sticker, closest team/group to complete, and progress bars per group
- **Album** — visual sticker grid per team; click to mark, right-click to unmark; filter by group, status (incomplete, complete, not started, with duplicates) and free-text search (accent-insensitive)
- **Rare stickers** — dedicated page for the 20 rare players, each available in 4 variants: Gold, Silver, Bronze and Lilac
- **Trade lists** — auto-generated "missing" and "duplicates" lists formatted for WhatsApp

## Stack

- **Frontend**: React 19 · React Router · Tailwind CSS v4 · shadcn/ui · Recharts · Vite
- **Backend**: FastAPI · SQLAlchemy · SQLite
- **Infra**: Docker + Docker Compose · Railway

## Running locally

Copy `.env.example` to `.env` and fill in the credentials:

```bash
cp .env.example .env
```

```env
APP_USERNAME=your_username
APP_PASSWORD=your_password
JWT_SECRET=a_random_secret_string
```

Then start the containers:

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

### Rare stickers (not counted in the main total)

20 players × 4 variants (Gold, Silver, Bronze, Lilac) = **80 rare stickers**

Hakimi · Haaland · Davies · Bellingham · Caicedo · Ronaldo · Doku · Díaz · Gakpo · Jiménez · Yamal · Mbappé · Messi · Modrić · Pulisic · Salah · Son · Valverde · Vinícius Jr. · Wirtz

## License

MIT
