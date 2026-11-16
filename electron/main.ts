import { app, BrowserWindow, ipcMain, dialog, globalShortcut, screen, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as http from 'http';
import * as crypto from 'crypto';
import { spawn, execSync, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let peekWindow: BrowserWindow | null = null;
let isWidgetMode = false;
let activeChildProcess: ChildProcess | null = null;
let lastLiveBufferPayload: any = {
  realText: '',
  disguisedText: '',
  cursorIndex: 0,
  recentMessages: [],
};

// Data directory inside user's home ~/.ndevtool
const DATA_DIR = path.join(os.homedir(), '.ndevtool');
const REPOS_DIR = path.join(DATA_DIR, 'repos');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const MACHINE_ID = `${os.platform()}-${os.hostname()}`;

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REPOS_DIR)) fs.mkdirSync(REPOS_DIR, { recursive: true });
  if (!fs.existsSync(ATTACHMENTS_DIR)) fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

function hashAdminPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

function getDefaultClaudePath(): string {
  if (process.platform === 'win32') {
    const candidates = [
      path.join(os.homedir(), '.local', 'bin', 'claude.exe'),
      path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'claude.cmd'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'claude';
  }
  const unixCandidates = [
    path.join(os.homedir(), '.local', 'bin', 'claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude',
  ];
  for (const c of unixCandidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'claude';
}

function getDefaultAntigravityPath(): string {
  if (process.platform === 'win32') {
    const candidates = [
      path.join(os.homedir(), 'AppData', 'Local', 'agy', 'bin', 'agy.exe'),
      path.join(os.homedir(), '.gemini', 'antigravity', 'bin', 'agentapi.bat'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity', 'resources', 'bin', 'language_server.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'agy';
  }
  const linuxCandidates = [
    path.join(os.homedir(), '.gemini', 'antigravity', 'bin', 'agentapi'),
    path.join(os.homedir(), '.local', 'bin', 'agy'),
    '/usr/local/bin/agy',
  ];
  for (const c of linuxCandidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'agy';
}

function getDefaultCodexPath(): string {
  if (process.platform === 'win32') {
    const candidates = [
      path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'codex.cmd'),
      path.join(os.homedir(), '.local', 'bin', 'codex.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'codex';
  }
  const linuxCandidates = [
    path.join(os.homedir(), '.local', 'bin', 'codex'),
    '/usr/local/bin/codex',
  ];
  for (const c of linuxCandidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'codex';
}

function getDefaultSyncFolder(): string {
  if (process.platform === 'win32') {
    const driveLetters = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'D', 'E', 'C'];
    const gDriveCandidates: string[] = [];
    for (const letter of driveLetters) {
      gDriveCandidates.push(`${letter}:\\My Drive\\NdevTool_Sync`);
      gDriveCandidates.push(`${letter}:\\Bộ nhớ của tôi\\NdevTool_Sync`);
      // Google Drive Desktop virtual drive root marker
      if (fs.existsSync(`${letter}:\\.shortcut-targets-by-id`)) {
        gDriveCandidates.push(`${letter}:\\NdevTool_Sync`);
      }
    }
    gDriveCandidates.push(
      path.join(os.homedir(), 'Google Drive', 'My Drive', 'NdevTool_Sync'),
      path.join(os.homedir(), 'Google Drive', 'NdevTool_Sync'),
      path.join(os.homedir(), 'My Drive', 'NdevTool_Sync')
    );
    for (const candidate of gDriveCandidates) {
      const parent = path.dirname(candidate);
      if (parent.length > 3 && fs.existsSync(parent)) return candidate;
    }
  } else {
    const linuxCandidates = [
      path.join(os.homedir(), 'gdrive', 'NdevTool_Sync'),
      path.join(os.homedir(), 'GoogleDrive', 'NdevTool_Sync'),
      path.join(os.homedir(), 'Google Drive', 'NdevTool_Sync'),
      '/mnt/gdrive/NdevTool_Sync',
    ];
    for (const candidate of linuxCandidates) {
      const parent = path.dirname(candidate);
      if (fs.existsSync(parent)) return candidate;
    }
  }
  // Return empty string when no real Google Drive mount exists on disk (never fake with a local mirror!)
  return '';
}

const DEFAULT_HOTKEYS = {
  holdPeekKey: 'Alt',
  toggleAppVisibility: 'CommandOrControl+Shift+A',
  toggleWidgetMode: 'CommandOrControl+Shift+W',
  quitApp: 'CommandOrControl+Shift+Q',
  toggleWatchBuf: 'CommandOrControl+Shift+P',
  toggleHandoff: 'CommandOrControl+Shift+H',
  triggerSync: 'CommandOrControl+Shift+S',
};

function loadSettings() {
  ensureDirs();
  const defaultSalt = 'ndevtool-superadmin-salt-v1';
  const defaults = {
    language: 'vi',
    stealthMode: 'kernel-log',
    cipherEnabled: true,
    cipherLanguage: 'rust-kernel',
    autoStartOs: false,
    alwaysOnTop: true,
    peekWindowOpen: false,
    hotkeys: { ...DEFAULT_HOTKEYS },
    adminAuth: {
      username: 'admin',
      salt: defaultSalt,
      passwordHash: hashAdminPassword('admin', defaultSalt),
      isDefaultPassword: true,
    },
    sync: {
      mode: 'both',
      localSyncFolderPath: getDefaultSyncFolder(),
      gdriveAuthMethod: 'token',
      gdriveClientId: '',
      gdriveClientSecret: '',
      gdriveAccessToken: '',
      gdriveRefreshToken: '',
      gdriveTokenExpiry: 0,
      gdriveServiceAccountJson: '',
      gdriveFolderName: 'NdevTool_Sync',
      gdriveFolderId: '',
      gdriveFolderWebUrl: '',
      gdriveConnectedEmail: '',
      autoSync: true,
      encryptionPassphrase: '',
    },
    engine: {
      activeEngine: 'claude-code',
      claudeCliPath: getDefaultClaudePath(),
      claudeModel: 'claude-sonnet-5-5',
      antigravityCliPath: getDefaultAntigravityPath(),
      antigravityModel: 'Gemini 4 Argon',
      effortLevel: 'medium',
      skipPermissions: true,
      continuityStrategy: 'smart-handoff',
      recentTurnsCount: 6,
      codexCliPath: getDefaultCodexPath(),
      codexModel: 'o3-mini',
      deepseekModel: 'deepseek-chat',
      autoApproveRead: true,
      autoApproveEdit: true,
    },
  };

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      const mergedEngine = { ...defaults.engine, ...(saved.engine || {}) };
      // Migrate legacy short alias 'pro'/'flash'/'flash_lite' to real AGY model family names
      if (['pro', 'flash', 'flash_lite'].includes(mergedEngine.antigravityModel)) {
        mergedEngine.antigravityModel =
          mergedEngine.antigravityModel === 'pro' ? 'Gemini 4 Argon' : 'Gemini 3.8 Flash';
      }
      // Migrate legacy Claude models
      if (['sonnet', 'claude-sonnet-4-6'].includes(mergedEngine.claudeModel)) {
        mergedEngine.claudeModel = 'claude-sonnet-5-5';
      } else if (['opus', 'claude-opus-4-6'].includes(mergedEngine.claudeModel)) {
        mergedEngine.claudeModel = 'claude-opus-5-5';
      } else if (['haiku', 'claude-haiku-4-5'].includes(mergedEngine.claudeModel)) {
        mergedEngine.claudeModel = 'claude-haiku-5-5';
      }
      const mergedSync = { ...defaults.sync, ...(saved.sync || {}) };
      // Migrate away from the old fake local cloud_sync_mirror folder so we only sync to real Google Drive
      if (
        mergedSync.localSyncFolderPath &&
        mergedSync.localSyncFolderPath.includes('cloud_sync_mirror')
      ) {
        mergedSync.localSyncFolderPath = getDefaultSyncFolder();
      }
      if (!mergedSync.gdriveFolderName) {
        mergedSync.gdriveFolderName = 'NdevTool_Sync';
      }
      const mergedAdminAuth = {
        ...defaults.adminAuth,
        ...(saved.adminAuth || {}),
      };
      if (!mergedAdminAuth.passwordHash) {
        mergedAdminAuth.salt = defaultSalt;
        mergedAdminAuth.passwordHash = hashAdminPassword('admin', defaultSalt);
        mergedAdminAuth.isDefaultPassword = true;
      }
      const mergedHotkeys = {
        ...DEFAULT_HOTKEYS,
        ...(saved.hotkeys || {}),
      };
      return {
        ...defaults,
        ...saved,
        hotkeys: mergedHotkeys,
        adminAuth: mergedAdminAuth,
        sync: mergedSync,
        engine: mergedEngine,
      };
    } catch {
      // fallback
    }
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2), 'utf-8');
  return defaults;
}

function saveSettings(settings: any) {
  ensureDirs();
  // Always preserve existing passwordHash & salt on disk if renderer sends partial adminAuth
  let existingAdminAuth: any = null;
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const disk = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      existingAdminAuth = disk.adminAuth;
    } catch {
      // ignore
    }
  }
  const mergedToSave = {
    ...settings,
    hotkeys: {
      ...DEFAULT_HOTKEYS,
      ...(settings.hotkeys || {}),
    },
    adminAuth: {
      ...(existingAdminAuth || {}),
      ...(settings.adminAuth || {}),
      passwordHash:
        settings.adminAuth?.passwordHash || existingAdminAuth?.passwordHash,
      salt: settings.adminAuth?.salt || existingAdminAuth?.salt,
    },
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mergedToSave, null, 2), 'utf-8');
  applyAutoStart(Boolean(mergedToSave.autoStartOs));
  registerConfiguredShortcuts(mergedToSave);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(Boolean(mergedToSave.alwaysOnTop));
    mainWindow.webContents.send('settings-updated', mergedToSave);
  }
  if (mergedToSave?.language) {
    lastLiveBufferPayload = {
      ...lastLiveBufferPayload,
      language: mergedToSave.language,
    };
  }
  if (peekWindow && !peekWindow.isDestroyed()) {
    peekWindow.webContents.send('settings-updated', mergedToSave);
    peekWindow.webContents.send('live-buffer-updated', lastLiveBufferPayload);
  }
}

function applyAutoStart(enable: boolean) {
  try {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: enable,
        args: ['--widget'],
      });
    } else if (process.platform === 'linux') {
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      const desktopFile = path.join(autostartDir, 'ndevtool.desktop');
      if (enable) {
        if (!fs.existsSync(autostartDir)) fs.mkdirSync(autostartDir, { recursive: true });
        const content = `[Desktop Entry]
Type=Application
Name=NdevTool Daemon
Comment=System Diagnostic & Trace Utility
Exec="${process.execPath}" --widget
Terminal=false
StartupNotify=false
`;
        fs.writeFileSync(desktopFile, content, 'utf-8');
      } else if (fs.existsSync(desktopFile)) {
        fs.unlinkSync(desktopFile);
      }
    }
  } catch (err) {
    console.error('Failed to configure auto-start:', err);
  }
}

function detectRepoMetadata(folderPath: string) {
  const name = path.basename(folderPath);
  let gitRemote = '';
  let branch = 'main';
  try {
    gitRemote = execSync('git config --get remote.origin.url', {
      cwd: folderPath,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    gitRemote = '';
  }

  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: folderPath,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    branch = 'main';
  }

  const normalizedIdentity = gitRemote
    ? gitRemote
        .replace(/^git@([^:]+):/, '$1/')
        .replace(/^https?:\/\//, '')
        .replace(/\.git$/, '')
        .toLowerCase()
    : `repo:${name.toLowerCase()}`;

  const id = crypto.createHash('sha256').update(normalizedIdentity).digest('hex').slice(0, 16);
  return { id, name, localPath: folderPath, gitRemote, branch };
}

function getRepoFilePath(repoId: string) {
  return path.join(REPOS_DIR, `${repoId}.json`);
}

function deriveSessionTitle(messages: any[], fallbackIndex = 1): string {
  const firstUser = (messages || []).find((m: any) => m.role === 'user' && m.realContent?.trim());
  if (firstUser) {
    const clean = String(firstUser.realContent).trim().replace(/\s+/g, ' ');
    return clean.length > 38 ? `${clean.slice(0, 38)}...` : clean;
  }
  return `Session #${fallbackIndex}`;
}

function ensureRepoSessions(repo: any): any {
  if (!repo) return repo;
  if (!Array.isArray(repo.sessions) || repo.sessions.length === 0) {
    const initialMessages = Array.isArray(repo.messages) ? repo.messages : [];
    const defaultSes = {
      id: `ses-${repo.id}-1`,
      title: deriveSessionTitle(initialMessages, 1),
      createdAt: repo.lastUpdated || new Date().toISOString(),
      updatedAt: repo.lastUpdated || new Date().toISOString(),
      messages: initialMessages,
      handoff: repo.handoff,
      sessionByMachine: { ...(repo.sessionByMachine || {}) },
      agySessionByMachine: { ...(repo.agySessionByMachine || {}) },
      lastActiveMachineId: repo.lastActiveMachineId || MACHINE_ID,
    };
    repo.sessions = [defaultSes];
    repo.activeSessionId = defaultSes.id;
  }

  let activeSes = repo.sessions.find((s: any) => s.id === repo.activeSessionId);
  if (!activeSes) {
    activeSes = repo.sessions[0];
    repo.activeSessionId = activeSes.id;
  }

  // Mirror active session state onto repo top-level fields
  repo.messages = Array.isArray(activeSes.messages) ? activeSes.messages : [];
  repo.handoff = activeSes.handoff || repo.handoff;
  repo.sessionByMachine = { ...(activeSes.sessionByMachine || {}) };
  repo.agySessionByMachine = { ...(activeSes.agySessionByMachine || {}) };
  return repo;
}

function syncActiveSessionFromTopLevel(repo: any) {
  if (!repo) return;
  if (!Array.isArray(repo.sessions) || repo.sessions.length === 0) {
    ensureRepoSessions(repo);
  }
  const idx = repo.sessions.findIndex((s: any) => s.id === repo.activeSessionId);
  const targetIdx = idx >= 0 ? idx : 0;
  const currentSes = repo.sessions[targetIdx];
  const updatedMessages = Array.isArray(repo.messages) ? repo.messages : currentSes.messages || [];

  // Auto-update generic session title once the user sends their first prompt in this session
  let nextTitle = currentSes.title || `Session #${targetIdx + 1}`;
  if (/^(Session|Phiên)\s*#\d+$/i.test(nextTitle.trim())) {
    const derived = deriveSessionTitle(updatedMessages, targetIdx + 1);
    if (!/^(Session|Phiên)\s*#\d+$/i.test(derived)) {
      nextTitle = derived;
    }
  }

  repo.sessions[targetIdx] = {
    ...currentSes,
    title: nextTitle,
    updatedAt: new Date().toISOString(),
    messages: updatedMessages,
    handoff: repo.handoff || currentSes.handoff,
    sessionByMachine: { ...(repo.sessionByMachine || {}) },
    agySessionByMachine: { ...(repo.agySessionByMachine || {}) },
    lastActiveMachineId: repo.lastActiveMachineId || MACHINE_ID,
  };
  repo.activeSessionId = repo.sessions[targetIdx].id;
}

function switchRepoActiveSession(repo: any, sessionId: string) {
  ensureRepoSessions(repo);
  const target = repo.sessions.find((s: any) => s.id === sessionId);
  if (!target) return;
  repo.activeSessionId = target.id;
  repo.messages = Array.isArray(target.messages) ? target.messages : [];
  repo.handoff = target.handoff || synthesizeHandoffSummary({ messages: repo.messages, handoff: repo.handoff });
  repo.sessionByMachine = { ...(target.sessionByMachine || {}) };
  repo.agySessionByMachine = { ...(target.agySessionByMachine || {}) };
  repo.lastActiveMachineId = target.lastActiveMachineId || repo.lastActiveMachineId || MACHINE_ID;
}

function readHandoffFromRepoDisk(repoLocalPath: string): any | null {
  try {
    if (!repoLocalPath || !fs.existsSync(repoLocalPath)) return null;
    const handoffFile = path.join(repoLocalPath, 'handoff', 'latest.md');
    if (!fs.existsSync(handoffFile)) return null;

    const raw = fs.readFileSync(handoffFile, 'utf-8');
    const stat = fs.statSync(handoffFile);

    const dateMatch = raw.match(/##\s*Date[^\n]*\n+([^\n#]+)/i);
    const dateStr = dateMatch ? dateMatch[1].trim() : '';

    const machineMatch = raw.match(/-\s*Machine:\s*`?([^`\r\n]+)`?/i);
    const machineStr = machineMatch ? machineMatch[1].trim() : '';
    const branchMatch = raw.match(/-\s*Branch:\s*`?([^`\r\n]+)`?/i);
    const branchStr = branchMatch ? branchMatch[1].trim() : '';
    const updatedMatch = raw.match(/-\s*Updated:\s*`?([^`\r\n]+)`?/i);
    const updatedStr = updatedMatch ? updatedMatch[1].trim() : stat.mtime.toISOString();

    const goalMatch = raw.match(/##\s*Current Goal[^\n]*\n+([\s\S]*?)(?=\n##|$)/i);
    let goal = goalMatch ? goalMatch[1].trim() : '';

    const progressMatch = raw.match(
      /##\s*(?:Latest change|Recent progress|Latest change\s*\/\s*Recent progress)[^\n]*\n+([\s\S]*?)(?=\n##|$)/i
    );
    let progress = progressMatch ? progressMatch[1].trim() : '';

    const filesMatch = raw.match(/##\s*Touched Files[^\n]*\n+([\s\S]*?)(?=\n##|$)/i);
    const touchedFiles: string[] = [];
    if (filesMatch) {
      const lines = filesMatch[1].split('\n');
      for (const line of lines) {
        const itemMatch = line.match(/^[\s*-]+`?([^`\r\n]+)`?/);
        if (itemMatch && itemMatch[1].trim()) {
          touchedFiles.push(itemMatch[1].trim());
        }
      }
    }

    const nextMatch = raw.match(/##\s*Next[^\n]*\n+([\s\S]*?)(?=\n##|$)/i);
    let nextSteps = nextMatch ? nextMatch[1].trim() : '';

    if (!goal && !progress) {
      const firstSection = raw.split(/^##\s+/m)[1] || raw;
      progress = firstSection.slice(0, 500).trim();
      goal = 'Synchronized from handoff/latest.md';
    }

    return {
      currentGoal: goal || 'Continue project work',
      recentProgress: progress || 'Context initialized from latest.md.',
      touchedFiles: touchedFiles.slice(0, 20),
      nextSteps: nextSteps || 'Continue from tasks/active.md.',
      updatedAt: updatedStr || stat.mtime.toISOString(),
      sourceMachineId: machineStr || MACHINE_ID,
      branch: branchStr || 'main',
      rawMarkdown: raw,
    };
  } catch (err) {
    console.error('Error reading handoff from repo disk:', err);
    return null;
  }
}

function writeHandoffToRepoDisk(repoLocalPath: string, handoff: any, branch = 'main'): boolean {
  try {
    if (!repoLocalPath || !fs.existsSync(repoLocalPath)) return false;
    const handoffDir = path.join(repoLocalPath, 'handoff');
    if (!fs.existsSync(handoffDir)) {
      fs.mkdirSync(handoffDir, { recursive: true });
    }
    const targetFile = path.join(handoffDir, 'latest.md');
    const updatedAt = handoff.updatedAt || new Date().toISOString();
    const dateStr = updatedAt.slice(0, 10);
    const machineId = handoff.sourceMachineId || MACHINE_ID;

    const touchedMd =
      Array.isArray(handoff.touchedFiles) && handoff.touchedFiles.length > 0
        ? `\n## Touched Files\n\n${handoff.touchedFiles.map((f: string) => `- \`${f}\``).join('\n')}\n`
        : '';

    const content = [
      '# Latest Handoff',
      '',
      '## Date',
      '',
      dateStr,
      '',
      '## Machine / branch',
      '',
      `- Machine: \`${machineId}\``,
      `- Branch: \`${branch || 'main'}\``,
      `- Updated: ${updatedAt}`,
      '',
      '## Current Goal',
      '',
      (handoff.currentGoal || '').trim() || 'N/A',
      '',
      '## Latest change / Recent progress',
      '',
      (handoff.recentProgress || '').trim() || 'Context initialized.',
      touchedMd,
      '## Next',
      '',
      (handoff.nextSteps || '').trim() || 'Continue from active tasks in tasks/active.md.',
      '',
    ].join('\n');

    // Skip no-op writes so an unchanged handoff never touches the working tree
    if (fs.existsSync(targetFile) && fs.readFileSync(targetFile, 'utf-8') === content) {
      return true;
    }
    fs.writeFileSync(targetFile, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing handoff to repo disk:', err);
    return false;
  }
}

function checkStandardStructure(folderPath: string) {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return {
        isStandard: false,
        hasHandoff: false,
        hasDecisions: false,
        hasDocs: false,
        hasTasks: false,
        hasOutputs: false,
        hasAgentsMd: false,
        hasClaudeMd: false,
        missing: ['folder_not_found'],
      };
    }

    const hasHandoff = fs.existsSync(path.join(folderPath, 'handoff', 'latest.md'));
    const hasDecisions = fs.existsSync(path.join(folderPath, 'decisions', '0000_INDEX.md'));
    const hasDocs =
      fs.existsSync(path.join(folderPath, 'docs', '00_CONTEXT.md')) ||
      fs.existsSync(path.join(folderPath, 'docs', 'README_AI_WORKFLOW.md')) ||
      fs.existsSync(path.join(folderPath, 'docs', '00_AI_WORKSPACE_STANDARD.md'));
    const hasTasks = fs.existsSync(path.join(folderPath, 'tasks', 'active.md'));
    const hasOutputs = fs.existsSync(path.join(folderPath, 'outputs'));
    const hasAgentsMd = fs.existsSync(path.join(folderPath, 'AGENTS.md'));
    const hasClaudeMd = fs.existsSync(path.join(folderPath, 'CLAUDE.md'));

    const missing: string[] = [];
    if (!hasHandoff) missing.push('handoff/latest.md');
    if (!hasDecisions) missing.push('decisions/');
    if (!hasDocs) missing.push('docs/');
    if (!hasTasks) missing.push('tasks/');
    if (!hasOutputs) missing.push('outputs/');
    if (!hasAgentsMd && !hasClaudeMd) missing.push('AGENTS.md / CLAUDE.md');

    const isStandard =
      hasHandoff && hasDecisions && hasDocs && hasTasks && (hasAgentsMd || hasClaudeMd);

    return {
      isStandard,
      hasHandoff,
      hasDecisions,
      hasDocs,
      hasTasks,
      hasOutputs,
      hasAgentsMd,
      hasClaudeMd,
      missing,
    };
  } catch (err) {
    console.error('Error checking standard structure:', err);
    return {
      isStandard: false,
      hasHandoff: false,
      hasDecisions: false,
      hasDocs: false,
      hasTasks: false,
      hasOutputs: false,
      hasAgentsMd: false,
      hasClaudeMd: false,
      missing: ['error_checking'],
    };
  }
}

