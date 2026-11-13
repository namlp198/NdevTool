/**
 * NdevTool Standalone Deployment Packager
 * Packages compiled frontend (dist/) + Electron main/preload (dist-electron/)
 * with the local Electron binary into a 100% standalone portable distribution:
 *   - release/NdevTool-win32-x64/NdevTool.exe (Windows) or NdevTool (Linux)
 *   - release/NdevTool-v1.0.0-win32-x64-portable.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_ELECTRON_DIR = path.join(ROOT_DIR, 'dist-electron');
const ELECTRON_DIST_SRC = path.join(ROOT_DIR, 'node_modules', 'electron', 'dist');
const RELEASE_ROOT = path.join(ROOT_DIR, 'release');

const platform = process.platform;
const arch = process.arch;
const bundleFolderName = `NdevTool-${platform}-${arch}`;
const TARGET_DIR = path.join(RELEASE_ROOT, bundleFolderName);
const ZIP_PATH = path.join(RELEASE_ROOT, `NdevTool-v1.0.0-${platform}-${arch}-portable.zip`);

function log(msg) {
  console.log(`[NdevTool::Deploy] ${msg}`);
}

function main() {
  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(DIST_ELECTRON_DIR)) {
    throw new Error('Missing dist/ or dist-electron/. Run "npm run build && npm run build:electron" first.');
  }
  if (!fs.existsSync(ELECTRON_DIST_SRC)) {
    throw new Error(`Electron runtime not found at: ${ELECTRON_DIST_SRC}`);
  }

  log(`Preparing release directory: ${TARGET_DIR}`);
  let needsRuntimeCopy = true;
  if (fs.existsSync(TARGET_DIR)) {
    try {
      fs.rmSync(TARGET_DIR, { recursive: true, force: true });
    } catch {
      log('Active NdevTool instance detected in release folder -> Updating resources/app in-place...');
      needsRuntimeCopy = false;
    }
  }
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  if (needsRuntimeCopy) {
    log('Copying standalone Electron runtime...');
    fs.cpSync(ELECTRON_DIST_SRC, TARGET_DIR, { recursive: true });

    // Remove default_app.asar so Electron loads resources/app directly
    const defaultAsar = path.join(TARGET_DIR, 'resources', 'default_app.asar');
    if (fs.existsSync(defaultAsar)) {
      fs.rmSync(defaultAsar, { force: true });
    }

    // Rename electron executable to NdevTool
    if (platform === 'win32') {
      const oldExe = path.join(TARGET_DIR, 'electron.exe');
      const newExe = path.join(TARGET_DIR, 'NdevTool.exe');
      if (fs.existsSync(oldExe)) {
        fs.renameSync(oldExe, newExe);
      }
    } else {
      const oldBin = path.join(TARGET_DIR, 'electron');
      const newBin = path.join(TARGET_DIR, 'ndevtool');
      if (fs.existsSync(oldBin)) {
        fs.renameSync(oldBin, newBin);
        fs.chmodSync(newBin, 0o755);
      }
    }
  }

  // Create resources/app with dist/, dist-electron/, and minimal production package.json
  const appResourceDir = path.join(TARGET_DIR, 'resources', 'app');
  if (fs.existsSync(appResourceDir)) {
    fs.rmSync(appResourceDir, { recursive: true, force: true });
  }
  fs.mkdirSync(appResourceDir, { recursive: true });

  log('Bundling dist/ and dist-electron/ into resources/app...');
  fs.cpSync(DIST_DIR, path.join(appResourceDir, 'dist'), { recursive: true });
  fs.cpSync(DIST_ELECTRON_DIR, path.join(appResourceDir, 'dist-electron'), { recursive: true });

  const prodPkg = {
    name: 'ndev-tool',
    productName: 'NdevTool',
    version: '1.0.0',
    description: 'NdevTool Ring0 Stealth Multi-Engine AI Coding Daemon',
    main: 'dist-electron/main.js',
  };
  fs.writeFileSync(
    path.join(appResourceDir, 'package.json'),
    JSON.stringify(prodPkg, null, 2),
    'utf-8'
  );

  // Create helper launchers inside TARGET_DIR
  if (platform === 'win32') {
    const stealthBat = `@echo off\r\nstart "" "%~dp0NdevTool.exe" --widget\r\n`;
    fs.writeFileSync(
      path.join(TARGET_DIR, 'Start-NdevTool-CornerWidget.bat'),
      stealthBat,
      'utf-8'
    );

    const createShortcutBat = `@echo off\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\NdevTool.lnk'); $s.TargetPath = '%~dp0NdevTool.exe'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'NdevTool Ring0 Trace Daemon'; $s.Save(); Write-Host 'Created Desktop Shortcut: NdevTool.lnk' -ForegroundColor Green"\r\npause\r\n`;
    fs.writeFileSync(
      path.join(TARGET_DIR, 'Create-Desktop-Shortcut.bat'),
      createShortcutBat,
      'utf-8'
    );
  } else {
    const startSh = `#!/usr/bin/env bash\nDIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"\nnohup "$DIR/ndevtool" "$@" >/dev/null 2>&1 &\n`;
    const shPath = path.join(TARGET_DIR, 'start-ndevtool.sh');
    fs.writeFileSync(shPath, startSh, 'utf-8');
    fs.chmodSync(shPath, 0o755);
  }

  // Create portable ZIP archive on Windows (using built-in bsdtar which supports shared read on running binaries and is much faster)
  if (platform === 'win32') {
    log(`Creating portable ZIP archive: ${ZIP_PATH}`);
    if (fs.existsSync(ZIP_PATH)) {
      fs.rmSync(ZIP_PATH, { force: true });
    }
    try {
      execSync(`tar.exe -a -c -f "${ZIP_PATH}" -C "${TARGET_DIR}" .`, {
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn('Warning: tar.exe zip creation failed:', err.message);
    }
  }

  log('========================================================');
  log(`SUCCESS! Standalone build ready at:`);
  log(`  Unpacked Folder : ${TARGET_DIR}`);
  if (platform === 'win32') {
    log(`  Executable      : ${path.join(TARGET_DIR, 'NdevTool.exe')}`);
    if (fs.existsSync(ZIP_PATH)) {
      const sizeMb = (fs.statSync(ZIP_PATH).size / (1024 * 1024)).toFixed(2);
      log(`  Portable ZIP    : ${ZIP_PATH} (${sizeMb} MB)`);
    }
  } else {
    log(`  Executable      : ${path.join(TARGET_DIR, 'ndevtool')}`);
  }
  log('========================================================');
}

main();
