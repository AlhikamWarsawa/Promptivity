# ============================================
# Promptivity — Single-Container Cloud Run
# Next.js + FastAPI + Nginx on one public port
# ============================================

FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app/pt-frontend

COPY pt-frontend/package.json pt-frontend/package-lock.json ./
RUN npm ci

COPY pt-frontend ./
RUN NEXT_DISABLE_TURBOPACK=1 npm run build


FROM node:20-bookworm-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NODE_ENV=production \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    nginx \
    supervisor \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pt-backend/requirements.txt /app/pt-backend/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /app/pt-backend/requirements.txt

COPY pt-backend /app/pt-backend

COPY --from=frontend-builder /app/pt-frontend/public /app/pt-frontend/public
COPY --from=frontend-builder /app/pt-frontend/.next/standalone /app/pt-frontend
COPY --from=frontend-builder /app/pt-frontend/.next/static /app/pt-frontend/.next/static

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