function scaffoldStandardStructure(folderPath: string, repoName: string, branch = 'main') {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    const createdFiles: string[] = [];
    const ensureFile = (relPath: string, content: string) => {
      const fullPath = path.join(folderPath, relPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        createdFiles.push(relPath);
      }
    };

    // 1. handoff/latest.md
    ensureFile(
      'handoff/latest.md',
      [
        '# Latest Handoff',
        '',
        '## Date',
        '',
        new Date().toISOString().slice(0, 10),
        '',
        '## Machine / branch',
        '',
        `- Machine: \`${MACHINE_ID}\``,
        `- Branch: \`${branch || 'main'}\``,
        `- Updated: ${new Date().toISOString()}`,
        '',
        '## Current Goal',
        '',
        `Initial repository setup for ${repoName}.`,
        '',
        '## Latest change / Recent progress',
        '',
        `Standard AI Workspace structure scaffolded by NdevTool.`,
        '',
        '## Touched Files',
        '',
        '- `handoff/latest.md`',
        '- `AGENTS.md`',
        '- `CLAUDE.md`',
        '',
        '## Not done / not verified / Open risks',
        '',
        '- Pending first coding turn.',
        '',
        '## Next',
        '',
        'Review tasks in `tasks/active.md` and start implementation.',
        '',
      ].join('\n')
    );

    // 2. decisions/
    ensureFile(
      'decisions/0000_INDEX.md',
      [
        '# Decision Index',
        '',
        '| ID | Title | Status | Date |',
        '|---|---|---|---|',
        `| 0001 | Initial Architecture for ${repoName} | Accepted | ${new Date().toISOString().slice(0, 10)} |`,
        '',
      ].join('\n')
    );
    ensureFile(
      'decisions/0001_initial_architecture.md',
      [
        `# 0001. Initial Architecture for ${repoName}`,
        '',
        '- **Trạng thái:** Accepted',
        `- **Ngày quyết định:** ${new Date().toISOString().slice(0, 10)}`,
        '- **Người đề xuất:** Maintainer & NdevTool AI',
        '',
        '---',
        '',
        '## 1. Bối cảnh (Context)',
        `Khởi tạo cấu trúc dự án ${repoName} theo chuẩn AI Workspace Standard.`,
        '',
        '## 2. Quyết định (Decision)',
        'Áp dụng kiến trúc quản lý tác vụ dạng file và bàn giao liên tục qua `handoff/latest.md`.',
        '',
        '## 3. Hệ quả (Consequences)',
        'Mọi AI coding agent phải tuân thủ thứ tự đọc và cập nhật tài liệu trước khi kết thúc phiên.',
        '',
      ].join('\n')
    );

    // 3. docs/
    ensureFile(
      'docs/00_CONTEXT.md',
      [
        `# 00_CONTEXT.md: ${repoName} Context & Architecture`,
        '',
        `## 1. Repository Identity`,
        `- **Tên:** ${repoName}`,
        `- **Nhánh mặc định:** ${branch || 'main'}`,
        `- **Ngày tạo:** ${new Date().toISOString().slice(0, 10)}`,
        '',
        '## 2. Mục tiêu hệ thống',
        'Mô tả các mục tiêu kỹ thuật cốt lõi và các module liên kết.',
        '',
        '## 3. Sibling Repos & Interfaces',
        'Liệt kê các kho lưu trữ phụ thuộc hoặc giao tiếp qua API / bus.',
        '',
      ].join('\n')
    );
    ensureFile(
      'docs/README_AI_WORKFLOW.md',
      [
        `# README_AI_WORKFLOW: ${repoName}`,
        '',
        '## 1. Read before changing code',
        '1. `README.md`',
        '2. `docs/README_AI_WORKFLOW.md`',
        '3. `docs/00_CONTEXT.md`',
        '4. `tasks/active.md`',
        '5. `handoff/latest.md`',
        '6. `decisions/0000_INDEX.md`',
        '',
        '## 2. Workflow',
        '- Giữ thay đổi nhỏ, tập trung và có thể review được.',
        '- Cập nhật `tasks/active.md` khi thay đổi phạm vi công việc.',
        '- Bắt buộc cập nhật `handoff/latest.md` trước khi kết thúc phiên.',
        '- Mọi thay đổi kiến trúc phải ghi nhận vào `decisions/`.',
        '',
      ].join('\n')
    );

    // 4. tasks/
    ensureFile(
      'tasks/active.md',
      [
        '# Active Tasks',
        '',
        `## Task #001: Khởi động phát triển ${repoName}`,
        '',
        '- **Trạng thái:** In Progress',
        `- **Bắt đầu:** ${new Date().toISOString().slice(0, 10)}`,
        '- **Mục tiêu:** Thiết lập môi trường và cấu trúc cơ bản.',
        '',
        '### Tiêu chí nghiệm thu (Acceptance Criteria):',
        '- [x] Khởi tạo khung thư mục chuẩn AI Workspace.',
        '- [ ] Bổ sung mã nguồn khởi tạo.',
        '- [ ] Chạy build kiểm tra 0 lỗi.',
        '',
      ].join('\n')
    );
    ensureFile('tasks/backlog.md', '# Backlog Tasks\n\n- [ ] Lập kế hoạch các module tiếp theo.\n');
    ensureFile('tasks/blocked.md', '# Blocked Tasks\n\n*Không có tác vụ bị nghẽn.*\n');
    ensureFile('tasks/bugs.md', '# Confirmed Bugs\n\n*Chưa có bug được ghi nhận.*\n');
    ensureFile(
      'tasks/done.md',
      `# Completed Tasks\n\n## ${new Date().toISOString().slice(0, 10)}\n- [x] Khởi tạo cấu trúc AI Workspace Standard.\n`
    );

    // 5. outputs/
    const outDirs = ['claude_drafts', 'code_reviews', 'debug_reports', 'temporary'];
    for (const sub of outDirs) {
      ensureFile(`outputs/${sub}/.gitkeep`, '');
    }

    // 6. AGENTS.md & CLAUDE.md
    ensureFile(
      'AGENTS.md',
      [
        '# AGENTS.md',
        '',
        '## Role',
        `You are an autonomous AI coding agent (Antigravity / Codex) working inside ${repoName}.`,
        '',
        '## Mandatory reading order',
        '1. `README.md`',
        '2. `docs/README_AI_WORKFLOW.md`',
        '3. `docs/00_CONTEXT.md`',
        '4. `tasks/active.md`',
        '5. `handoff/latest.md`',
        '6. `decisions/0000_INDEX.md`',
        '',
        '## Rules',
        '- Do not alter architecture without updating `decisions/`.',
        '- Output intermediate documents to `outputs/` subdirectories.',
        '- Always update `handoff/latest.md` before concluding.',
        '',
      ].join('\n')
    );
    ensureFile(
      'CLAUDE.md',
      [
        '# CLAUDE.md',
        '',
        '## Role',
        `You are Claude Code working as a senior coding assistant inside ${repoName}.`,
        '',
        '## Mandatory reading order',
        '1. `README.md`',
        '2. `docs/README_AI_WORKFLOW.md`',
        '3. `docs/00_CONTEXT.md`',
        '4. `tasks/active.md`',
        '5. `handoff/latest.md`',
        '6. `decisions/0000_INDEX.md`',
        '',
        '## Rules',
        '- Keep changes focused and minimal.',
        '- Always update `handoff/latest.md` before ending a session.',
        '',
        '## Output locations',
        '- Draft documents: `outputs/claude_drafts/`',
        '- Code reviews: `outputs/code_reviews/`',
        '- Debug reports: `outputs/debug_reports/`',
        '- Temporary files: `outputs/temporary/`',
        '',
      ].join('\n')
    );

    // 7. README.md if missing
    ensureFile(
      'README.md',
      `# ${repoName}\n\nProject initialized with AI Workspace Standard.\n`
    );

    return {
      success: true,
      createdFiles,
      status: checkStandardStructure(folderPath),
    };
  } catch (err: any) {
    console.error('Error scaffolding standard structure:', err);
    return {
      success: false,
      error: err.message || String(err),
      createdFiles: [],
      status: checkStandardStructure(folderPath),
    };
  }
}

function loadAllRepos(): any[] {
  ensureDirs();
  const files = fs.readdirSync(REPOS_DIR).filter((f) => f.endsWith('.json'));
  const repos: any[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(REPOS_DIR, file), 'utf-8'));
      // Resolve localPath for current machine if stored in localPathsByMachine
      if (data.localPathsByMachine?.[MACHINE_ID]) {
        data.localPath = data.localPathsByMachine[MACHINE_ID];
      }
      ensureRepoSessions(data);

      // Auto 2-way sync with handoff/latest.md if localPath exists
      if (data.localPath && fs.existsSync(data.localPath)) {
        const diskHandoff = readHandoffFromRepoDisk(data.localPath);
        if (diskHandoff) {
          const diskTime = diskHandoff.updatedAt || '';
          const curTime = data.handoff?.updatedAt || '';
          if (!data.handoff || diskTime > curTime) {
            data.handoff = {
              currentGoal: diskHandoff.currentGoal,
              recentProgress: diskHandoff.recentProgress,
              touchedFiles: diskHandoff.touchedFiles,
              nextSteps: diskHandoff.nextSteps,
              updatedAt: diskHandoff.updatedAt,
              sourceMachineId: diskHandoff.sourceMachineId,
            };
          }
        }
      }

      repos.push(data);
    } catch {
      // ignore corrupted
    }
  }
  return repos.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
}

function saveRepo(repo: any, syncFromTopLevel = true) {
  ensureDirs();
  if (syncFromTopLevel) {
    syncActiveSessionFromTopLevel(repo);
  } else {
    ensureRepoSessions(repo);
  }
  repo.lastUpdated = new Date().toISOString();
  repo.localPathsByMachine = {
    ...(repo.localPathsByMachine || {}),
    [MACHINE_ID]: repo.localPath,
  };
  fs.writeFileSync(getRepoFilePath(repo.id), JSON.stringify(repo, null, 2), 'utf-8');
  // NOTE: handoff/latest.md is intentionally NOT written here. Writing it after every turn
  // dirties the user's git working tree right after they commit. It is only written on explicit
  // request (write-repo-handoff-disk IPC), and only when the content actually changed.
}

function encryptPayload(plainJson: string, passphrase?: string): string {
  if (!passphrase) return plainJson;
  const key = crypto.scryptSync(passphrase, 'ndevtool-salt-v1', 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainJson, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    __encrypted: true,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('base64'),
  });
}

function decryptPayload(rawContent: string, passphrase?: string): any {
  const parsed = JSON.parse(rawContent);
  if (!parsed.__encrypted) return parsed;
  if (!passphrase) throw new Error('Encrypted sync file requires passphrase');
  const key = crypto.scryptSync(passphrase, 'ndevtool-salt-v1', 32);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(parsed.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(parsed.data, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString('utf-8'));
}

// Merge remote and local repo histories WITHOUT ever overwriting machine-specific paths or sessions
function mergeRepoData(localRepo: any, remoteRepo: any) {
  ensureRepoSessions(localRepo);
  ensureRepoSessions(remoteRepo);

  const sessionMap = new Map<string, any>();
  for (const s of localRepo?.sessions || []) {
    sessionMap.set(s.id, s);
  }
  for (const rs of remoteRepo?.sessions || []) {
    const ls = sessionMap.get(rs.id);
    if (!ls) {
      sessionMap.set(rs.id, rs);
    } else {
      const mMap = new Map<string, any>();
      for (const m of ls.messages || []) mMap.set(m.id, m);
      for (const m of rs.messages || []) mMap.set(m.id, m);
      const mergedSesMsgs = Array.from(mMap.values()).sort((a, b) =>
        (a.timestamp || '').localeCompare(b.timestamp || '')
      );
      sessionMap.set(rs.id, {
        ...ls,
        ...rs,
        title: (rs.updatedAt || '') > (ls.updatedAt || '') ? rs.title || ls.title : ls.title || rs.title,
        updatedAt: (rs.updatedAt || '') > (ls.updatedAt || '') ? rs.updatedAt : ls.updatedAt,
        messages: mergedSesMsgs,
        handoff:
          (rs.handoff?.updatedAt || '') > (ls.handoff?.updatedAt || '')
            ? rs.handoff
            : ls.handoff || rs.handoff,
        sessionByMachine: {
          ...(rs.sessionByMachine || {}),
          ...(ls.sessionByMachine || {}),
        },
        agySessionByMachine: {
          ...(rs.agySessionByMachine || {}),
          ...(ls.agySessionByMachine || {}),
        },
      });
    }
  }
  const mergedSessions = Array.from(sessionMap.values());

  const msgMap = new Map<string, any>();
  for (const m of localRepo?.messages || []) msgMap.set(m.id, m);
  for (const m of remoteRepo?.messages || []) msgMap.set(m.id, m);
  const mergedMessages = Array.from(msgMap.values()).sort((a, b) =>
    (a.timestamp || '').localeCompare(b.timestamp || '')
  );

  const isRemoteNewer = (remoteRepo?.lastUpdated || '') > (localRepo?.lastUpdated || '');
  const newer = isRemoteNewer ? remoteRepo : localRepo;

  const mergedLocalPaths = {
    ...(remoteRepo?.localPathsByMachine || {}),
    ...(localRepo?.localPathsByMachine || {}),
  };

  // Each machine keeps its own Claude CLI and Antigravity session ID so Windows <-> Linux never collide!
  const mergedSessionByMachine = {
    ...(remoteRepo?.sessionByMachine || {}),
    ...(localRepo?.sessionByMachine || {}),
  };
  const mergedAgySessionByMachine = {
    ...(remoteRepo?.agySessionByMachine || {}),
    ...(localRepo?.agySessionByMachine || {}),
  };

  const mergedRepo = {
    ...newer,
    localPath:
      mergedLocalPaths[MACHINE_ID] || localRepo?.localPath || remoteRepo?.localPath || '',
    localPathsByMachine: mergedLocalPaths,
    sessions: mergedSessions,
    activeSessionId:
      localRepo?.activeSessionId || remoteRepo?.activeSessionId || mergedSessions[0]?.id,
    sessionByMachine: mergedSessionByMachine,
    agySessionByMachine: mergedAgySessionByMachine,
    lastActiveMachineId: newer?.lastActiveMachineId || remoteRepo?.lastActiveMachineId || MACHINE_ID,
    handoff:
      (remoteRepo?.handoff?.updatedAt || '') > (localRepo?.handoff?.updatedAt || '')
        ? remoteRepo.handoff
        : localRepo?.handoff || remoteRepo?.handoff,
    contextSummary: newer?.contextSummary || localRepo?.contextSummary || '',
    messages: mergedMessages,
    lastUpdated: new Date().toISOString(),
  };
  return ensureRepoSessions(mergedRepo);
}

// Automatically synthesize a clean Handoff Summary from the master conversation & tool history
function synthesizeHandoffSummary(repo: any): any {
  const msgs: any[] = repo.messages || [];
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const assistantMsgs = msgs.filter((m) => m.role === 'assistant');

  const latestUserPrompt =
    userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].realContent : 'Initial repository setup';
  const latestAssistantReply =
    assistantMsgs.length > 0 ? assistantMsgs[assistantMsgs.length - 1].realContent : '';

  // Collect modified/read files from recent tool activities
  const fileSet = new Set<string>();
  for (const m of msgs.slice(-12)) {
    for (const t of m.toolActivities || []) {
      if (t.target && !t.target.includes(' ')) {
        fileSet.add(t.target);
      }
    }
  }

  const firstParagraph = latestAssistantReply
    .split('\n\n')
    .map((s: string) => s.trim())
    .find((s: string) => s.length > 15) || latestAssistantReply.slice(0, 240);

  const summary = {
    currentGoal: latestUserPrompt.slice(0, 220),
    recentProgress: firstParagraph ? firstParagraph.slice(0, 320) : 'Context initialized.',
    touchedFiles: Array.from(fileSet).slice(-10),
    nextSteps:
      repo.handoff?.nextSteps ||
      'Continue from the latest user instruction and verify changes on the current machine.',
    updatedAt: new Date().toISOString(),
    sourceMachineId: MACHINE_ID,
  };

  // Pure: never write to the repo working tree here (callers run after every turn)
  return summary;
}

