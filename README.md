# Stylus Frontend

React frontend for Sifter (Stylus ecosystem research assistant).

## Local dev

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

The app uses `VITE_SEARCH_API_URL` for backend retrieval calls.
Recommended local default is relative path with Vite proxy:

```env
VITE_SEARCH_API_URL=/stylus-chat
VITE_OPENROUTER_PROXY_URL=/openrouter/chat/completions
VITE_PROXY_TARGET=http://localhost:8001
```

## Docker

Run directly from this repo:

```bash
docker network create stylus-dev-net 2>/dev/null || true
docker compose up -d --build
```

Stop:

```bash
docker compose down --remove-orphans
```

In Docker, frontend is served by Nginx on `http://localhost:5173` and proxies:
- `GET /health` -> backend `/health`
- `POST /stylus-chat` -> backend `/stylus-chat`
- `POST /openrouter/chat/completions` -> backend `/openrouter/chat/completions`

## Security Model

- Frontend does not store provider API keys.
- LLM calls go through backend proxy (`/openrouter/chat/completions`).
- Keep OpenRouter credentials only in backend runtime env.

## Build checks

```bash
npm run lint
npm run build
```
