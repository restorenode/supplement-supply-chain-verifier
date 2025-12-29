#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "${SCRIPT_DIR}/../.." && pwd)

BASE_URL="${INTEGRATION_BASE_URL:-http://127.0.0.1:8000}"
API_KEY="${INTEGRATION_API_KEY:-}"

if [[ -z "$API_KEY" && -f "${ROOT_DIR}/.env" ]]; then
  API_KEY=$(grep -m1 "^ADMIN_API_KEY=" "${ROOT_DIR}/.env" | cut -d= -f2- || true)
fi

if [[ -z "$API_KEY" ]]; then
  echo "INTEGRATION_API_KEY not set and ADMIN_API_KEY not found in ${ROOT_DIR}/.env" >&2
  exit 1
fi

echo "Waiting for ${BASE_URL}/health ..."
for _ in {1..30}; do
  if curl -fsS "${BASE_URL}/health" >/dev/null; then
    break
  fi
  sleep 2
done

if ! curl -fsS "${BASE_URL}/health" >/dev/null; then
  echo "Backend not healthy at ${BASE_URL}" >&2
  exit 1
fi

cd "${ROOT_DIR}/backend"
INTEGRATION_BASE_URL="${BASE_URL}" INTEGRATION_API_KEY="${API_KEY}" \
  python3 -m pytest integration_tests