// Build the Handoff System Prompt injected into a fresh Claude Code session on a new machine
function buildHandoffPromptPayload(repo: any, recentTurnsCount = 6): string {
  const handoff = repo.handoff || synthesizeHandoffSummary(repo);
  const recentMessages = (repo.messages || [])
    .filter((m: any) => m.role === 'user' || m.role === 'assistant')
    .slice(-Math.max(2, recentTurnsCount));

  const recentTranscript = recentMessages
    .map(
      (m: any) =>
        `[${m.role.toUpperCase()} @ ${m.machineId || 'peer'}]: ${m.realContent.slice(0, 600)}`
    )
    .join('\n---\n');

  return [
    '=== NDEVTOOL CROSS-MACHINE HANDOFF SUMMARY ===',
    `Repository: ${repo.name} (Branch: ${repo.branch || 'main'})`,
    `Current Machine Node: ${MACHINE_ID} (Local CWD: ${repo.localPath})`,
    `Previous Active Node: ${handoff.sourceMachineId || repo.lastActiveMachineId || 'peer'}`,
    '',
    `[1. CURRENT GOAL]: ${handoff.currentGoal}`,
    `[2. RECENT PROGRESS]: ${handoff.recentProgress}`,
    handoff.touchedFiles?.length
      ? `[3. TOUCHED FILES]: ${handoff.touchedFiles.join(', ')}`
      : '',
    `[4. NEXT STEPS / NOTES]: ${handoff.nextSteps}`,
    '',
    `=== RECENT CONVERSATION TURNS (LAST ${recentMessages.length} MESSAGES) ===`,
    recentTranscript || '(No prior turns)',
    '==============================================',
    'IMPORTANT: You are starting a fresh, clean session on this machine using the handoff summary above. Use paths relative to the current working directory.',
  ]
    .filter(Boolean)
    .join('\n');
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function extractDriveFolderId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  const urlFolderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlFolderMatch) return urlFolderMatch[1];
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryIdMatch) return queryIdMatch[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) return trimmed;
  return '';
}

function buildHandoffOverviewMarkdown(repos: any[]): string {
  const lines: string[] = [
    '# NdevTool Cross-Machine Handoff Overview',
    `Last Synced: ${new Date().toISOString()} (Source Node: ${MACHINE_ID})`,
    '',
  ];
  for (const r of repos) {
    const h = r.handoff || synthesizeHandoffSummary(r);
    lines.push(`## Repository: ${r.name} (Branch: ${r.branch || 'main'})`);
    lines.push(`- **Repo ID**: \`${r.id}\``);
    lines.push(`- **Last Active Machine**: \`${r.lastActiveMachineId || MACHINE_ID}\``);
    lines.push(`- **Total Messages**: ${(r.messages || []).length}`);
    lines.push(`- **Current Goal**: ${h.currentGoal}`);
    lines.push(`- **Recent Progress**: ${h.recentProgress}`);
    if (h.touchedFiles?.length) {
      lines.push(`- **Touched Files**: ${h.touchedFiles.join(', ')}`);
    }
    lines.push(`- **Next Steps**: ${h.nextSteps}`);
    lines.push('');
  }
  return lines.join('\n');
}

// Obtain a valid Google Drive OAuth2 / Service Account Bearer token (auto-refreshing when needed)
async function getValidGoogleDriveToken(
  syncCfg: any,
  lang = 'vi'
): Promise<{
  token: string;
  email?: string;
  updatedSyncPatch?: Record<string, any>;
}> {
  const isEn = lang === 'en';
  const authMethod = syncCfg.gdriveAuthMethod || 'token';

  // 1. Service Account JSON authentication (never expires)
  if (
    authMethod === 'service-account' ||
    (!syncCfg.gdriveAccessToken &&
      !syncCfg.gdriveRefreshToken &&
      syncCfg.gdriveServiceAccountJson)
  ) {
    const rawSa = (syncCfg.gdriveServiceAccountJson || '').trim();
    if (!rawSa) {
      throw new Error(
        isEn
          ? 'Service Account JSON content or file path is empty.'
          : 'Chưa nhập nội dung hoặc file Service Account JSON.'
      );
    }
    let saObj: any;
    try {
      if (rawSa.startsWith('{')) {
        saObj = JSON.parse(rawSa);
      } else if (fs.existsSync(rawSa)) {
        saObj = JSON.parse(fs.readFileSync(rawSa, 'utf-8'));
      } else {
        throw new Error(
          isEn
            ? 'Service Account JSON file not found.'
            : 'Không tìm thấy file Service Account JSON.'
        );
      }
    } catch (e: any) {
      throw new Error(
        isEn
          ? `Invalid Service Account JSON: ${e.message}`
          : `Service Account JSON không hợp lệ: ${e.message}`
      );
    }

    if (!saObj.client_email || !saObj.private_key) {
      throw new Error(
        isEn
          ? 'Service Account JSON is missing client_email or private_key.'
          : 'Service Account JSON thiếu client_email hoặc private_key.'
      );
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const header = base64UrlEncode(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const payload = base64UrlEncode(
      Buffer.from(
        JSON.stringify({
          iss: saObj.client_email,
          scope: 'https://www.googleapis.com/auth/drive',
          aud: saObj.token_uri || 'https://oauth2.googleapis.com/token',
          exp: nowSec + 3600,
          iat: nowSec,
        })
      )
    );
    const signingInput = `${header}.${payload}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = base64UrlEncode(signer.sign(saObj.private_key));
    const jwt = `${signingInput}.${signature}`;

    const tokenRes = await fetch(saObj.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    const tokenData: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(
        isEn
          ? `Service Account authentication failed: ${
              tokenData.error_description || tokenData.error || tokenRes.statusText
            }`
          : `Lỗi xác thực Service Account: ${
              tokenData.error_description || tokenData.error || tokenRes.statusText
            }`
      );
    }
    return {
      token: tokenData.access_token,
      email: saObj.client_email,
      updatedSyncPatch: { gdriveConnectedEmail: saObj.client_email },
    };
  }

  // 2. OAuth2 Refresh Token flow (auto-refreshes expired access tokens)
  const hasRefreshToken = Boolean(syncCfg.gdriveRefreshToken?.trim());
  const isTokenExpired =
    !syncCfg.gdriveAccessToken?.trim() ||
    (syncCfg.gdriveTokenExpiry && Date.now() > Number(syncCfg.gdriveTokenExpiry) - 60_000);

  if (hasRefreshToken && isTokenExpired && syncCfg.gdriveClientId?.trim()) {
    const params: Record<string, string> = {
      client_id: syncCfg.gdriveClientId.trim(),
      refresh_token: syncCfg.gdriveRefreshToken.trim(),
      grant_type: 'refresh_token',
    };
    if (syncCfg.gdriveClientSecret?.trim()) {
      params.client_secret = syncCfg.gdriveClientSecret.trim();
    }
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });
    const refreshData: any = await refreshRes.json();
    if (refreshRes.ok && refreshData.access_token) {
      const expiry = Date.now() + (Number(refreshData.expires_in) || 3600) * 1000;
      return {
        token: refreshData.access_token,
        updatedSyncPatch: {
          gdriveAccessToken: refreshData.access_token,
          gdriveTokenExpiry: expiry,
        },
      };
    } else if (!syncCfg.gdriveAccessToken?.trim()) {
      throw new Error(
        isEn
          ? `Failed to refresh OAuth2 Token: ${
              refreshData.error_description || refreshData.error || refreshRes.statusText
            }`
          : `Không thể làm mới OAuth2 Token: ${
              refreshData.error_description || refreshData.error || refreshRes.statusText
            }`
      );
    }
  }

  // 3. Direct OAuth2 Access Token
  const rawToken = (syncCfg.gdriveAccessToken || '').trim();
  if (!rawToken) {
    throw new Error(
      isEn
        ? 'Google Drive Access Token / OAuth2 / Service Account is not configured yet.'
        : 'Chưa cấu hình Google Drive Access Token / OAuth2 / Service Account.'
    );
  }
  return { token: rawToken };
}

// Resolve an existing folder on Google Drive (by Folder Link/ID or Folder Name), or create a real folder on Google Drive
async function resolveOrCreateDriveFolder(
  token: string,
  folderNameInput?: string,
  folderIdOrUrlInput?: string,
  lang = 'vi'
): Promise<{ id: string; name: string; webViewLink: string }> {
  const isEn = lang === 'en';
  const targetFolderName = (folderNameInput || 'NdevTool_Sync').trim() || 'NdevTool_Sync';
  const explicitFolderId = extractDriveFolderId(folderIdOrUrlInput);

  // If user specified an explicit Folder Link or Folder ID on Google Drive, verify it first
  if (explicitFolderId) {
    const checkUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      explicitFolderId
    )}?fields=id,name,mimeType,webViewLink,trashed&supportsAllDrives=true`;
    const checkRes = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (checkRes.ok) {
      const folderMeta: any = await checkRes.json();
      if (!folderMeta.trashed) {
        return {
          id: folderMeta.id,
          name: folderMeta.name || targetFolderName,
          webViewLink:
            folderMeta.webViewLink || `https://drive.google.com/drive/folders/${folderMeta.id}`,
        };
      }
    } else if (checkRes.status === 401) {
      throw new Error(
        isEn
          ? 'Google Drive Access Token has expired or is invalid (HTTP 401).'
          : 'Google Drive Access Token đã hết hạn hoặc không hợp lệ (HTTP 401).'
      );
    } else if (checkRes.status === 403 || checkRes.status === 404) {
      throw new Error(
        isEn
          ? `Cannot access Folder ID "${explicitFolderId}" on Google Drive (HTTP ${checkRes.status}). If using a Service Account, please Share that folder with the Service Account email as Editor.`
          : `Không truy cập được Folder ID "${explicitFolderId}" trên Google Drive (HTTP ${checkRes.status}). Nếu dùng Service Account, hãy Share thư mục đó cho email Service Account với quyền Editor.`
      );
    }
  }

  // Search for folder by name on Google Drive
  const escapedName = targetFolderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,webViewLink)&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!searchRes.ok) {
    if (searchRes.status === 401) {
      throw new Error(
        isEn
          ? 'Google Drive Access Token has expired or is invalid (HTTP 401).'
          : 'Google Drive Access Token đã hết hạn hoặc không hợp lệ (HTTP 401).'
      );
    }
    const errText = await searchRes.text();
    throw new Error(
      isEn
        ? `Google Drive folder query failed (HTTP ${searchRes.status}): ${errText.slice(0, 180)}`
        : `Lỗi truy vấn thư mục Google Drive (HTTP ${searchRes.status}): ${errText.slice(0, 180)}`
    );
  }

  const searchData: any = await searchRes.json();
  const existingFolder = searchData.files?.[0];
  if (existingFolder?.id) {
    return {
      id: existingFolder.id,
      name: existingFolder.name || targetFolderName,
      webViewLink:
        existingFolder.webViewLink || `https://drive.google.com/drive/folders/${existingFolder.id}`,
    };
  }

  // Folder does not exist yet -> Create the real folder on Google Drive root
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: targetFolderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(
      isEn
        ? `Could not create folder "${targetFolderName}" on Google Drive: ${errText.slice(0, 180)}`
        : `Không thể tạo thư mục "${targetFolderName}" trên Google Drive: ${errText.slice(0, 180)}`
    );
  }

  const createdFolder: any = await createRes.json();
  return {
    id: createdFolder.id,
    name: createdFolder.name || targetFolderName,
    webViewLink:
      createdFolder.webViewLink || `https://drive.google.com/drive/folders/${createdFolder.id}`,
  };
}

// Perform full two-way sync (Pull + Merge + Push + Overview MD) inside the real Google Drive folder
async function syncReposWithGoogleDriveApi(
  syncCfg: any,
  lang = 'vi'
): Promise<{
  syncedCount: number;
  folderId: string;
  folderName: string;
  folderWebUrl: string;
  email?: string;
  updatedSyncPatch: Record<string, any>;
}> {
  const isEn = lang === 'en';
  const auth = await getValidGoogleDriveToken(syncCfg, lang);
  const token = auth.token;

  // Fetch user email if not known yet
  let connectedEmail = auth.email || syncCfg.gdriveConnectedEmail || '';
  if (!connectedEmail) {
    try {
      const aboutRes = await fetch(
        'https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (aboutRes.ok) {
        const aboutData: any = await aboutRes.json();
        connectedEmail = aboutData.user?.emailAddress || '';
      }
    } catch {
      // ignore
    }
  }

  // 1. Resolve or create the target folder on Google Drive
  const folder = await resolveOrCreateDriveFolder(
    token,
    syncCfg.gdriveFolderName || 'NdevTool_Sync',
    syncCfg.gdriveFolderId,
    lang
  );

  // 2. List all files currently inside that Google Drive folder
  const listQ = `'${folder.id}' in parents and trashed = false`;
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    listQ
  )}&fields=files(id,name,modifiedTime)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(
      isEn
        ? `Could not list files in Google Drive folder: ${errText.slice(0, 180)}`
        : `Không thể đọc danh sách file trong thư mục Google Drive: ${errText.slice(0, 180)}`
    );
  }

  const listData: any = await listRes.json();
  const remoteFiles: Array<{ id: string; name: string; modifiedTime?: string }> =
    listData.files || [];

  const localRepos = loadAllRepos();
  const localMap = new Map<string, any>(localRepos.map((r) => [r.id, r]));
  let syncedCount = 0;

  // 3. Pull & merge all remote .ndev.json files from the Google Drive folder
  const remoteRepoFiles = remoteFiles.filter(
    (f) => f.name.endsWith('.ndev.json') || (f.name.startsWith('ndev_') && f.name.endsWith('.json'))
  );
  for (const rf of remoteRepoFiles) {
    try {
      const dlRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          rf.id
        )}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (dlRes.ok) {
        const remoteText = await dlRes.text();
        const remoteRepo = decryptPayload(remoteText, syncCfg.encryptionPassphrase);
        if (remoteRepo && remoteRepo.id) {
          const existing = localMap.get(remoteRepo.id);
          const merged = existing ? mergeRepoData(existing, remoteRepo) : remoteRepo;
          saveRepo(merged);
          localMap.set(merged.id, merged);
        }
      }
    } catch (err) {
      console.warn('Google Drive pull warning for file', rf.name, err);
    }
  }

  // 4. Push all merged repos into the real Google Drive folder
  for (const repo of localMap.values()) {
    const safeName = (repo.name || 'repo').replace(/[^a-zA-Z0-9_-]/g, '_');
    const preferredFileName = `${safeName}_${repo.id}.ndev.json`;

    const existingRemote = remoteRepoFiles.find(
      (f) =>
        f.name === preferredFileName ||
        f.name === `${repo.id}.ndev.json` ||
        f.name.endsWith(`_${repo.id}.ndev.json`) ||
        f.name === `ndev_${repo.id}.json`
    );

    const payload = encryptPayload(JSON.stringify(repo, null, 2), syncCfg.encryptionPassphrase);

    if (existingRemote) {
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
          existingRemote.id
        )}?uploadType=media&supportsAllDrives=true`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: payload,
        }
      );
      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(
          isEn
            ? `Failed to update ${preferredFileName} on Google Drive: ${errText.slice(0, 160)}`
            : `Lỗi cập nhật file ${preferredFileName} lên Google Drive: ${errText.slice(0, 160)}`
        );
      }
    } else {
      // Create file metadata inside folder.id on Google Drive
      const createMetaRes = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id,name&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: preferredFileName,
            mimeType: 'application/json',
            parents: [folder.id],
          }),
        }
      );
      if (!createMetaRes.ok) {
        const errText = await createMetaRes.text();
        throw new Error(
          isEn
            ? `Failed to create ${preferredFileName} in Google Drive folder: ${errText.slice(
                0,
                160
              )}`
            : `Lỗi tạo file ${preferredFileName} trong thư mục Google Drive: ${errText.slice(
                0,
                160
              )}`
        );
      }
      const createdFile: any = await createMetaRes.json();
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
          createdFile.id
        )}?uploadType=media&supportsAllDrives=true`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: payload,
        }
      );
    }
    syncedCount++;
  }

  // 5. Also upload/update HANDOFF_OVERVIEW.md inside the Google Drive folder for easy reading on web/mobile
  try {
    const overviewMd = buildHandoffOverviewMarkdown(Array.from(localMap.values()));
    const existingOverview = remoteFiles.find((f) => f.name === 'HANDOFF_OVERVIEW.md');
    if (existingOverview) {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
          existingOverview.id
        )}?uploadType=media&supportsAllDrives=true`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/markdown; charset=utf-8',
          },
          body: overviewMd,
        }
      );
    } else {
      const createOvRes = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'HANDOFF_OVERVIEW.md',
            mimeType: 'text/markdown',
            parents: [folder.id],
          }),
        }
      );
      if (createOvRes.ok) {
        const createdOv: any = await createOvRes.json();
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
            createdOv.id
          )}?uploadType=media&supportsAllDrives=true`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'text/markdown; charset=utf-8',
            },
            body: overviewMd,
          }
        );
      }
    }
  } catch (ovErr) {
    console.warn('Could not update HANDOFF_OVERVIEW.md on Google Drive:', ovErr);
  }

  return {
    syncedCount,
    folderId: folder.id,
    folderName: folder.name,
    folderWebUrl: folder.webViewLink,
    email: connectedEmail,
    updatedSyncPatch: {
      ...(auth.updatedSyncPatch || {}),
      gdriveFolderId: folder.id,
      gdriveFolderName: folder.name,
      gdriveFolderWebUrl: folder.webViewLink,
      ...(connectedEmail ? { gdriveConnectedEmail: connectedEmail } : {}),
    },
  };
}

