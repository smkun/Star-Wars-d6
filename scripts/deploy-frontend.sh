#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="${PROJECT_ROOT}/web"
DEPLOY_DIR="${PROJECT_ROOT}/deploy/frontend"

echo "Working from ${PROJECT_ROOT}"

required_node="20.19.0"
current_node="$(node -v 2>/dev/null | sed 's/^v//')"

if [[ -z "${current_node}" ]]; then
  echo "Error: Node.js is not available in PATH." >&2
  exit 1
fi

version_check=$(node <<'EOF'
const [current, required] = process.argv.slice(1);
const compare = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};
process.exit(compare(current, required) >= 0 ? 0 : 1);
EOF
"${current_node}" "${required_node}" || true)

if [[ "${version_check}" != 0 ]]; then
  echo "Warning: Detected Node.js ${current_node}. Build requires ${required_node} or newer." >&2
  echo "Proceeding anyway…" >&2
fi

echo "Installing dependencies (if needed)…"
npm install --ignore-scripts >/dev/null

echo "Building web workspace…"
npm run build --workspace=web

echo "Updating deploy/frontend contents…"
rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"
cp -R "${WEB_DIR}/dist/"* "${DEPLOY_DIR}/"

echo "Frontend deployment package refreshed at ${DEPLOY_DIR}"
