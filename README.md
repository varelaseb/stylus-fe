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

## Production deploy (GitHub Actions)

This repo includes `.github/workflows/deploy-production.yml`.
It deploys to the server on every push to `main` (or manual run).

Server path used by the workflow:

- `/opt/stylus-frontend`

Required GitHub repository secrets:

- `DEPLOY_HOST` (example: `50.116.47.95`)
- `DEPLOY_USER` (example: `root`)
- `DEPLOY_PORT` (optional, defaults to `22`)
- `DEPLOY_SSH_KEY` (private key for server SSH login)
- `VITE_MCP_SERVER_URL`
- `VITE_SEARCH_API_URL`
- `VITE_OPENROUTER_PROXY_URL`
- `VITE_LLM_SYSTEM_PROMPT` (optional)
- `VITE_LLM_MODEL` (optional)
- `VITE_LLM_FALLBACK_MODEL` (optional)
- `VITE_PROJECT_GITHUB_URL` (optional)
- `VITE_PROJECT_X_URL` (optional)

On deploy, the workflow:

1. Syncs repo files to `/opt/stylus-frontend`.
2. Writes `/opt/stylus-frontend/.env` from GitHub Secrets.
3. Runs `docker compose -f compose.server.yml --env-file .env up -d --build`.
