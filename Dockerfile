FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_MCP_SERVER_URL=https://api.emberai.xyz/mcp
ARG VITE_SEARCH_API_URL=/stylus-chat
ARG VITE_OPENROUTER_PROXY_URL=/openrouter/chat/completions
ARG VITE_LLM_SYSTEM_PROMPT=
ARG VITE_LLM_MODEL=openai/gpt-4o-mini
ARG VITE_LLM_FALLBACK_MODEL=anthropic/claude-3.5-haiku
ARG VITE_PROJECT_GITHUB_URL=
ARG VITE_PROJECT_X_URL=

ENV VITE_MCP_SERVER_URL=$VITE_MCP_SERVER_URL \
    VITE_SEARCH_API_URL=$VITE_SEARCH_API_URL \
    VITE_OPENROUTER_PROXY_URL=$VITE_OPENROUTER_PROXY_URL \
    VITE_LLM_SYSTEM_PROMPT=$VITE_LLM_SYSTEM_PROMPT \
    VITE_LLM_MODEL=$VITE_LLM_MODEL \
    VITE_LLM_FALLBACK_MODEL=$VITE_LLM_FALLBACK_MODEL \
    VITE_PROJECT_GITHUB_URL=$VITE_PROJECT_GITHUB_URL \
    VITE_PROJECT_X_URL=$VITE_PROJECT_X_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=10 \
  CMD wget -q -O - http://127.0.0.1/ >/dev/null || exit 1
