#!/usr/bin/env bash
# sync-vercel-env.sh
# PUSHES .env.local → Vercel (production + preview + development).
#
# ⚠️  NEVER run "vercel env pull" — it will OVERWRITE .env.local with only
#     what Vercel currently has, destroying any keys not yet pushed.
#
# Usage:
#   1. vercel login          (opens browser — one-time)
#   2. vercel link --yes     (links directory; do NOT accept env pull prompt)
#   3. bash scripts/sync-vercel-env.sh

set -euo pipefail
ENVFILE=".env.local"
ENVIRONMENTS=("production" "preview" "development")

if [ ! -f "$ENVFILE" ]; then
  echo "❌  $ENVFILE not found. Run from the project root."
  exit 1
fi

echo "📦  Syncing env vars from $ENVFILE → Vercel..."
echo

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Skip lines without '='
  [[ "$line" != *=* ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip empty values
  [[ -z "$VALUE" ]] && { echo "⏭️   $KEY  (empty — skipped)"; continue; }

  echo "→  Adding  $KEY"
  for ENV in "${ENVIRONMENTS[@]}"; do
    # Remove existing key first (ignore error if not present), then add
    vercel env rm "$KEY" "$ENV" --yes 2>/dev/null || true
    printf '%s' "$VALUE" | vercel env add "$KEY" "$ENV"
  done

done < "$ENVFILE"

echo
echo "✅  Done. Trigger a redeploy on Vercel dashboard (or run: vercel --prod)."
