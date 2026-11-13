# NdevTool One-Click Windows Deployment & Setup Installer (.exe) Script
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "=== [1/4] Installing dependencies if needed ===" -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "=== [2/4] Building Vite Frontend & Electron Main Process ===" -ForegroundColor Cyan
npm run build
npm run build:electron

Write-Host "=== [3/4] Packaging Standalone Windows Portable Distribution ===" -ForegroundColor Cyan
node scripts/deploy-package.cjs

Write-Host "=== [4/4] Building Standalone Windows Setup Installer (.exe) ===" -ForegroundColor Cyan
node scripts/build-installer.cjs

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "  - Windows Setup Installer (.exe) : release\NdevTool-Setup-1.0.0.exe" -ForegroundColor Yellow
Write-Host "  - Portable Executable (.exe)     : release\NdevTool-win32-x64\NdevTool.exe" -ForegroundColor Yellow
Write-Host "  - Portable Archive (.zip)        : release\NdevTool-v1.0.0-win32-x64-portable.zip" -ForegroundColor Yellow
