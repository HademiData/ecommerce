#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PACKAGE="frontend/web/package.json"
if ! node -e "const p=require('./$PACKAGE'); process.exit(p.scripts?.['test'] ? 0 : 1)"; then
  echo "Frontend 'test' script is not configured in frontend/web/package.json." >&2
  exit 2
fi

pnpm --filter web test
