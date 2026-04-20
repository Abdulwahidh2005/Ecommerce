## Hyperlocal Marketplace (MERN) — Starter

This repo starts with:
- **MongoDB in Docker** (data persisted in a Docker volume)
- **Backend**: Express + Mongoose + **session auth** (`express-session` + `connect-mongo`)
- **Frontend**: React (Vite) + Tailwind + Axios (`withCredentials: true`)

### Prereqs
- Docker Desktop
- Node.js 20+

### 1) Start MongoDB (Docker)

```bash
docker compose up -d
```

MongoDB runs on `localhost:27017` and data persists in the `mongo_data` volume.
Mongo Express UI runs on `http://localhost:8081`.

### 2) Configure environment

Copy `.env.example` to `.env` and adjust if needed.

### 3) Install + run backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 4) Install + run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Auth endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` (protected)

