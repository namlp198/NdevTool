#!/usr/bin/env bash
set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== [1/4] Installing dependencies if needed ==="
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "=== [2/4] Building Vite Frontend & Electron Main Process ==="
npm run build
npm run build:electron

echo "=== [3/4] Packaging Standalone Linux Portable Distribution ==="
node scripts/deploy-package.cjs

echo "=== [4/4] Building Standalone Linux Installers (.run & .deb) ==="
node scripts/build-installer.cjs

echo ""
echo "Deployment Complete!"
echo "  - Self-Extracting Linux Installer : release/NdevTool-Setup-1.0.0-linux-x64.run"
echo "  - Debian/Ubuntu Package (.deb)    : release/ndevtool_1.0.0_amd64.deb"
echo "  - Portable Linux Folder           : release/NdevTool-linux-x64/ndevtool"
