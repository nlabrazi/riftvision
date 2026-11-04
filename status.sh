#!/usr/bin/env bash
# Sonde Sentinel : renvoie l'état JSON des tâches planifiées sur stdout
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_FILE="${SENTINEL_STATUS_FILE:-"$SCRIPT_DIR/sentinel/cron-status.json"}"

if [ -f "$STATUS_FILE" ]; then
  cat "$STATUS_FILE"
else
  echo '{"jobs":[],"cron_jobs":[]}'
fi

