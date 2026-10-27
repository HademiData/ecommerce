#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

./infrastructure/backend/test.sh all
./infrastructure/frontend/build.sh

if node -e "const p=require('./frontend/web/package.json'); process.exit(p.scripts?.test ? 0 : 1)"; then
  ./infrastructure/frontend/test.sh
else
  echo "Skipping frontend tests: no test script is configured."
fi

if node -e "const p=require('./frontend/web/package.json'); process.exit(p.scripts?.lint ? 0 : 1)"; then
  ./infrastructure/frontend/lint.sh
else
  echo "Skipping frontend lint: no lint script is configured."
fi

echo "All configured project checks passed."
