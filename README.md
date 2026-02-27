# Stylus Frontend

React frontend for Sifter, now skill-first with:
- `sift-stylus-research`
- `sift-stylus-porting-auditor`

## Install skills

Install both skills:

```bash
npx sift-stylus \
  --repo getFairAI/angel-stylus-coding-assistant
```

Install one skill only (optional):

```bash
npx sift-stylus \
  --repo getFairAI/angel-stylus-coding-assistant \
  --skills sift-stylus-porting-auditor
```

## Local dev

```bash
npm install
npm run dev
```

Default URL: `http://localhost:5173`

## Environment contract

Recommended local defaults:

```env
VITE_MCP_TARGET=local
VITE_MCP_LOCAL_BASE_URL=
VITE_MCP_REMOTE_BASE_URL=https://sifter.azule.xyz
VITE_SKILLS_API_BASE_URL=
VITE_OPENROUTER_PROXY_URL=/openrouter/chat/completions
VITE_PROXY_TARGET=http://localhost:8001
```

MCP target behavior:
- `VITE_MCP_TARGET=local` uses `VITE_MCP_LOCAL_BASE_URL` (or same-origin proxy when empty).
- `VITE_MCP_TARGET=remote` uses `VITE_MCP_REMOTE_BASE_URL`.
- `VITE_SKILLS_API_BASE_URL` overrides both when set.

Optional skill installer metadata shown in UI:

```env
VITE_SKILLS_INSTALLER_PACKAGE=sift-stylus
VITE_SKILLS_INSTALL_REPO=getFairAI/angel-stylus-coding-assistant
```

## Skill behavior in chat

- Chat runs in explicit skill mode (user-selected skill).
- Both skills can call the backend retrieval tool (`search_stylus_docs`) through local API endpoints.
- Frontend keeps only generic prompt text in source.
- Runtime requires skill-specific prompt behavior from backend `GET /skills` metadata (`system_prompt`) so behavior matches published skills.
- Frontend components do not depend on MCP transport details.

## Docker

```bash
docker network create stylus-dev-net 2>/dev/null || true
docker compose up -d --build
```

Stop:

```bash
docker compose down --remove-orphans
```

Nginx proxy routes:
- `GET /health` -> backend `/health`
- `GET|POST /skills/*` -> backend skill endpoints
- `POST /openrouter/chat/completions` -> backend `/openrouter/chat/completions`

## Security model

- Frontend does not store provider API keys.
- LLM calls go through backend proxy (`/openrouter/chat/completions`).
- Keep OpenRouter credentials only in backend runtime env.

## Build checks

```bash
npm run lint
npm run build
```

## Production deploy (GitHub Actions)

Workflow: `.github/workflows/deploy-production.yml`

Required GitHub repository secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PORT` (optional, defaults to `22`)
- `DEPLOY_SSH_KEY`
- `VITE_MCP_TARGET` (recommended `remote` in production)
- `VITE_MCP_LOCAL_BASE_URL` (optional)
- `VITE_MCP_REMOTE_BASE_URL`
- `VITE_SKILLS_API_BASE_URL`
- `VITE_OPENROUTER_PROXY_URL`
- `VITE_LLM_MODEL` (optional)
- `VITE_LLM_FALLBACK_MODEL` (optional)
- `VITE_SKILLS_INSTALLER_PACKAGE` (optional)
- `VITE_SKILLS_INSTALL_REPO` (optional)
- `VITE_PROJECT_GITHUB_URL` (optional)
- `VITE_PROJECT_X_URL` (optional)