async function performCloudSync(): Promise<{
  status: 'ok' | 'unconfigured' | 'error';
  syncedCount: number;
  lastSyncedAt: string;
  targetDescription?: string;
  folderWebUrl?: string;
  error?: string;
}> {
  const settings = loadSettings();
  const lang = settings.language || 'vi';
  const isEn = lang === 'en';
  const syncCfg = settings.sync || {};
  let syncedCount = 0;
  const targetsUsed: string[] = [];
  let lastError = '';
  let resolvedWebUrl = syncCfg.gdriveFolderWebUrl || '';

  const localFolderConfigured =
    (syncCfg.mode === 'folder' || syncCfg.mode === 'git-repo' || syncCfg.mode === 'both') &&
    Boolean(syncCfg.localSyncFolderPath?.trim()) &&
    !syncCfg.localSyncFolderPath.includes('cloud_sync_mirror');

  const gdriveApiConfigured =
    (syncCfg.mode === 'gdrive-api' || syncCfg.mode === 'both') &&
    Boolean(
      syncCfg.gdriveAccessToken?.trim() ||
        syncCfg.gdriveRefreshToken?.trim() ||
        syncCfg.gdriveServiceAccountJson?.trim()
    );

  if (!localFolderConfigured && !gdriveApiConfigured) {
    return {
      status: 'unconfigured',
      syncedCount: 0,
      lastSyncedAt: syncCfg.lastSyncedAt || '',
      error: isEn
        ? 'Google Drive is not configured! Please open Settings (Section 2) to connect Google Drive API or select a real Google Drive folder.'
        : 'Chưa cấu hình Google Drive! Vui lòng mở Settings (Cấu hình) -> mục 2 để kết nối Google Drive API hoặc chọn thư mục Google Drive thật.',
    };
  }

  // 1. Real Mounted Folder Sync (Google Drive Desktop / Rclone mount / Private Git Memory Repo)
  if (localFolderConfigured) {
    try {
      const syncDir = syncCfg.localSyncFolderPath.trim();
      if (!fs.existsSync(syncDir)) {
        fs.mkdirSync(syncDir, { recursive: true });
      }

      if (syncCfg.mode === 'git-repo' && fs.existsSync(path.join(syncDir, '.git'))) {
        try {
          execSync('git pull --rebase --autostash', { cwd: syncDir, stdio: 'ignore' });
        } catch {
          // ignore pull warnings if offline
        }
      }

      const localRepos = loadAllRepos();
      const localMap = new Map(localRepos.map((r) => [r.id, r]));

      // Pull remote files from mounted sync folder
      const remoteFiles = fs.readdirSync(syncDir).filter((f) => f.endsWith('.ndev.json'));
      for (const file of remoteFiles) {
        try {
          const raw = fs.readFileSync(path.join(syncDir, file), 'utf-8');
          const remoteRepo = decryptPayload(raw, syncCfg.encryptionPassphrase);
          if (remoteRepo && remoteRepo.id) {
            const existing = localMap.get(remoteRepo.id);
            const merged = existing ? mergeRepoData(existing, remoteRepo) : remoteRepo;
            saveRepo(merged);
            localMap.set(merged.id, merged);
          }
        } catch (err) {
          console.warn('Sync pull warning for', file, err);
        }
      }

      // Push merged repos back to mounted sync folder
      for (const repo of localMap.values()) {
        const safeName = (repo.name || 'repo').replace(/[^a-zA-Z0-9_-]/g, '_');
        const payload = encryptPayload(JSON.stringify(repo, null, 2), syncCfg.encryptionPassphrase);
        fs.writeFileSync(path.join(syncDir, `${safeName}_${repo.id}.ndev.json`), payload, 'utf-8');
        // Clean up legacy unnamed file if both exist
        const legacyPath = path.join(syncDir, `${repo.id}.ndev.json`);
        if (
          fs.existsSync(legacyPath) &&
          `${safeName}_${repo.id}.ndev.json` !== `${repo.id}.ndev.json`
        ) {
          try {
            fs.unlinkSync(legacyPath);
          } catch {
            // ignore
          }
        }
        syncedCount++;
      }

      // Write human-readable overview inside the mounted Google Drive folder
      fs.writeFileSync(
        path.join(syncDir, 'HANDOFF_OVERVIEW.md'),
        buildHandoffOverviewMarkdown(Array.from(localMap.values())),
        'utf-8'
      );

      if (syncCfg.mode === 'git-repo' && fs.existsSync(path.join(syncDir, '.git'))) {
        try {
          execSync(
            'git add *.ndev.json HANDOFF_OVERVIEW.md && git commit -m "sync: ndevtool handoff update" && git push',
            {
              cwd: syncDir,
              stdio: 'ignore',
            }
          );
        } catch {
          // ignore if nothing to commit
        }
      }
      targetsUsed.push(syncDir);
    } catch (err: any) {
      lastError = err.message || String(err);
      console.error('Folder sync error:', err);
    }
  }

  // 2. Direct Google Drive REST API v3 into a Real Google Drive Folder
  if (gdriveApiConfigured) {
    try {
      const apiRes = await syncReposWithGoogleDriveApi(syncCfg, lang);
      syncedCount = Math.max(syncedCount, apiRes.syncedCount);
      resolvedWebUrl = apiRes.folderWebUrl;
      Object.assign(syncCfg, apiRes.updatedSyncPatch);
      targetsUsed.push(`Google Drive/${apiRes.folderName}`);
    } catch (err: any) {
      lastError = err.message || String(err);
      console.error('Google Drive REST API sync error:', err);
    }
  }

  if (targetsUsed.length === 0 && lastError) {
    return {
      status: 'error',
      syncedCount: 0,
      lastSyncedAt: syncCfg.lastSyncedAt || '',
      error: lastError,
    };
  }

  const lastSyncedAt = new Date().toISOString();
  settings.sync = { ...syncCfg, lastSyncedAt };
  saveSettings(settings);
  return {
    status: 'ok',
    syncedCount,
    lastSyncedAt,
    targetDescription: targetsUsed.join(' + '),
    folderWebUrl: resolvedWebUrl,
  };
}

function getPreferredMainWindowBounds(screenW: number, screenH: number) {
  const width = Math.min(1360, Math.max(1140, screenW - 60));
  const height = Math.min(860, Math.max(740, screenH - 50));
  const x = Math.max(10, Math.round((screenW - width) / 2));
  const y = Math.max(10, Math.round((screenH - height) / 2));
  return { width, height, x, y };
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;
  const settings = loadSettings();

  const startInWidget = process.argv.includes('--widget');
  isWidgetMode = startInWidget;

  const preferred = getPreferredMainWindowBounds(screenW, screenH);

  mainWindow = new BrowserWindow({
    width: startInWidget ? 68 : preferred.width,
    height: startInWidget ? 68 : preferred.height,
    minWidth: startInWidget ? 68 : 1120,
    minHeight: startInWidget ? 68 : 700,
    x: startInWidget ? screenW - 88 : preferred.x,
    y: startInWidget ? screenH - 88 : preferred.y,
    frame: false,
    transparent: true,
    alwaysOnTop: Boolean(settings.alwaysOnTop),
    resizable: !startInWidget,
    skipTaskbar: startInWidget,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', false);
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function togglePeekWindow(forceState?: boolean) {
  const shouldOpen =
    forceState !== undefined ? forceState : !peekWindow || peekWindow.isDestroyed();
  if (!shouldOpen) {
    if (peekWindow && !peekWindow.isDestroyed()) {
      peekWindow.close();
      peekWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('peek-window-state', false);
    }
    return false;
  }

  if (peekWindow && !peekWindow.isDestroyed()) {
    peekWindow.show();
    peekWindow.focus();
    peekWindow.webContents.focus();
    peekWindow.webContents.send('peek-focus-input');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('peek-window-state', true);
    }
    return true;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const peekW = Math.min(680, Math.max(540, screenW - 80));
  const peekH = Math.min(440, Math.max(330, screenH - 80));

  peekWindow = new BrowserWindow({
    width: peekW,
    height: peekH,
    minWidth: 520,
    minHeight: 320,
    x: Math.max(20, screenW - peekW - 24),
    y: Math.max(20, screenH - peekH - 28),
    frame: false,
    transparent: true,
    opacity: 0.45,
    alwaysOnTop: true,
    resizable: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    peekWindow.loadURL(`${devUrl}#peek`);
  } else {
    peekWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'peek' });
  }

  peekWindow.webContents.on('did-finish-load', () => {
    if (peekWindow && !peekWindow.isDestroyed()) {
      const currentSettings = loadSettings();
      peekWindow.show();
      peekWindow.focus();
      peekWindow.webContents.focus();
      peekWindow.webContents.send('settings-updated', currentSettings);
      peekWindow.webContents.send('live-buffer-updated', {
        ...lastLiveBufferPayload,
        language: currentSettings.language || 'vi',
      });
      peekWindow.webContents.send('peek-focus-input');
    }
  });

  peekWindow.on('closed', () => {
    peekWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('peek-window-state', false);
    }
  });

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('peek-window-state', true);
  }
  return true;
}

function setWidgetMode(widgetMode: boolean) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  isWidgetMode = widgetMode;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  if (widgetMode) {
    mainWindow.setMinimumSize(68, 68);
    mainWindow.setResizable(false);
    mainWindow.setBounds({
      width: 68,
      height: 68,
      x: screenW - 84,
      y: screenH - 84,
    });
    mainWindow.setSkipTaskbar(true);
    mainWindow.setAlwaysOnTop(true);
  } else {
    const preferred = getPreferredMainWindowBounds(screenW, screenH);
    mainWindow.setSkipTaskbar(false);
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(1120, 700);
    mainWindow.setBounds(preferred);
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
  }
  mainWindow.webContents.send('widget-mode-changed', widgetMode);
}

function safeRegisterShortcut(accelerator: string | undefined, callback: () => void) {
  const cleaned = (accelerator || '').trim();
  if (!cleaned) return;
  try {
    globalShortcut.register(cleaned, callback);
  } catch (err) {
    console.warn(`Failed to register global shortcut "${cleaned}":`, err);
  }
}

function registerConfiguredShortcuts(settingsInput?: any) {
  if (!app.isReady()) return;
  try {
    globalShortcut.unregisterAll();
  } catch {
    // ignore
  }
  const currentSettings = settingsInput || loadSettings();
  const hk = {
    ...DEFAULT_HOTKEYS,
    ...(currentSettings?.hotkeys || {}),
  };

  // 1. Stealth Hide / Show Entire App
  safeRegisterShortcut(hk.toggleAppVisibility, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
      if (peekWindow && !peekWindow.isDestroyed() && peekWindow.isVisible()) {
        peekWindow.hide();
      }
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setSkipTaskbar(Boolean(isWidgetMode));
      if (peekWindow && !peekWindow.isDestroyed()) {
        peekWindow.showInactive();
      }
    }
  });

  // 2. Toggle Corner Widget Mode / Full Window
  safeRegisterShortcut(hk.toggleWidgetMode, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    setWidgetMode(!isWidgetMode);
  });

  // 3. Panic Quit / Exit Application Immediately
  safeRegisterShortcut(hk.quitApp, () => {
    try {
      if (activeChildProcess && !activeChildProcess.killed) {
        activeChildProcess.kill('SIGTERM');
      }
    } catch {
      // ignore
    }
    app.exit(0);
  });

  // 4. Quick Toggle WATCH_BUF directly (Bypasses Super Admin Login)
  safeRegisterShortcut(hk.toggleWatchBuf, () => {
    togglePeekWindow();
  });

  // 5. Quick Toggle HANDOFF Modal directly (Bypasses Super Admin Login)
  safeRegisterShortcut(hk.toggleHandoff, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    if (isWidgetMode) {
      setWidgetMode(false);
    }
    mainWindow.focus();
    mainWindow.webContents.send('hotkey-action', 'toggle-handoff');
  });

  // 6. Quick Trigger Cloud SYNC directly (Bypasses Super Admin Login)
  safeRegisterShortcut(hk.triggerSync, () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('hotkey-action', 'trigger-sync');
  });
}

// Ensure single-instance lock so launching the app again restores the window
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (isWidgetMode) {
        setWidgetMode(false);
      }
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.setSkipTaskbar(false);
      mainWindow.focus();
    }
  });
}

app.on('activate', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isWidgetMode) {
      setWidgetMode(false);
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  ensureDirs();
  const existing = loadAllRepos();
  if (existing.length === 0) {
    const defaultRepoMeta = detectRepoMetadata(process.cwd());
    const initRepo = {
      ...defaultRepoMeta,
      sessionByMachine: {},
      lastActiveMachineId: MACHINE_ID,
      contextSummary: 'Initialized NdevTool Stealth Multi-Engine Workspace with Cross-Machine Handoff.',
      handoff: {
        currentGoal: 'Setup Stealth Hacker AI Coding Environment & Cross-Machine Handoff',
        recentProgress: 'Configured Camouflage Cipher Input, Claude Code Stream Adapter, and Handoff Summary Engine.',
        touchedFiles: ['electron/main.ts', 'src/App.tsx'],
        nextSteps: 'Type any prompt below to dispatch to Claude Code with automatic Handoff tracking.',
        updatedAt: new Date().toISOString(),
        sourceMachineId: MACHINE_ID,
      },
      messages: [
        {
          id: 'welcome-sys-1',
          role: 'system',
          realContent:
            'Chào mừng đến với NdevTool! Cơ chế "Cross-Machine Handoff Summary" đã bật: Mỗi máy giữ session riêng không xung đột đường dẫn Windows/Linux. Khi đổi máy (hoặc bấm Reset & Handoff), tool tự tạo session mới kèm Bản tóm tắt bàn giao (Handoff Summary) + các lượt chat gần nhất.',
          disguisedHeader: '[KERN_BOOT 0x7FF8A000 @ 00:00:01] :: init_stealth_handoff_subsystem(RING0_READY)',
          disguisedCodeBlock:
            'pub unsafe fn init_ring0_stealth_channel(ctx: *mut KernelContext) -> Status {\n    (*ctx).flags |= STEALTH_CIPHER_ACTIVE | HANDOFF_CONTINUITY_V2;\n    Ok(Status::Ready)\n}',
          engine: 'claude-code',
          timestamp: new Date().toISOString(),
          machineId: MACHINE_ID,
        },
      ],
    };
    saveRepo(initRepo);
  }

  createMainWindow();
  registerConfiguredShortcuts(loadSettings());
});

ipcMain.handle('get-initial-state', () => {
  const settings = loadSettings();
  return {
    settings,
    repos: loadAllRepos(),
    machineId: MACHINE_ID,
    isWidgetMode,
    liveBuffer: {
      ...lastLiveBufferPayload,
      language: settings.language || 'vi',
    },
  };
});

ipcMain.handle('set-widget-mode', (_event, mode: boolean) => {
  setWidgetMode(mode);
  return mode;
});

ipcMain.handle('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
  return true;
});

ipcMain.handle('window-toggle-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
  return true;
});

ipcMain.handle('window-is-maximized', () => {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isMaximized());
});

ipcMain.handle('toggle-peek-window', (_event, forceState?: boolean) => {
  return togglePeekWindow(forceState);
});

ipcMain.handle('set-peek-opacity', (_event, opacity: number) => {
  const clamped = Math.max(0.15, Math.min(1.0, Number(opacity) || 0.55));
  if (peekWindow && !peekWindow.isDestroyed()) {
    peekWindow.setOpacity(clamped);
  }
  return clamped;
});

ipcMain.on('peek-input-updated', (_event, realText: string) => {
  lastLiveBufferPayload = {
    ...lastLiveBufferPayload,
    realText: String(realText ?? ''),
    cursorIndex: String(realText ?? '').length,
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('peek-input-updated', String(realText ?? ''));
  }
});

ipcMain.on('peek-trigger-send', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('peek-trigger-send');
  }
});

ipcMain.on(
  'sync-live-buffer',
  (
    _event,
    payload: {
      realText: string;
      disguisedText: string;
      cursorIndex: number;
      language?: string;
      cipherLanguage?: string;
      recentMessages?: any[];
    }
  ) => {
    lastLiveBufferPayload = {
      ...lastLiveBufferPayload,
      ...payload,
    };
    if (peekWindow && !peekWindow.isDestroyed()) {
      peekWindow.webContents.send('live-buffer-updated', lastLiveBufferPayload);
    }
  }
);

