#!/usr/bin/env bash
# Wrapper d'exécution du Daily Data Scan pour crontab avec protection contre les exécutions concurrentes.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK_FILE="/tmp/riftvision-scan.lock"

# Ouverture du descripteur de fichier pour le verrou
exec 200>"$LOCK_FILE"

# Tentative d'acquisition du verrou non-bloquant
if ! flock -n 200; then
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [RiftVision Scan] Une analyse est déjà en cours d'exécution. Abandon de cette occurrence."
  exit 0
fi

cd "$PROJECT_DIR" || {
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [RiftVision Scan] Impossible d'accéder au dossier $PROJECT_DIR" >&2
  exit 1
}

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [RiftVision Scan] Démarrage de l'analyse quotidienne..."
npm run scan:data:sentinel -- --report "$@"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [RiftVision Scan] Analyse terminée avec succès."
else
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] [RiftVision Scan] Échec de l'analyse (code de sortie: $EXIT_CODE)." >&2
fi

exit $EXIT_CODE

