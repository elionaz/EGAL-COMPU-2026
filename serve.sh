#!/usr/bin/env bash
# Levanta el simulador. Usa server.py (sirve estáticos + proxy /api/tutor para el
# tutor con IA). El navegador necesita HTTP para cargar los módulos ES y el JSON.
set -euo pipefail
PUERTO="${1:-8000}"
cd "$(dirname "$0")"
command -v open >/dev/null && (sleep 1; open "http://localhost:${PUERTO}") &
exec python3 server.py "${PUERTO}"