ipcMain.handle('save-settings', (_event, newSettings: any) => {
  saveSettings(newSettings);
  return loadSettings();
});

// Verify Super Admin login (Strict single Super Admin account)
ipcMain.handle(
  'verify-admin-login',
  (_event, payload: { username?: string; password?: string }) => {
    const settings = loadSettings();
    const adminAuth = settings.adminAuth || {
      username: 'admin',
      salt: 'ndevtool-superadmin-salt-v1',
      passwordHash: hashAdminPassword('admin', 'ndevtool-superadmin-salt-v1'),
      isDefaultPassword: true,
    };

    const inputUser = (payload?.username || '').trim();
    const inputPass = payload?.password || '';
    if (!inputUser || !inputPass) {
      return { ok: false };
    }

    const userMatches =
      inputUser.toLowerCase() === (adminAuth.username || 'admin').trim().toLowerCase();
    const computedHash = hashAdminPassword(
      inputPass,
      adminAuth.salt || 'ndevtool-superadmin-salt-v1'
    );
    const passMatches =
      computedHash === adminAuth.passwordHash ||
      (adminAuth.isDefaultPassword && inputPass === 'admin');

    if (userMatches && passMatches) {
      return {
        ok: true,
        username: adminAuth.username,
        isDefaultPassword: Boolean(adminAuth.isDefaultPassword),
      };
    }
    return { ok: false };
  }
);

// Update the single Super Admin's username & password
ipcMain.handle(
  'update-admin-credentials',
  (
    _event,
    payload: {
      currentPassword?: string;
      newUsername?: string;
      newPassword?: string;
      lang?: string;
    }
  ) => {
    const settings = loadSettings();
    const isEn = (payload?.lang || settings.language) === 'en';
    const adminAuth = settings.adminAuth || {
      username: 'admin',
      salt: 'ndevtool-superadmin-salt-v1',
      passwordHash: hashAdminPassword('admin', 'ndevtool-superadmin-salt-v1'),
      isDefaultPassword: true,
    };

    const currentPass = payload?.currentPassword || '';
    const newUsername = (payload?.newUsername || adminAuth.username || 'admin').trim();
    const newPass = payload?.newPassword || '';

    if (!currentPass || !newPass) {
      return {
        ok: false,
        error: isEn
          ? 'Please enter both current password and new password.'
          : 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
      };
    }

    const currentHash = hashAdminPassword(
      currentPass,
      adminAuth.salt || 'ndevtool-superadmin-salt-v1'
    );
    const validCurrent =
      currentHash === adminAuth.passwordHash ||
      (adminAuth.isDefaultPassword && currentPass === 'admin');

    if (!validCurrent) {
      return {
        ok: false,
        error: isEn
          ? 'Current Super Admin password is incorrect!'
          : 'Mật khẩu Super Admin hiện tại không đúng!',
      };
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashAdminPassword(newPass, newSalt);
    settings.adminAuth = {
      username: newUsername || 'admin',
      salt: newSalt,
      passwordHash: newHash,
      isDefaultPassword: false,
    };
    saveSettings(settings);
    return {
      ok: true,
      settings: loadSettings(),
    };
  }
);

function getMimeTypeFromExt(ext: string): string {
  const lower = ext.toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.js': 'text/javascript',
    '.py': 'text/x-python',
    '.rs': 'text/x-rust',
    '.cpp': 'text/x-c++src',
    '.c': 'text/x-csrc',
    '.html': 'text/html',
    '.css': 'text/css',
  };
  return map[lower] || 'application/octet-stream';
}

function buildAttachmentDescriptor(filePath: string): any | null {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = getMimeTypeFromExt(ext);
    const isImage = mimeType.startsWith('image/');
    let previewDataUrl: string | undefined;
    if (isImage && stat.size <= 8 * 1024 * 1024) {
      const buf = fs.readFileSync(filePath);
      previewDataUrl = `data:${mimeType};base64,${buf.toString('base64')}`;
    }
    return {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: path.basename(filePath),
      filePath,
      mimeType,
      size: stat.size,
      isImage,
      previewDataUrl,
    };
  } catch {
    return null;
  }
}

// Save pasted clipboard image or in-memory file blob to ~/.ndevtool/attachments
ipcMain.handle(
  'save-clipboard-attachment',
  (
    _event,
    payload: { name?: string; mimeType: string; dataBase64: string }
  ) => {
    ensureDirs();
    const mime = payload.mimeType || 'image/png';
    const rawBase64 = (payload.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(rawBase64, 'base64');

    let ext = '.bin';
    if (mime.includes('png')) ext = '.png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
    else if (mime.includes('webp')) ext = '.webp';
    else if (mime.includes('gif')) ext = '.gif';
    else if (payload.name && path.extname(payload.name)) {
      ext = path.extname(payload.name);
    }

    const baseName = payload.name
      ? payload.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `clipboard_${Date.now()}${ext}`;
    const finalFileName = baseName.endsWith(ext) ? baseName : `${baseName}${ext}`;
    const targetPath = path.join(ATTACHMENTS_DIR, `${Date.now()}_${finalFileName}`);
    fs.writeFileSync(targetPath, buf);

    const isImage = mime.startsWith('image/');
    return {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: finalFileName,
      filePath: targetPath,
      mimeType: mime,
      size: buf.length,
      isImage,
      previewDataUrl: isImage && buf.length <= 8 * 1024 * 1024 ? `data:${mime};base64,${rawBase64}` : undefined,
    };
  }
);

ipcMain.handle('attach-local-files', (_event, filePaths: string[]) => {
  const results: any[] = [];
  for (const fp of filePaths || []) {
    const desc = buildAttachmentDescriptor(fp);
    if (desc) results.push(desc);
  }
  return results;
});

ipcMain.handle('select-chat-attachments', async () => {
  if (!mainWindow) return [];
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select Images or Files to Attach',
  });
  if (result.canceled || result.filePaths.length === 0) return [];
  const items: any[] = [];
  for (const fp of result.filePaths) {
    const desc = buildAttachmentDescriptor(fp);
    if (desc) items.push(desc);
  }
  return items;
});

ipcMain.handle('select-repo-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Repository Directory',
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const folderPath = result.filePaths[0];
  const meta = detectRepoMetadata(folderPath);
  const allRepos = loadAllRepos();
  let repo = allRepos.find((r) => r.id === meta.id);

  if (repo) {
    repo.localPath = folderPath;
    repo.branch = meta.branch;
    saveRepo(repo);
  } else {
    repo = {
      ...meta,
      sessionByMachine: {},
      lastActiveMachineId: MACHINE_ID,
      contextSummary: `Active repository ${meta.name} (${meta.gitRemote || folderPath})`,
      handoff: {
        currentGoal: `Initialize context for ${meta.name}`,
        recentProgress: 'Repository mounted in NdevTool.',
        touchedFiles: [],
        nextSteps: 'Start coding session.',
        updatedAt: new Date().toISOString(),
        sourceMachineId: MACHINE_ID,
      },
      messages: [],
    };
    saveRepo(repo);
  }
  return loadAllRepos();
});

