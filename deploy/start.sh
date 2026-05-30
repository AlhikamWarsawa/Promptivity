#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  printf '[startup] %s\n' "$1"
}

cleanup() {
  local code=$?
  log "shutting down child processes"
  kill -TERM "${FASTAPI_PID:-}" "${NEXTJS_PID:-}" "${NGINX_PID:-}" 2>/dev/null || true
  wait || true
  exit "$code"
}

trap cleanup EXIT INT TERM

log "verifying frontend standalone server exists"
if [[ ! -f /app/pt-frontend/server.js ]]; then
  log "missing /app/pt-frontend/server.js"
  exit 1
fi

cd /app/pt-backend
log "verifying FastAPI app import path"
python3 -c 'import main; assert hasattr(main, "app")' >/dev/null

log "starting FastAPI on 127.0.0.1:8000"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1 &
FASTAPI_PID=$!

# Wait until FastAPI is reachable before exposing proxy traffic.
for _ in $(seq 1 40); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null; then
    break
  fi
  sleep 0.25
done

if ! curl -fsS http://127.0.0.1:8000/health >/dev/null; then
  log "FastAPI failed readiness check on 127.0.0.1:8000"
  exit 1
fi

cd /app/pt-frontend
log "starting Next.js on 127.0.0.1:3000"
PORT=3000 HOSTNAME=127.0.0.1 NODE_ENV=production node server.js &
NEXTJS_PID=$!

log "starting nginx on 0.0.0.0:8080"
nginx -g 'daemon off;' &
NGINX_PID=$!

wait -n "$FASTAPI_PID" "$NEXTJS_PID" "$NGINX_PID"
log "a required process exited unexpectedly"
exit 1
