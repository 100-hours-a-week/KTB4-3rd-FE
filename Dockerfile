# syntax=docker/dockerfile:1

# =============================================================
# Multi-stage build (Next.js standalone)
# next.config.ts 의 output: 'standalone' 설정이 전제다.
# =============================================================

# ---------- 1. 의존성 설치 ----------
FROM node:26.3.1-alpine AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Node 25 부터 corepack 이 공식 이미지에 포함되지 않는다.
# package.json 의 packageManager 핀을 단일 출처로 삼아 그 버전을 그대로 설치한다.
RUN npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")" \
 && pnpm --version

RUN pnpm install --frozen-lockfile

# ---------- 2. Next.js 빌드 ----------
FROM deps AS builder
WORKDIR /app

ARG BUILD_SHA=""
ARG RELEASE_VERSION=""
ARG BUILD_DATE=""
ARG SENTRY_ORG=""
ARG SENTRY_PROJECT=""
ARG NEXT_PUBLIC_API_BASE_URL=""
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=""
ARG NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=""

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT} \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT} \
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=${NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE}

# node_modules 는 .dockerignore 로 제외되므로 deps 단계 결과가 유지된다.
COPY . .

# Sentry 소스맵 업로드 토큰은 이미지 레이어에 남지 않도록 BuildKit secret 으로 주입한다.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    pnpm run build

# ---------- 3. 실행 ----------
FROM node:26.3.1-alpine AS runner
WORKDIR /app

ARG BUILD_SHA=""
ARG RELEASE_VERSION=""
ARG BUILD_DATE=""

LABEL org.opencontainers.image.revision=${BUILD_SHA} \
      org.opencontainers.image.version=${RELEASE_VERSION} \
      org.opencontainers.image.created=${BUILD_DATE} \
      org.opencontainers.image.title="moyeota-fe"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# alpine(busybox)은 --system / --ingroup 같은 GNU 롱옵션을 지원하지 않는다.
RUN addgroup -S app && adduser -S -G app app

# COPY --from 의 소스 경로는 해당 스테이지의 루트(/) 기준으로 해석된다.
# builder 의 WORKDIR 은 적용되지 않으므로 절대경로로 지정한다.
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app
EXPOSE 3000

CMD ["node", "server.js"]