ipcMain.handle('select-sync-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Google Drive / Rclone / Git Sync Folder',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('save-repo-data', (_event, repo: any) => {
  saveRepo(repo, true);
  return loadAllRepos();
});

ipcMain.handle('check-standard-structure', (_event, folderPath: string) => {
  return checkStandardStructure(folderPath);
});

ipcMain.handle(
  'scaffold-standard-structure',
  (_event, folderPath: string, repoName: string, branch?: string) => {
    return scaffoldStandardStructure(folderPath, repoName, branch);
  }
);

// Claude subscription plan limits (5-hour session, weekly, per-model weekly), same source as Claude's own
// usage panel. The OAuth token is read here in the main process and never sent to the renderer.
ipcMain.handle('get-plan-usage', async () => {
  try {
    const credFile = path.join(os.homedir(), '.claude', '.credentials.json');
    const oauth = JSON.parse(fs.readFileSync(credFile, 'utf-8'))?.claudeAiOauth;
    if (!oauth?.accessToken) return { ok: false, reason: 'no-token' };
    const res = await fetch('https://api.anthropic.com/api/oauth/usage', {
      headers: { Authorization: `Bearer ${oauth.accessToken}`, 'anthropic-beta': 'oauth-2025-04-20' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const d: any = await res.json();
    const limits = (Array.isArray(d.limits) ? d.limits : []).map((l: any) => ({
      kind: l.kind,
      percent: Number(l.percent) || 0,
      severity: l.severity || 'normal',
      resetsAt: l.resets_at || null,
      scopeModel: l.scope?.model?.display_name || null,
    }));
    const pick = (x: any) =>
      x && typeof x.utilization === 'number'
        ? { percent: x.utilization, resetsAt: x.resets_at || null }
        : null;
    return {
      ok: true,
      plan: oauth.subscriptionType || null,
      limits,
      // Flat fields kept for the renderer popup
      fiveHour: pick(d.five_hour),
      weekly: pick(d.seven_day),
      weeklyOpus: pick(d.seven_day_opus),
      weeklySonnet: pick(d.seven_day_sonnet),
    };
  } catch (err: any) {
    return { ok: false, reason: String(err?.message || err) };
  }
});

ipcMain.handle('read-repo-handoff-disk', (_event, folderPath: string) => {
  return readHandoffFromRepoDisk(folderPath);
});

ipcMain.handle(
  'write-repo-handoff-disk',
  (_event, folderPath: string, handoff: any, branch?: string) => {
    return writeHandoffToRepoDisk(folderPath, handoff, branch);
  }
);

ipcMain.handle('open-path-in-explorer', async (_event, targetPath: string) => {
  if (!targetPath) return false;
  try {
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        await shell.openPath(targetPath);
      } else {
        shell.showItemInFolder(targetPath);
      }
      return true;
    }
  } catch (err) {
    console.error('Failed to open path:', err);
  }
  return false;
});

ipcMain.handle(
  'create-chat-session',
  (_event, payload: { repoId: string; title?: string; withHandoff?: boolean }) => {
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === payload.repoId);
    if (!repo) return allRepos;

    ensureRepoSessions(repo);
    const nextIdx = (repo.sessions?.length || 0) + 1;
    const settings = loadSettings();
    const isEn = settings.language === 'en';
    const defaultTitle =
      payload.title?.trim() || (isEn ? `Session #${nextIdx}` : `Phiên #${nextIdx}`);
    const nowIso = new Date().toISOString();

    const baseHandoff = payload.withHandoff
      ? synthesizeHandoffSummary(repo)
      : {
          currentGoal: `Initialize context for ${repo.name} (${defaultTitle})`,
          recentProgress: 'Created new chat session in NdevTool.',
          touchedFiles: [],
          nextSteps: 'Continue from the latest user instruction and verify changes on the current machine.',
          updatedAt: nowIso,
          sourceMachineId: MACHINE_ID,
        };

    const newSession = {
      id: `ses-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: defaultTitle,
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [],
      handoff: baseHandoff,
      sessionByMachine: {},
      agySessionByMachine: {},
      lastActiveMachineId: MACHINE_ID,
    };

    repo.sessions = [...(repo.sessions || []), newSession];
    switchRepoActiveSession(repo, newSession.id);
    saveRepo(repo, false);
    return loadAllRepos();
  }
);

ipcMain.handle(
  'select-chat-session',
  (_event, payload: { repoId: string; sessionId: string }) => {
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === payload.repoId);
    if (!repo) return allRepos;

    switchRepoActiveSession(repo, payload.sessionId);
    saveRepo(repo, false);
    return loadAllRepos();
  }
);

ipcMain.handle(
  'rename-chat-session',
  (_event, payload: { repoId: string; sessionId: string; title: string }) => {
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === payload.repoId);
    if (!repo) return allRepos;

    ensureRepoSessions(repo);
    const trimmed = (payload.title || '').trim();
    if (trimmed) {
      repo.sessions = (repo.sessions || []).map((s: any) =>
        s.id === payload.sessionId ? { ...s, title: trimmed, updatedAt: new Date().toISOString() } : s
      );
      saveRepo(repo, false);
    }
    return loadAllRepos();
  }
);

ipcMain.handle(
  'delete-chat-session',
  (_event, payload: { repoId: string; sessionId: string }) => {
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === payload.repoId);
    if (!repo) return allRepos;

    ensureRepoSessions(repo);
    const remaining = (repo.sessions || []).filter((s: any) => s.id !== payload.sessionId);
    if (remaining.length === 0) {
      const nowIso = new Date().toISOString();
      const fallbackSes = {
        id: `ses-${Date.now()}-1`,
        title: 'Session #1',
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: [],
        handoff: {
          currentGoal: `Initialize context for ${repo.name}`,
          recentProgress: 'Context initialized.',
          touchedFiles: [],
          nextSteps: 'Start coding session.',
          updatedAt: nowIso,
          sourceMachineId: MACHINE_ID,
        },
        sessionByMachine: {},
        agySessionByMachine: {},
        lastActiveMachineId: MACHINE_ID,
      };
      repo.sessions = [fallbackSes];
      switchRepoActiveSession(repo, fallbackSes.id);
    } else {
      repo.sessions = remaining;
      const nextActiveId =
        repo.activeSessionId === payload.sessionId ? remaining[0].id : repo.activeSessionId;
      switchRepoActiveSession(repo, nextActiveId);
    }
    saveRepo(repo, false);
    return loadAllRepos();
  }
);

// Explicitly regenerate Handoff Summary and clear current machine's native session ID
// so the very next prompt starts a 100% clean session with the Handoff Summary + recent turns
ipcMain.handle(
  'reset-machine-session-with-handoff',
  (_event, repoId: string, sessionId?: string) => {
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === repoId);
    if (!repo) return allRepos;

    if (sessionId) {
      switchRepoActiveSession(repo, sessionId);
    }
    repo.handoff = synthesizeHandoffSummary(repo);
    if (repo.sessionByMachine) {
      delete repo.sessionByMachine[MACHINE_ID];
    }
    if (repo.agySessionByMachine) {
      delete repo.agySessionByMachine[MACHINE_ID];
    }
    saveRepo(repo, true);
    return loadAllRepos();
  }
);

ipcMain.handle('trigger-cloud-sync', async () => {
  const res = await performCloudSync();
  return {
    ...res,
    repos: loadAllRepos(),
    settings: loadSettings(),
  };
});

ipcMain.handle('open-external-url', async (_event, url: string) => {
  if (url && /^https?:\/\//i.test(url)) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

function resolveEngineBinaryOnSystem(
  configuredPath: string | undefined,
  commandNames: string[],
  candidateFilePaths: string[]
): { found: boolean; resolvedPath: string; version: string } {
  const candidatesToTry: string[] = [];
  const trimmedCfg = (configuredPath || '').trim();

  // 1. If user configured an explicit file path and it exists on disk, prefer it first
  if (
    trimmedCfg &&
    (trimmedCfg.includes('\\') || trimmedCfg.includes('/')) &&
    fs.existsSync(trimmedCfg)
  ) {
    candidatesToTry.push(trimmedCfg);
  }

  // 2. Check well-known disk paths
  for (const fp of candidateFilePaths) {
    if (fp && fs.existsSync(fp) && !candidatesToTry.includes(fp)) {
      candidatesToTry.push(fp);
    }
  }

  // 3. Only check PATH via `where` / `which` if nothing was found in well-known paths
  if (candidatesToTry.length === 0) {
    const cmdsToLocate = [...commandNames];
    if (
      trimmedCfg &&
      !trimmedCfg.includes('\\') &&
      !trimmedCfg.includes('/') &&
      !cmdsToLocate.includes(trimmedCfg)
    ) {
      cmdsToLocate.unshift(trimmedCfg);
    }

    for (const cmdName of cmdsToLocate) {
      try {
        const locator = process.platform === 'win32' ? `where "${cmdName}"` : `which "${cmdName}"`;
        const out = execSync(locator, {
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 1500,
          windowsHide: true,
        })
          .toString('utf-8')
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        for (const foundLine of out) {
          if (fs.existsSync(foundLine) && !candidatesToTry.includes(foundLine)) {
            candidatesToTry.push(foundLine);
          }
        }
      } catch {
        // not in PATH
      }
    }
  }

  if (candidatesToTry.length === 0) {
    return {
      found: false,
      resolvedPath: trimmedCfg || commandNames[0] || '',
      version: '',
    };
  }

  // Pick best binary (prefer .exe / .cmd / .bat on Windows)
  let bestPath = candidatesToTry[0];
  if (process.platform === 'win32') {
    const exeOrCmd = candidatesToTry.find((p) => /\.(exe|cmd|bat)$/i.test(p));
    if (exeOrCmd) bestPath = exeOrCmd;
  }

  let version = '';
  try {
    const verOut = execSync(`"${bestPath}" --version`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 2500,
      windowsHide: true,
    })
      .toString('utf-8')
      .trim()
      .split(/\r?\n/)[0];
    version = verOut.slice(0, 60);
  } catch {
    version = 'Installed';
  }

  return {
    found: true,
    resolvedPath: bestPath,
    version,
  };
}

function checkClaudeAuthStatus(engineCfg: any): {
  authenticated: boolean;
  authMethod: string;
  authDetail: string;
} {
  const customKey = (engineCfg?.claudeApiKey || process.env.ANTHROPIC_API_KEY || '').trim();
  if (customKey.length >= 10) {
    return {
      authenticated: true,
      authMethod: 'API Key',
      authDetail: `ANTHROPIC_API_KEY (${customKey.slice(0, 7)}...${customKey.slice(-3)})`,
    };
  }

  const home = os.homedir();
  const credFiles = [
    path.join(home, '.claude', '.credentials.json'),
    path.join(home, '.claude', 'credentials.json'),
    path.join(home, '.claude.json'),
  ];

  for (const fp of credFiles) {
    if (!fs.existsSync(fp)) continue;
    try {
      const raw = fs.readFileSync(fp, 'utf-8');
      const data = JSON.parse(raw);
      if (data.claudeAiOauth?.accessToken || data.accessToken || data.oauthAccount) {
        const email =
          data.oauthAccount?.emailAddress ||
          data.oauthAccount?.email ||
          data.userEmail ||
          'Claude OAuth Session';
        return {
          authenticated: true,
          authMethod: 'OAuth CLI',
          authDetail: `${email}`,
        };
      }
      if (data.primaryApiKey || data.apiKey) {
        return {
          authenticated: true,
          authMethod: 'CLI Key',
          authDetail: 'Configured in ~/.claude.json',
        };
      }
    } catch {
      // ignore parse errors
    }
  }

  // Also check if ~/.claude/projects exists with active sessions (indicates logged-in CLI)
  const claudeProjects = path.join(home, '.claude', 'projects');
  if (fs.existsSync(claudeProjects)) {
    try {
      const entries = fs.readdirSync(claudeProjects);
      if (entries.length > 0) {
        return {
          authenticated: true,
          authMethod: 'CLI Session',
          authDetail: 'Active session in ~/.claude',
        };
      }
    } catch {}
  }

  return {
    authenticated: false,
    authMethod: 'None',
    authDetail: 'Not logged in (Run `claude login` or enter API Key)',
  };
}

function checkAntigravityAuthStatus(engineCfg: any, foundBin: boolean): {
  authenticated: boolean;
  authMethod: string;
  authDetail: string;
} {
  const customKey = (engineCfg?.antigravityApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (customKey.length >= 10) {
    return {
      authenticated: true,
      authMethod: 'API Key',
      authDetail: `GEMINI_API_KEY (${customKey.slice(0, 6)}...)`,
    };
  }

  const home = os.homedir();
  const agyPaths = [
    path.join(home, '.gemini', 'oauth_creds.json'),
    path.join(home, '.gemini', 'antigravity-cli', 'oauth_creds.json'),
    path.join(home, '.gemini', 'antigravity-cli', 'auth.json'),
    path.join(home, '.gemini', 'antigravity-cli', 'state.json'),
    path.join(home, '.gemini', 'antigravity-cli', 'brain'),
    path.join(home, '.gemini', 'antigravity'),
  ];

  for (const p of agyPaths) {
    if (fs.existsSync(p)) {
      return {
        authenticated: true,
        authMethod: 'Google Auth',
        authDetail: 'Authenticated (~/.gemini/antigravity-cli)',
      };
    }
  }

  if (foundBin) {
    return {
      authenticated: false,
      authMethod: 'None',
      authDetail: 'Not logged in (Click Auth Login to sign in)',
    };
  }

  return {
    authenticated: false,
    authMethod: 'None',
    authDetail: 'CLI not found & not authenticated',
  };
}

function checkCodexAuthStatus(engineCfg: any): {
  authenticated: boolean;
  authMethod: string;
  authDetail: string;
} {
  const apiKey = (engineCfg?.codexApiKey || process.env.OPENAI_API_KEY || '').trim();
  if (apiKey.length >= 10) {
    return {
      authenticated: true,
      authMethod: 'API Key',
      authDetail: `OPENAI_API_KEY (${apiKey.slice(0, 7)}...${apiKey.slice(-3)})`,
    };
  }

  const home = os.homedir();
  const codexAuthFiles = [
    path.join(home, '.codex', 'auth.json'),
    path.join(home, '.codex', 'config.json'),
    path.join(home, '.config', 'codex', 'auth.json'),
  ];
  for (const fp of codexAuthFiles) {
    if (fs.existsSync(fp)) {
      return {
        authenticated: true,
        authMethod: 'CLI Auth',
        authDetail: `Configured (${path.basename(fp)})`,
      };
    }
  }

  return {
    authenticated: false,
    authMethod: 'None',
    authDetail: 'Missing OpenAI API Key or `codex login`',
  };
}

function checkDeepSeekAuthStatus(engineCfg: any): {
  authenticated: boolean;
  authMethod: string;
  authDetail: string;
} {
  const apiKey = (engineCfg?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '').trim();
  if (apiKey.length >= 8) {
    return {
      authenticated: true,
      authMethod: 'API Key',
      authDetail: `DEEPSEEK_API_KEY (${apiKey.slice(0, 6)}...${apiKey.slice(-3)})`,
    };
  }
  return {
    authenticated: false,
    authMethod: 'None',
    authDetail: 'Missing DeepSeek API Key (sk-...)',
  };
}

ipcMain.handle('scan-engines', (_event, engineDraft?: any) => {
  const currentSettings = loadSettings();
  const eng = {
    ...(currentSettings.engine || {}),
    ...(engineDraft || {}),
  };
  const home = os.homedir();

  // 1. Scan Claude Code CLI
  const claudeScan = resolveEngineBinaryOnSystem(
    eng.claudeCliPath,
    process.platform === 'win32' ? ['claude.exe', 'claude.cmd', 'claude'] : ['claude'],
    process.platform === 'win32'
      ? [
          path.join(home, '.local', 'bin', 'claude.exe'),
          path.join(home, 'AppData', 'Roaming', 'npm', 'claude.cmd'),
          path.join(home, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
          path.join(home, 'AppData', 'Local', 'AnthropicClaude', 'claude.exe'),
        ]
      : [
          path.join(home, '.local', 'bin', 'claude'),
          '/usr/local/bin/claude',
          '/usr/bin/claude',
        ]
  );
  const claudeAuth = checkClaudeAuthStatus(eng);

  // 2. Scan Antigravity CLI (agy / agentapi)
  const agyScan = resolveEngineBinaryOnSystem(
    eng.antigravityCliPath,
    process.platform === 'win32' ? ['agy.exe', 'agentapi.bat', 'agy'] : ['agy', 'agentapi'],
    process.platform === 'win32'
      ? [
          path.join(home, 'AppData', 'Local', 'agy', 'bin', 'agy.exe'),
          path.join(home, '.gemini', 'antigravity', 'bin', 'agentapi.bat'),
          path.join(
            home,
            'AppData',
            'Local',
            'Programs',
            'antigravity',
            'resources',
            'bin',
            'language_server.exe'
          ),
        ]
      : [
          path.join(home, '.gemini', 'antigravity', 'bin', 'agentapi'),
          path.join(home, '.local', 'bin', 'agy'),
          '/usr/local/bin/agy',
        ]
  );
  const agyAuth = checkAntigravityAuthStatus(eng, agyScan.found);

  // 3. Scan OpenAI Codex CLI / API
  const codexScan = resolveEngineBinaryOnSystem(
    eng.codexCliPath,
    process.platform === 'win32' ? ['codex.cmd', 'codex.exe', 'codex'] : ['codex'],
    process.platform === 'win32'
      ? [
          path.join(home, 'AppData', 'Roaming', 'npm', 'codex.cmd'),
          path.join(home, '.local', 'bin', 'codex.exe'),
        ]
      : [
          path.join(home, '.local', 'bin', 'codex'),
          '/usr/local/bin/codex',
        ]
  );
  const codexAuth = checkCodexAuthStatus(eng);

  // 4. Scan DeepSeek Coder API
  const deepseekAuth = checkDeepSeekAuthStatus(eng);

  const items = [
    {
      engine: 'claude-code',
      name: 'Claude Code CLI',
      found: claudeScan.found,
      binaryPath: claudeScan.resolvedPath,
      version: claudeScan.version,
      authenticated: claudeAuth.authenticated,
      authMethod: claudeAuth.authMethod,
      authDetail: claudeAuth.authDetail,
      canBrowseBinary: true,
      loginCommand: 'claude login',
    },
    {
      engine: 'antigravity',
      name: 'Google Antigravity CLI (AGY)',
      found: agyScan.found,
      binaryPath: agyScan.resolvedPath,
      version: agyScan.version,
      authenticated: agyAuth.authenticated,
      authMethod: agyAuth.authMethod,
      authDetail: agyAuth.authDetail,
      canBrowseBinary: true,
      loginCommand: 'agy auth login',
    },
    {
      engine: 'codex',
      name: 'OpenAI Codex CLI / API',
      found: codexScan.found || codexAuth.authenticated,
      binaryPath: codexScan.found ? codexScan.resolvedPath : 'https://api.openai.com/v1',
      version: codexScan.found ? codexScan.version : 'REST API v1',
      authenticated: codexAuth.authenticated,
      authMethod: codexAuth.authMethod,
      authDetail: codexAuth.authDetail,
      canBrowseBinary: true,
      loginCommand: 'codex login',
    },
    {
      engine: 'deepseek',
      name: 'DeepSeek Coder API',
      found: deepseekAuth.authenticated,
      binaryPath: 'https://api.deepseek.com/v1',
      version: 'REST API v1',
      authenticated: deepseekAuth.authenticated,
      authMethod: deepseekAuth.authMethod,
      authDetail: deepseekAuth.authDetail,
      canBrowseBinary: false,
      loginCommand: 'https://platform.deepseek.com/api_keys',
    },
  ];

  return {
    items,
    detectedPaths: {
      claudeCliPath: claudeScan.found ? claudeScan.resolvedPath : eng.claudeCliPath || 'claude',
      antigravityCliPath: agyScan.found ? agyScan.resolvedPath : eng.antigravityCliPath || 'agy',
      codexCliPath: codexScan.found ? codexScan.resolvedPath : eng.codexCliPath || 'codex',
    },
  };
});

ipcMain.handle('select-engine-binary', async (_event, engine: string) => {
  if (!mainWindow) return null;
  const filters =
    process.platform === 'win32'
      ? [
          { name: 'CLI Executables (.exe, .cmd, .bat)', extensions: ['exe', 'cmd', 'bat', 'ps1'] },
          { name: 'All Files', extensions: ['*'] },
        ]
      : [{ name: 'All Executables', extensions: ['*'] }];

  const titleMap: Record<string, string> = {
    'claude-code': 'Select Claude Code CLI Binary (claude.exe / claude.cmd / claude)',
    antigravity: 'Select Antigravity CLI Binary (agy.exe / agentapi.bat / agy)',
    codex: 'Select OpenAI Codex CLI Binary (codex.cmd / codex.exe / codex)',
  };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters,
    title: titleMap[engine] || 'Select Engine CLI Binary',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle(
  'launch-engine-cli-login',
  async (_event, payload: { engine: string; binaryPath?: string }) => {
    const engine = payload?.engine || 'claude-code';
    const settings = loadSettings();
    let bin = (payload?.binaryPath || '').trim();

    if (engine === 'claude-code') {
      if (!bin) bin = settings.engine?.claudeCliPath || getDefaultClaudePath();
      if (process.platform === 'win32') {
        spawn('cmd.exe', ['/c', 'start', '"Claude Code Auth Login"', 'cmd.exe', '/k', `"${bin}" login || "${bin}"`], {
          detached: true,
          stdio: 'ignore',
          windowsVerbatimArguments: true,
        }).unref();
      } else {
        spawn('sh', ['-c', `x-terminal-emulator -e '${bin} login' || gnome-terminal -- ${bin} login || xterm -e '${bin} login'`], {
          detached: true,
          stdio: 'ignore',
        }).unref();
      }
      return { ok: true, launched: 'terminal' };
    }

    if (engine === 'antigravity') {
      if (!bin) bin = settings.engine?.antigravityCliPath || getDefaultAntigravityPath();
      if (process.platform === 'win32') {
        spawn('cmd.exe', ['/c', 'start', '"Antigravity CLI Auth Login"', 'cmd.exe', '/k', `"${bin}" auth login || "${bin}" login || "${bin}"`], {
          detached: true,
          stdio: 'ignore',
          windowsVerbatimArguments: true,
        }).unref();
      } else {
        spawn('sh', ['-c', `x-terminal-emulator -e '${bin} auth login' || gnome-terminal -- ${bin} auth login || xterm -e '${bin} auth login'`], {
          detached: true,
          stdio: 'ignore',
        }).unref();
      }
      return { ok: true, launched: 'terminal' };
    }

    if (engine === 'codex') {
      if (!bin) bin = settings.engine?.codexCliPath || getDefaultCodexPath();
      if (bin && bin !== 'https://api.openai.com/v1') {
        if (process.platform === 'win32') {
          spawn('cmd.exe', ['/c', 'start', '"OpenAI Codex CLI Login"', 'cmd.exe', '/k', `"${bin}" login || "${bin}"`], {
            detached: true,
            stdio: 'ignore',
            windowsVerbatimArguments: true,
          }).unref();
          return { ok: true, launched: 'terminal' };
        }
      }
      await shell.openExternal('https://platform.openai.com/api-keys');
      return { ok: true, launched: 'browser' };
    }

    if (engine === 'deepseek') {
      await shell.openExternal('https://platform.deepseek.com/api_keys');
      return { ok: true, launched: 'browser' };
    }

    return { ok: false };
  }
);

ipcMain.handle('select-service-account-file', async (_event, lang?: string) => {
  if (!mainWindow) return null;
  const isEn = (lang || loadSettings().language) === 'en';
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Google Service Account JSON', extensions: ['json'] }],
    title: 'Select Google Service Account JSON Key File',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      filePath,
      content,
      clientEmail: parsed.client_email || '',
    };
  } catch (e: any) {
    throw new Error(isEn ? `Invalid JSON file: ${e.message}` : `File JSON không hợp lệ: ${e.message}`);
  }
});

// Test Google Drive connection & ensure real folder exists on Google Drive, then sync immediately
ipcMain.handle('test-gdrive-connection', async (_event, syncDraft: any, lang?: string) => {
  const activeLang = lang || loadSettings().language || 'vi';
  try {
    const apiRes = await syncReposWithGoogleDriveApi(syncDraft, activeLang);
    const settings = loadSettings();
    settings.sync = {
      ...settings.sync,
      ...syncDraft,
      ...apiRes.updatedSyncPatch,
      lastSyncedAt: new Date().toISOString(),
    };
    saveSettings(settings);
    return {
      ok: true,
      syncedCount: apiRes.syncedCount,
      folderId: apiRes.folderId,
      folderName: apiRes.folderName,
      folderWebUrl: apiRes.folderWebUrl,
      email: apiRes.email || settings.sync.gdriveConnectedEmail || '',
      settings,
      repos: loadAllRepos(),
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || String(err),
    };
  }
});

// Interactive Browser OAuth2 Loopback Sign-In for Google Drive
ipcMain.handle('start-gdrive-oauth', async (_event, syncDraft: any, lang?: string) => {
  const activeLang = lang || loadSettings().language || 'vi';
  const isEn = activeLang === 'en';
  const clientId = (syncDraft?.gdriveClientId || '').trim();
  const clientSecret = (syncDraft?.gdriveClientSecret || '').trim();
  if (!clientId) {
    return {
      ok: false,
      error: isEn
        ? 'Please enter a Google OAuth2 Client ID (Desktop App) before clicking Sign In.'
        : 'Vui lòng nhập Google OAuth2 Client ID (Desktop App) trước khi bấm Đăng nhập.',
    };
  }

  return new Promise((resolve) => {
    const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
    const codeChallenge = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest());

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
        if (reqUrl.pathname !== '/oauth2callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = reqUrl.searchParams.get('code');
        const errParam = reqUrl.searchParams.get('error');
        if (errParam || !code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(
            `<body style="background:#080d14;color:#ff5555;font-family:monospace;padding:40px;"><h2>${
              isEn ? 'Google Drive authentication error' : 'Lỗi xác thực Google Drive'
            }: ${
              errParam ||
              (isEn ? 'No authorization code received' : 'Không nhận được authorization code')
            }</h2></body>`
          );
          server.close();
          resolve({ ok: false, error: errParam || 'OAuth2 cancelled' });
          return;
        }

        const addr = server.address() as any;
        const redirectUri = `http://127.0.0.1:${addr.port}/oauth2callback`;

        const tokenParams: Record<string, string> = {
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        };
        if (clientSecret) {
          tokenParams.client_secret = clientSecret;
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(tokenParams).toString(),
        });
        const tokenData: any = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(
            `<body style="background:#080d14;color:#ff5555;font-family:monospace;padding:40px;"><h2>${
              isEn ? 'Failed to exchange OAuth2 token' : 'Không thể đổi OAuth2 token'
            }: ${
              tokenData.error_description || tokenData.error || tokenRes.statusText
            }</h2></body>`
          );
          server.close();
          resolve({
            ok: false,
            error: tokenData.error_description || tokenData.error || 'Token exchange failed',
          });
          return;
        }

        const nextSyncCfg = {
          ...syncDraft,
          gdriveAuthMethod: 'oauth-browser',
          gdriveClientId: clientId,
          gdriveClientSecret: clientSecret,
          gdriveAccessToken: tokenData.access_token,
          gdriveRefreshToken: tokenData.refresh_token || syncDraft?.gdriveRefreshToken || '',
          gdriveTokenExpiry: Date.now() + (Number(tokenData.expires_in) || 3600) * 1000,
        };

        const syncRes = await syncReposWithGoogleDriveApi(nextSyncCfg, activeLang);
        const settings = loadSettings();
        settings.sync = {
          ...settings.sync,
          ...nextSyncCfg,
          ...syncRes.updatedSyncPatch,
          lastSyncedAt: new Date().toISOString(),
        };
        saveSettings(settings);

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          `<body style="background:#06090e;color:#00ff9c;font-family:monospace;padding:40px;text-align:center;">
            <h2>[NDEVTOOL :: GOOGLE DRIVE CONNECTED]</h2>
            <p>${
              isEn
                ? `Connected account <b>${
                    syncRes.email || 'Google Drive'
                  }</b> and created/synced real folder <b>${syncRes.folderName}</b> on Google Drive!`
                : `Đã kết nối tài khoản <b>${
                    syncRes.email || 'Google Drive'
                  }</b> và tạo/đồng bộ thư mục thật <b>${syncRes.folderName}</b> trên Google Drive!`
            }</p>
            <p><a href="${syncRes.folderWebUrl}" style="color:#00e5ff;">${
            isEn
              ? `Open folder ${syncRes.folderName} on Google Drive ↗`
              : `Mở thư mục ${syncRes.folderName} trên Google Drive ↗`
          }</a></p>
            <p style="color:#8892b0;font-size:12px;">${
              isEn
                ? 'You can close this browser tab and return to NdevTool.'
                : 'Bạn có thể đóng tab trình duyệt này và quay lại NdevTool.'
            }</p>
          </body>`
        );
        server.close();
        resolve({
          ok: true,
          syncedCount: syncRes.syncedCount,
          folderId: syncRes.folderId,
          folderName: syncRes.folderName,
          folderWebUrl: syncRes.folderWebUrl,
          email: syncRes.email || '',
          settings,
          repos: loadAllRepos(),
        });
      } catch (err: any) {
        server.close();
        resolve({ ok: false, error: err.message || String(err) });
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      const redirectUri = `http://127.0.0.1:${addr.port}/oauth2callback`;
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/drive');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      shell.openExternal(authUrl.toString());
    });

    // Timeout after 3 minutes if user closes browser without completing
    setTimeout(() => {
      if (server.listening) {
        server.close();
        resolve({
          ok: false,
          error: isEn
            ? 'Timed out waiting for OAuth2 Sign-In in browser (3 minutes).'
            : 'Hết thời gian chờ đăng nhập OAuth2 trên trình duyệt (3 phút).',
        });
      }
    }, 180_000);
  });
});

