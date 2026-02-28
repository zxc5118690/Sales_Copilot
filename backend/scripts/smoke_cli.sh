#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

CONTACT_ID="${CONTACT_ID:-1}"
ACCOUNT_ID="${ACCOUNT_ID:-1}"

echo "[1/4] list contacts"
PYTHONPATH=. python copilot.py list-contacts

echo "[2/4] log interaction"
PYTHONPATH=. python copilot.py log-interaction \
  --contact "$CONTACT_ID" \
  --channel EMAIL \
  --direction INBOUND \
  --sentiment POSITIVE \
  --summary "Customer discusses NPI schedule, budget review, and technical validation."

echo "[3/4] score bant"
PYTHONPATH=. python copilot.py score-bant --account "$ACCOUNT_ID" --lookback 60

echo "[4/4] pipeline and weekly"
PYTHONPATH=. python copilot.py pipeline-board
PYTHONPATH=. python copilot.py weekly-report

echo "Smoke CLI complete."