ipcMain.handle('abort-engine', () => {
  if (activeChildProcess) {
    activeChildProcess.kill();
    activeChildProcess = null;
  }
  return true;
});

function buildPromptWithAttachments(prompt: string, attachments?: any[]): string {
  if (!attachments || attachments.length === 0) return prompt;
  const attLines: string[] = [
    '',
    '=== ATTACHED IMAGES / FILES IN THIS MESSAGE ===',
    'Please inspect/read the following attached file(s) on disk using your file/image reading tool:',
  ];
  for (const att of attachments) {
    attLines.push(
      `- [${att.isImage ? 'IMAGE' : 'FILE'}] ${att.name} (${att.mimeType || 'file'}, ${
        att.size || 0
      } bytes) -> Path: ${att.filePath}`
    );
    // If it's a small text/code file (< 24KB), also include its content inline for immediate context
    if (
      !att.isImage &&
      att.filePath &&
      fs.existsSync(att.filePath) &&
      (att.size || 0) > 0 &&
      (att.size || 0) <= 24 * 1024
    ) {
      const ext = path.extname(att.filePath).toLowerCase();
      if (
        [
          '.txt',
          '.md',
          '.json',
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
          '.py',
          '.rs',
          '.cpp',
          '.c',
          '.h',
          '.html',
          '.css',
          '.yaml',
          '.yml',
          '.toml',
          '.log',
          '.csv',
          '.xml',
          '.bat',
          '.sh',
        ].includes(ext)
      ) {
        try {
          const content = fs.readFileSync(att.filePath, 'utf-8');
          attLines.push(`\`\`\`${ext.slice(1)}\n${content}\n\`\`\``);
        } catch {
          // ignore binary read error
        }
      }
    }
  }
  attLines.push('===============================================');
  return `${prompt}\n${attLines.join('\n')}`;
}

ipcMain.handle(
  'send-engine-prompt',
  async (
    _event,
    payload: {
      repoId: string;
      sessionId?: string;
      prompt: string;
      disguisedHeader: string;
      disguisedCodeBlock: string;
      attachments?: any[];
      modelOverride?: string;
      effortOverride?: string;
      skipPermissionsOverride?: boolean;
    }
  ) => {
    const settings = loadSettings();
    const allRepos = loadAllRepos();
    const repo = allRepos.find((r) => r.id === payload.repoId);
    if (!repo) throw new Error('Repository not found');

    if (payload.sessionId) {
      switchRepoActiveSession(repo, payload.sessionId);
    }

    const engineType = settings.engine?.activeEngine || 'claude-code';
    const recentTurnsCount = Number(settings.engine?.recentTurnsCount || 6);
    const selectedModel =
      payload.modelOverride ||
      (engineType === 'claude-code'
        ? settings.engine?.claudeModel || 'claude-sonnet-5-5'
        : engineType === 'antigravity'
        ? settings.engine?.antigravityModel || 'Gemini 4 Argon'
        : engineType === 'deepseek'
        ? settings.engine?.deepseekModel || 'deepseek-chat'
        : settings.engine?.codexModel || 'o3-mini');
    const selectedEffort = payload.effortOverride || settings.engine?.effortLevel || 'high';
    const skipPermissions =
      payload.skipPermissionsOverride !== undefined
        ? payload.skipPermissionsOverride
        : settings.engine?.skipPermissions !== false;

    // Build Handoff payload BEFORE appending the new user message so recent turns don't duplicate the prompt
    const handoffSystemPrompt = buildHandoffPromptPayload(repo, recentTurnsCount);

    const userMsg = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      realContent: payload.prompt,
      disguisedHeader: payload.disguisedHeader,
      disguisedCodeBlock: payload.disguisedCodeBlock,
      attachments: payload.attachments || [],
      engine: engineType,
      modelUsed: selectedModel,
      effortUsed: selectedEffort,
      timestamp: new Date().toISOString(),
      machineId: MACHINE_ID,
    };

    repo.messages = [...(repo.messages || []), userMsg];
    saveRepo(repo);

    const effectivePrompt = buildPromptWithAttachments(payload.prompt, payload.attachments);
    const assistantMsgId = `msg-${Date.now()}-a`;

    if (engineType === 'claude-code') {
      return await runClaudeCodeEngine(
        repo,
        effectivePrompt,
        handoffSystemPrompt,
        assistantMsgId,
        settings,
        selectedModel,
        selectedEffort,
        skipPermissions
      );
    } else if (engineType === 'antigravity') {
      return await runAntigravityEngine(
        repo,
        effectivePrompt,
        handoffSystemPrompt,
        assistantMsgId,
        settings,
        selectedModel,
        selectedEffort,
        skipPermissions
      );
    } else if (engineType === 'deepseek') {
      return await runOpenAiCompatibleEngine(
        repo,
        effectivePrompt,
        handoffSystemPrompt,
        assistantMsgId,
        'deepseek',
        'https://api.deepseek.com/v1/chat/completions',
        settings.engine?.deepseekApiKey,
        selectedModel,
        selectedEffort
      );
    } else {
      return await runOpenAiCompatibleEngine(
        repo,
        effectivePrompt,
        handoffSystemPrompt,
        assistantMsgId,
        'codex',
        'https://api.openai.com/v1/chat/completions',
        settings.engine?.codexApiKey,
        selectedModel,
        selectedEffort
      );
    }
  }
);

function emitStreamEvent(data: any) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('engine-stream-event', data);
  }
}

async function runClaudeCodeEngine(
  repo: any,
  prompt: string,
  handoffSystemPrompt: string,
  assistantMsgId: string,
  settings: any,
  model: string,
  effort: string,
  skipPermissions: boolean
): Promise<any> {
  const claudeBin = settings.engine?.claudeCliPath || getDefaultClaudePath();
  const cwd = fs.existsSync(repo.localPath) ? repo.localPath : process.cwd();
  const strategy = settings.engine?.continuityStrategy || 'smart-handoff';

  const machineSessionId = repo.sessionByMachine?.[MACHINE_ID];
  const switchedMachine = repo.lastActiveMachineId && repo.lastActiveMachineId !== MACHINE_ID;

  const useNativeSameMachineResume =
    strategy === 'smart-handoff' && Boolean(machineSessionId) && !switchedMachine;

  const args: string[] = ['--output-format', 'stream-json', '--verbose'];
  if (model) {
    args.push('--model', model);
  }
  if (effort) {
    args.push('--effort', effort);
  }
  if (skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }
  if (useNativeSameMachineResume && machineSessionId) {
    args.push('--resume', machineSessionId);
  } else if (handoffSystemPrompt) {
    args.push('--append-system-prompt', handoffSystemPrompt);
  }

  // Use '--print' and '--' before prompt so any prompt starting with '-' (e.g. Markdown bullet points or dashes)
  // is treated as a positional prompt argument and NOT misparsed as a command-line option flag!
  args.push('--print', '--', prompt);

  emitStreamEvent({
    type: 'status',
    status: 'thinking',
    detail: useNativeSameMachineResume
      ? `Resuming Claude (${model} | effort=${effort}) session (${machineSessionId.slice(0, 6)})...`
      : `Starting fresh Claude (${model} | effort=${effort}) Handoff Session...`,
  });

  return new Promise((resolve) => {
    let accumulatedText = '';
    const toolActivities: any[] = [];
    let tokensIn = 0;
    let tokensOut = 0;
    let contextTokens = 0;
    let costUsd = 0;
    let newSessionId = machineSessionId;

    try {
      const claudeEnv: NodeJS.ProcessEnv = { ...process.env };
      if (settings.engine?.claudeApiKey) {
        claudeEnv.ANTHROPIC_API_KEY = settings.engine.claudeApiKey;
      }
      const child = spawn(claudeBin, args, {
        cwd,
        env: claudeEnv,
        shell: process.platform === 'win32' && !claudeBin.endsWith('.exe'),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      activeChildProcess = child;

      let lineBuffer = '';
      child.stdout.on('data', (chunk: Buffer) => {
        lineBuffer += chunk.toString('utf-8');
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          try {
            const evt = JSON.parse(line);
            if (evt.session_id) {
              newSessionId = evt.session_id;
            }

            if (evt.type === 'assistant' && evt.message?.content) {
              for (const block of evt.message.content) {
                if (block.type === 'text' && block.text) {
                  accumulatedText = block.text;
                  emitStreamEvent({
                    type: 'chunk',
                    messageId: assistantMsgId,
                    text: accumulatedText,
                    toolActivities,
                  });
                } else if (block.type === 'thinking' && block.thinking) {
                  const cleanThought = String(block.thinking).trim().replace(/\s+/g, ' ').slice(0, 140);
                  emitStreamEvent({
                    type: 'status',
                    status: 'thinking',
                    detail: `[CLAUDE::THINKING] ${cleanThought}...`,
                    toolActivities,
                  });
                } else if (block.type === 'tool_use') {
                  const toolName = block.name || 'Tool';
                  const target =
                    block.input?.file_path ||
                    block.input?.path ||
                    block.input?.command ||
                    block.input?.pattern ||
                    '';
                  const activity = {
                    id: block.id || `tool-${Date.now()}`,
                    toolName,
                    target: String(target).slice(0, 80),
                    timestamp: new Date().toISOString(),
                  };
                  toolActivities.push(activity);

                  let statusMode = 'executing';
                  if (/read|glob|grep|ls/i.test(toolName)) statusMode = 'reading';
                  if (/edit|write|replace/i.test(toolName)) statusMode = 'editing';

                  emitStreamEvent({
                    type: 'status',
                    status: statusMode,
                    detail: `[${toolName.toUpperCase()}] ${activity.target}`,
                    toolActivities,
                  });
                }
              }
            } else if (evt.type === 'result') {
              if (evt.result && !accumulatedText) {
                accumulatedText = evt.result;
              }
              tokensIn = evt.usage?.input_tokens || tokensIn;
              tokensOut = evt.usage?.output_tokens || tokensOut;
              costUsd = evt.total_cost_usd || costUsd;
              // Context fill = fresh input + cache reads/writes (input_tokens alone excludes cache)
              if (evt.usage) {
                contextTokens =
                  (evt.usage.input_tokens || 0) +
                  (evt.usage.cache_read_input_tokens || 0) +
                  (evt.usage.cache_creation_input_tokens || 0);
              }
            }
          } catch {
            accumulatedText += (accumulatedText ? '\n' : '') + line;
            emitStreamEvent({
              type: 'chunk',
              messageId: assistantMsgId,
              text: accumulatedText,
              toolActivities,
            });
          }
        }
      });

      let stderrText = '';
      child.stderr.on('data', (chunk: Buffer) => {
        stderrText += chunk.toString('utf-8');
      });

      child.on('close', async (code) => {
        activeChildProcess = null;
        if (!accumulatedText && stderrText) {
          accumulatedText = `[CLAUDE_CLI_DIAGNOSTIC (exit ${code})]:\n${stderrText.trim()}`;
        } else if (!accumulatedText) {
          accumulatedText = 'Task completed (no text output).';
        }

        const assistantDisguisedCode = [
          `// Ring-0 Verification & DMA Completion Trace`,
          `pub unsafe fn verify_dma_completion_frame(ctx: *mut KernelContext) -> Result<usize, KernelError> {`,
          `    let words = ${(accumulatedText.length * 4 + 128).toString()};`,
          `    mmu::flush_tlb_page(VirtAddr::new(0x${(0x7ff8b000 + repo.messages.length * 0x120).toString(16)}));`,
          `    Ok(words)`,
          `}`,
        ].join('\n');

        const assistantMsg = {
          id: assistantMsgId,
          role: 'assistant',
          realContent: accumulatedText,
          disguisedHeader: `[DMA_TRACE_RET 0x${(0x7ff8b000 + repo.messages.length * 0x120)
            .toString(16)
            .toUpperCase()}] << claude_ring0::dispatch_complete(model=${model}, effort=${effort})`,
          disguisedCodeBlock: assistantDisguisedCode,
          engine: 'claude-code',
          modelUsed: model,
          effortUsed: effort,
          timestamp: new Date().toISOString(),
          machineId: MACHINE_ID,
          toolActivities,
          tokensIn,
          tokensOut,
          contextTokens,
          costUsd,
        };

        repo.sessionByMachine = {
          ...(repo.sessionByMachine || {}),
          ...(newSessionId ? { [MACHINE_ID]: newSessionId } : {}),
        };
        repo.lastActiveMachineId = MACHINE_ID;
        repo.messages = [...repo.messages, assistantMsg];

        // Automatically update the Handoff Summary so if the user switches machines right now, it's 100% ready
        repo.handoff = synthesizeHandoffSummary(repo);
        repo.contextSummary = `[Goal]: ${repo.handoff.currentGoal}`;
        saveRepo(repo);

        if (settings.sync?.autoSync) {
          emitStreamEvent({ type: 'status', status: 'syncing', detail: 'Syncing Handoff Summary to Cloud...' });
          await performCloudSync();
        }

        emitStreamEvent({ type: 'status', status: 'idle', detail: 'System Idle (Handoff Ready)' });
        resolve({ repos: loadAllRepos() });
      });
    } catch (err: any) {
      activeChildProcess = null;
      emitStreamEvent({ type: 'status', status: 'error', detail: err.message });
      resolve({ repos: loadAllRepos(), error: err.message });
    }
  });
}

async function runAntigravityEngine(
  repo: any,
  prompt: string,
  handoffSystemPrompt: string,
  assistantMsgId: string,
  settings: any,
  model: string,
  effort: string,
  skipPermissions: boolean
): Promise<any> {
  const agyBin = settings.engine?.antigravityCliPath || getDefaultAntigravityPath();
  const cwd = fs.existsSync(repo.localPath) ? repo.localPath : process.cwd();
  const strategy = settings.engine?.continuityStrategy || 'smart-handoff';

  const machineAgyConvId = repo.agySessionByMachine?.[MACHINE_ID];
  const switchedMachine = repo.lastActiveMachineId && repo.lastActiveMachineId !== MACHINE_ID;
  const useSameMachineConv =
    strategy === 'smart-handoff' && Boolean(machineAgyConvId) && !switchedMachine;

  const fullPromptWithHandoff = useSameMachineConv
    ? prompt
    : `${handoffSystemPrompt}\n\n[USER INSTRUCTION]:\n${prompt}`;

  // Construct exact Antigravity CLI (jetski) model string:
  // Available models from `agy`:
  // - Gemini 4 Argon (Low | Medium | High)
  // - Gemini 3.8 Flash (Low | Medium | High)
  // - Claude Opus 5.5 (Low | Medium | High)
  // - Claude Sonnet 5.5 (Low | Medium | High)
  // - GPT-OSS 120B (Medium)
  const capEffort =
    effort.toLowerCase() === 'low'
      ? 'Low'
      : effort.toLowerCase() === 'medium'
      ? 'Medium'
      : 'High';

  let resolvedAgyModel = model || 'Gemini 4 Argon';
  if (!resolvedAgyModel.includes('(')) {
    if (resolvedAgyModel.includes('GPT-OSS')) {
      resolvedAgyModel = 'GPT-OSS 120B (Medium)';
    } else {
      resolvedAgyModel = `${resolvedAgyModel} (${capEffort})`;
    }
  }

  const isAgentApi = /agentapi|language_server/i.test(agyBin);
  const args: string[] = [];

  if (isAgentApi) {
    if (/language_server/i.test(agyBin)) {
      args.push('agentapi');
    }
    const agentApiTier = /Flash/i.test(resolvedAgyModel) ? 'flash' : 'pro';
    if (useSameMachineConv && machineAgyConvId) {
      args.push('send-message', `--title=${repo.name}`, machineAgyConvId, fullPromptWithHandoff);
    } else {
      args.push(
        'new-conversation',
        `--model=${agentApiTier}`,
        `--title=[NdevTool] ${repo.name}`,
        fullPromptWithHandoff
      );
    }
  } else {
    // Standard `agy` (jetski) CLI invocation with stream-json for real-time tool & thinking feedback!
    args.push('--output-format', 'stream-json');
    if (skipPermissions) {
      args.push('--dangerously-skip-permissions');
    }
    if (useSameMachineConv && machineAgyConvId) {
      args.push('--conversation', machineAgyConvId);
    }
    args.push('--model', resolvedAgyModel);
    args.push(`--print=${fullPromptWithHandoff}`);
  }

  emitStreamEvent({
    type: 'status',
    status: 'thinking',
    detail: `Spawning Antigravity [${resolvedAgyModel}] (auto-permit=${skipPermissions ? 'ON' : 'OFF'})...`,
  });

  return new Promise((resolve) => {
    let accumulatedText = '';
    let stderrText = '';
    let detectedConvId = machineAgyConvId;
    const toolActivities: any[] = [];
    let tokensIn = 0;
    let tokensOut = 0;
    let contextTokens = 0;
    let costUsd = 0;
    const spawnStartMs = Date.now();
    let liveWatcherTimer: NodeJS.Timeout | null = null;
    const processedTranscriptSteps = new Set<number>();
    let lastStatusMode: string = 'thinking';
    let lastStatusSummary: string = `Spawning Antigravity [${resolvedAgyModel}]...`;
    let latestThinkingText: string = '';

    // Real-time watcher for Antigravity CLI's live `transcript.jsonl` & `cli-*.log`
    // (`agy.exe -p` buffers stdout until turn completion, but flushes every step & tool call in real time to ~/.gemini/antigravity-cli/brain/<conv_id>/.system_generated/logs/transcript.jsonl)
    const agyCliRoot = path.join(os.homedir(), '.gemini', 'antigravity-cli');
    const agyLogDir = path.join(agyCliRoot, 'log');
    const agyBrainDir = path.join(agyCliRoot, 'brain');

    const pollAgyLiveTranscript = () => {
      try {
        // 1. Discover active conversation ID & live LLM/Monitor activity from newest cli-*.log
        if (fs.existsSync(agyLogDir)) {
          const logFiles = fs
            .readdirSync(agyLogDir)
            .filter((f) => f.startsWith('cli-') && f.endsWith('.log'))
            .map((f) => {
              const full = path.join(agyLogDir, f);
              try {
                return { full, mtimeMs: fs.statSync(full).mtimeMs };
              } catch {
                return { full, mtimeMs: 0 };
              }
            })
            .filter((item) => item.mtimeMs >= spawnStartMs - 10000)
            .sort((a, b) => b.mtimeMs - a.mtimeMs);

          if (logFiles.length > 0) {
            const logContent = fs.readFileSync(logFiles[0].full, 'utf-8');
            if (!detectedConvId) {
              const convMatch =
                logContent.match(/Created conversation ([0-9a-f-]{36})/i) ||
                logContent.match(/Streaming conversation ([0-9a-f-]{36})/i);
              if (convMatch?.[1]) {
                detectedConvId = convMatch[1];
              }
            }
            const tailLines = logContent.slice(-3500).split('\n');
            for (let i = tailLines.length - 1; i >= 0; i--) {
              const l = tailLines[i];
              const monitorMatch = l.match(/Monitor sir_flash_lite FINISHED:.*?reason="([^"]+)"/);
              if (monitorMatch?.[1]) {
                lastStatusSummary = `[AGY::VERIFY] ${monitorMatch[1].slice(0, 110)}`;
                break;
              }
              if (l.includes('streamGenerateContent?alt=sse')) {
                const elapsedSec = Math.max(1, Math.round((Date.now() - spawnStartMs) / 1000));
                if (lastStatusMode === 'thinking' && toolActivities.length === 0) {
                  lastStatusSummary = `[AGY::THINKING] Streaming LLM tokens (${elapsedSec}s)...`;
                }
                break;
              }
            }
          }
        }

        // Fallback: detect newest brain directory modified after spawnStartMs
        if (!detectedConvId && fs.existsSync(agyBrainDir)) {
          const dirs = fs
            .readdirSync(agyBrainDir)
            .map((d) => {
              const full = path.join(agyBrainDir, d);
              const transcriptFile = path.join(full, '.system_generated', 'logs', 'transcript.jsonl');
              try {
                const st = fs.existsSync(transcriptFile)
                  ? fs.statSync(transcriptFile)
                  : fs.statSync(full);
                return { id: d, mtimeMs: st.mtimeMs };
              } catch {
                return { id: d, mtimeMs: 0 };
              }
            })
            .filter((item) => item.mtimeMs >= spawnStartMs - 3000)
            .sort((a, b) => b.mtimeMs - a.mtimeMs);

          if (dirs.length > 0) {
            detectedConvId = dirs[0].id;
          }
        }

        // 2. Read live steps from ~/.gemini/antigravity-cli/brain/<detectedConvId>/.system_generated/logs/transcript.jsonl
        if (detectedConvId) {
          const transcriptPath = path.join(
            agyBrainDir,
            detectedConvId,
            '.system_generated',
            'logs',
            'transcript.jsonl'
          );
          if (fs.existsSync(transcriptPath)) {
            const rawLines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');
            let updatedAnyStep = false;

            for (const raw of rawLines) {
              const trimmed = raw.trim();
              if (!trimmed) continue;
              try {
                const step = JSON.parse(trimmed);
                const stepIdx = Number(step.step_index ?? -1);
                if (stepIdx < 0 || processedTranscriptSteps.has(stepIdx)) continue;

                // Ignore steps from older turns when resuming an existing conversation on the same machine
                if (step.created_at) {
                  const createdMs = Date.parse(step.created_at);
                  if (!isNaN(createdMs) && createdMs < spawnStartMs - 5000) {
                    processedTranscriptSteps.add(stepIdx);
                    continue;
                  }
                }

                processedTranscriptSteps.add(stepIdx);
                updatedAnyStep = true;

                if (step.input_tokens) tokensIn = step.input_tokens;
                if (step.output_tokens) tokensOut += Number(step.output_tokens || 0);

                if (step.thinking && typeof step.thinking === 'string') {
                  const cleanThought = step.thinking.trim().replace(/\s+/g, ' ');
                  latestThinkingText = cleanThought.slice(0, 320);
                  lastStatusMode = 'thinking';
                  lastStatusSummary = `[AGY::THINKING] ${cleanThought.slice(0, 120)}...`;
                }

                if (Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
                  for (const tc of step.tool_calls) {
                    const toolName = tc.name || 'Tool';
                    const rawTarget =
                      tc.args?.Path ||
                      tc.args?.file_path ||
                      tc.args?.path ||
                      tc.args?.CommandLine ||
                      tc.args?.command ||
                      tc.args?.toolSummary ||
                      tc.args?.Query ||
                      tc.args?.Pattern ||
                      tc.args?.SearchPath ||
                      '';
                    const cleanTarget = String(rawTarget)
                      .replace(/^"+|"+$/g, '')
                      .replace(/\\\\/g, '\\');
                    const displayTarget =
                      cleanTarget.length > 72
                        ? '...' + cleanTarget.slice(-69)
                        : cleanTarget || toolName;

                    const actId = `agy-step-${stepIdx}-${toolName}-${toolActivities.length}`;
                    toolActivities.push({
                      id: actId,
                      toolName,
                      target: displayTarget,
                      timestamp: step.created_at || new Date().toISOString(),
                    });

                    if (/read|glob|grep|ls|view|list|find|search/i.test(toolName)) {
                      lastStatusMode = 'reading';
                    } else if (/edit|write|replace|create|patch/i.test(toolName)) {
                      lastStatusMode = 'editing';
                    } else {
                      lastStatusMode = 'executing';
                    }
                    lastStatusSummary = `[AGY::${toolName.toUpperCase()}] ${displayTarget}`;
                  }
                }

                // If PLANNER_RESPONSE has final content and no tool_calls, capture it
                if (
                  step.type === 'PLANNER_RESPONSE' &&
                  step.content &&
                  typeof step.content === 'string' &&
                  (!step.tool_calls || step.tool_calls.length === 0)
                ) {
                  accumulatedText = step.content;
                }
              } catch {
                // ignore partial line being written
              }
            }

            if (updatedAnyStep) {
              const elapsedSec = Math.max(1, Math.round((Date.now() - spawnStartMs) / 1000));
              emitStreamEvent({
                type: 'status',
                status: lastStatusMode,
                detail: `${lastStatusSummary} (${elapsedSec}s)`,
                toolActivities,
              });

              if (!accumulatedText && (latestThinkingText || toolActivities.length > 0)) {
                const liveLines: string[] = [];
                if (latestThinkingText) {
                  liveLines.push(`[AGY_THINKING]: ${latestThinkingText}`);
                }
                if (toolActivities.length > 0) {
                  const lastTool = toolActivities[toolActivities.length - 1];
                  liveLines.push(
                    `[ACTIVE_OP (${ lastStatusMode.toUpperCase() })]: ${lastTool.toolName} -> ${lastTool.target}`
                  );
                }
                emitStreamEvent({
                  type: 'chunk',
                  messageId: assistantMsgId,
                  text: liveLines.join('\n'),
                  toolActivities,
                });
              } else if (accumulatedText) {
                emitStreamEvent({
                  type: 'chunk',
                  messageId: assistantMsgId,
                  text: accumulatedText,
                  toolActivities,
                });
              }
            } else {
              // Keep elapsed time counter alive in status bar even during long file writes
              const elapsedSec = Math.max(1, Math.round((Date.now() - spawnStartMs) / 1000));
              emitStreamEvent({
                type: 'status',
                status: lastStatusMode,
                detail: `${lastStatusSummary} (${elapsedSec}s)`,
                toolActivities,
              });
            }
          }
        }
      } catch {
        // ignore transient fs read errors
      }
    };

    try {
      const agyEnv: NodeJS.ProcessEnv = { ...process.env };
      if (settings.engine?.antigravityApiKey) {
        agyEnv.GEMINI_API_KEY = settings.engine.antigravityApiKey;
      }
      const child = spawn(agyBin, args, {
        cwd,
        env: agyEnv,
        shell: process.platform === 'win32' && !agyBin.endsWith('.exe'),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      activeChildProcess = child;
      liveWatcherTimer = setInterval(pollAgyLiveTranscript, 600);

      let lineBuffer = '';
      child.stdout.on('data', (chunk: Buffer) => {
        const str = chunk.toString('utf-8');
        lineBuffer += str;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          try {
            const evt = JSON.parse(line);
            if (evt.session_id || evt.conversation_id) {
              detectedConvId = evt.session_id || evt.conversation_id;
            }

            // Handle Claude-compatible stream-json events or Antigravity step events
            if (evt.type === 'assistant' && evt.message?.content) {
              for (const block of evt.message.content) {
                if (block.type === 'text' && block.text) {
                  accumulatedText = block.text;
                  emitStreamEvent({
                    type: 'chunk',
                    messageId: assistantMsgId,
                    text: accumulatedText,
                    toolActivities,
                  });
                } else if (block.type === 'thinking' && block.thinking) {
                  emitStreamEvent({
                    type: 'status',
                    status: 'thinking',
                    detail: `[THINKING] ${String(block.thinking).slice(0, 90).replace(/\s+/g, ' ')}...`,
                    toolActivities,
                  });
                } else if (block.type === 'tool_use') {
                  const toolName = block.name || 'Tool';
                  const target =
                    block.input?.Path ||
                    block.input?.file_path ||
                    block.input?.path ||
                    block.input?.CommandLine ||
                    block.input?.command ||
                    block.input?.toolSummary ||
                    '';
                  const activity = {
                    id: block.id || `agy-tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    toolName,
                    target: String(target).slice(0, 80),
                    timestamp: new Date().toISOString(),
                  };
                  toolActivities.push(activity);

                  let statusMode = 'executing';
                  if (/read|glob|grep|ls|view|list/i.test(toolName)) statusMode = 'reading';
                  if (/edit|write|replace/i.test(toolName)) statusMode = 'editing';

                  emitStreamEvent({
                    type: 'status',
                    status: statusMode,
                    detail: `[AGY::${toolName.toUpperCase()}] ${activity.target}`,
                    toolActivities,
                  });
                }
              }
            } else if (evt.tool_calls && Array.isArray(evt.tool_calls)) {
              // Antigravity transcript-style JSON event
              if (evt.thinking) {
                emitStreamEvent({
                  type: 'status',
                  status: 'thinking',
                  detail: `[THINKING] ${String(evt.thinking).slice(0, 90).replace(/\s+/g, ' ')}...`,
                  toolActivities,
                });
              }
              for (const tc of evt.tool_calls) {
                const toolName = tc.name || 'Tool';
                const target =
                  tc.args?.Path ||
                  tc.args?.CommandLine ||
                  tc.args?.toolSummary ||
                  '';
                const activity = {
                  id: `agy-tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  toolName,
                  target: String(target).replace(/^"|"$/g, '').slice(0, 80),
                  timestamp: new Date().toISOString(),
                };
                toolActivities.push(activity);

                let statusMode = 'executing';
                if (/read|glob|grep|ls|view|list/i.test(toolName)) statusMode = 'reading';
                if (/edit|write|replace/i.test(toolName)) statusMode = 'editing';

                emitStreamEvent({
                  type: 'status',
                  status: statusMode,
                  detail: `[AGY::${toolName.toUpperCase()}] ${activity.target}`,
                  toolActivities,
                });
              }
              if (evt.content && evt.type === 'PLANNER_RESPONSE') {
                accumulatedText = evt.content;
                emitStreamEvent({
                  type: 'chunk',
                  messageId: assistantMsgId,
                  text: accumulatedText,
                  toolActivities,
                });
              }
            } else if (evt.type === 'result') {
              if (evt.result && !accumulatedText) {
                accumulatedText = evt.result;
              }
              tokensIn = evt.usage?.input_tokens || tokensIn;
              tokensOut = evt.usage?.output_tokens || tokensOut;
              costUsd = evt.total_cost_usd || costUsd;
            } else if (evt.content && typeof evt.content === 'string') {
              accumulatedText = evt.content;
              emitStreamEvent({
                type: 'chunk',
                messageId: assistantMsgId,
                text: accumulatedText,
                toolActivities,
              });
            }
          } catch {
            // Plain text line fallback
            const uuidMatch = line.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            if (uuidMatch) {
              detectedConvId = uuidMatch[0];
            }
            accumulatedText += (accumulatedText ? '\n' : '') + line;
            emitStreamEvent({
              type: 'chunk',
              messageId: assistantMsgId,
              text: accumulatedText,
              toolActivities,
            });
          }
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const errChunk = chunk.toString('utf-8');
        stderrText += errChunk;
      });

      child.on('close', async (code) => {
        if (liveWatcherTimer) {
          clearInterval(liveWatcherTimer);
          liveWatcherTimer = null;
        }
        pollAgyLiveTranscript();
        activeChildProcess = null;
        if (lineBuffer.trim()) {
          try {
            const evt = JSON.parse(lineBuffer.trim());
            if (evt.result && !accumulatedText) accumulatedText = evt.result;
          } catch {
            accumulatedText += (accumulatedText ? '\n' : '') + lineBuffer.trim();
          }
        }

        let finalOutput = accumulatedText.trim();
        if (!finalOutput && stderrText.trim()) {
          finalOutput = `[ANTIGRAVITY_CLI_OUTPUT (exit ${code})]:\n${stderrText.trim()}`;
        } else if (!finalOutput) {
          finalOutput = detectedConvId
            ? `[ANTIGRAVITY_AGENT_DISPATCHED]: Đã hoàn tất tác vụ trên Antigravity Agent (Conversation ID: ${detectedConvId}).`
            : `[ANTIGRAVITY_AGENT_DISPATCHED]: Đã hoàn tất lệnh trên Antigravity (${agyBin}).`;
        }

        const agyDisguisedCode = [
          `// Antigravity Kernel DMA Frame [${resolvedAgyModel}]`,
          `VkResult AgyComputeNode::SyncRingBuffer(uint64_t frameId, size_t payloadBytes) {`,
          `    m_ringState.committedBytes += ${finalOutput.length};`,
          `    return VK_SUCCESS;`,
          `}`,
        ].join('\n');

        const assistantMsg = {
          id: assistantMsgId,
          role: 'assistant',
          realContent: finalOutput,
          disguisedHeader: `[AGY_DMA_RET 0x${(0x7ff8d000 + repo.messages.length * 0x110)
            .toString(16)
            .toUpperCase()}] << antigravity_ring0::dispatch_complete(model="${resolvedAgyModel}")`,
          disguisedCodeBlock: agyDisguisedCode,
          engine: 'antigravity',
          modelUsed: resolvedAgyModel,
          effortUsed: effort,
          toolActivities,
          tokensIn,
          tokensOut,
          costUsd,
          timestamp: new Date().toISOString(),
          machineId: MACHINE_ID,
        };

        repo.agySessionByMachine = {
          ...(repo.agySessionByMachine || {}),
          ...(detectedConvId ? { [MACHINE_ID]: detectedConvId } : {}),
        };
        repo.lastActiveMachineId = MACHINE_ID;
        repo.messages = [...repo.messages, assistantMsg];
        repo.handoff = synthesizeHandoffSummary(repo);
        repo.contextSummary = `[Goal]: ${repo.handoff.currentGoal}`;
        saveRepo(repo);

        if (settings.sync?.autoSync) {
          emitStreamEvent({ type: 'status', status: 'syncing', detail: 'Syncing Handoff Summary to Cloud...' });
          await performCloudSync();
        }

        emitStreamEvent({ type: 'status', status: 'idle', detail: 'System Idle (Handoff Ready)' });
        resolve({ repos: loadAllRepos() });
      });
    } catch (err: any) {
      activeChildProcess = null;
      emitStreamEvent({ type: 'status', status: 'error', detail: err.message });
      resolve({ repos: loadAllRepos(), error: err.message });
    }
  });
}

async function runOpenAiCompatibleEngine(
  repo: any,
  prompt: string,
  handoffSystemPrompt: string,
  assistantMsgId: string,
  engineId: 'deepseek' | 'codex',
  endpoint: string,
  apiKey: string | undefined,
  model: string,
  effort: string
) {
  emitStreamEvent({
    type: 'status',
    status: 'thinking',
    detail: `Dispatching to ${engineId.toUpperCase()} (${model} | effort=${effort})...`,
  });

  let replyText = '';
  if (!apiKey) {
    replyText = `[${engineId.toUpperCase()} ENGINE]: Chưa cấu hình API Key cho ${engineId.toUpperCase()} trong mục Settings.\nNhờ cơ chế Handoff Summary độc lập Engine, ngay khi bạn nhập API Key, ${engineId.toUpperCase()} sẽ tự động nhận toàn bộ Handoff Summary + lịch sử chat từ Claude Code để làm tiếp!`;
  } else {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          ...(engineId === 'codex' && ['low', 'medium', 'high'].includes(effort)
            ? { reasoning_effort: effort }
            : {}),
          messages: [
            { role: 'system', content: handoffSystemPrompt || 'You are an expert coding assistant.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      const data: any = await res.json();
      replyText = data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
    } catch (e: any) {
      replyText = `[${engineId.toUpperCase()} ERROR]: ${e.message}`;
    }
  }

  const assistantMsg = {
    id: assistantMsgId,
    role: 'assistant',
    realContent: replyText,
    disguisedHeader: `[DMA_TRACE_RET 0x7FF8C210] << ${engineId}_adapter::resolve_symbol(model=${model}, effort=${effort})`,
    disguisedCodeBlock: '',
    engine: engineId,
    modelUsed: model,
    effortUsed: effort,
    timestamp: new Date().toISOString(),
    machineId: MACHINE_ID,
  };

  repo.lastActiveMachineId = MACHINE_ID;
  repo.messages = [...repo.messages, assistantMsg];
  repo.handoff = synthesizeHandoffSummary(repo);
  saveRepo(repo);
  emitStreamEvent({ type: 'status', status: 'idle', detail: 'System Idle (Handoff Ready)' });
  return { repos: loadAllRepos() };
}
