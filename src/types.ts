export type AppLanguage = 'vi' | 'en';

export type EngineType = 'claude-code' | 'antigravity' | 'codex' | 'deepseek';

export type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export type StealthThemeMode = 'kernel-log' | 'ide-comment';

export type ContinuityStrategy = 'smart-handoff' | 'always-handoff';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'reading'
  | 'editing'
  | 'executing'
  | 'syncing'
  | 'error';

export interface ToolActivity {
  id: string;
  toolName: string;
  target?: string;
  detail?: string;
  timestamp: string;
}

export interface ThoughtEntry {
  id: string;
  text: string;
  timestamp: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  filePath: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  previewDataUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  realContent: string;
  disguisedHeader: string;
  disguisedCodeBlock: string;
  engine: EngineType;
  modelUsed?: string;
  effortUsed?: EffortLevel;
  attachments?: ChatAttachment[];
  timestamp: string;
  machineId: string;
  toolActivities?: ToolActivity[];
  thoughts?: ThoughtEntry[];
  tokensIn?: number;
  tokensOut?: number;
  contextTokens?: number;
  costUsd?: number;
}

export interface HandoffSummary {
  currentGoal: string;
  recentProgress: string;
  touchedFiles: string[];
  nextSteps: string;
  updatedAt: string;
  sourceMachineId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  handoff?: HandoffSummary;
  sessionByMachine?: Record<string, string>;
  agySessionByMachine?: Record<string, string>;
  lastActiveMachineId?: string;
}

export interface RepoProfile {
  id: string;
  name: string;
  localPath: string;
  localPathsByMachine?: Record<string, string>;
  gitRemote?: string;
  branch?: string;
  activeSessionId?: string;
  sessions?: ChatSession[];
  sessionByMachine?: Record<string, string>;
  agySessionByMachine?: Record<string, string>;
  lastActiveMachineId?: string;
  lastUpdated: string;
  contextSummary: string;
  handoff?: HandoffSummary;
  messages: ChatMessage[];
}

export type GDriveAuthMethod = 'token' | 'oauth-browser' | 'service-account';

export interface SyncConfig {
  mode: 'folder' | 'gdrive-api' | 'git-repo' | 'both';
  localSyncFolderPath: string;
  gdriveAuthMethod?: GDriveAuthMethod;
  gdriveClientId?: string;
  gdriveClientSecret?: string;
  gdriveAccessToken?: string;
  gdriveRefreshToken?: string;
  gdriveTokenExpiry?: number;
  gdriveServiceAccountJson?: string;
  gdriveFolderName?: string;
  gdriveFolderId?: string;
  gdriveFolderWebUrl?: string;
  gdriveConnectedEmail?: string;
  encryptionPassphrase?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface EngineConfig {
  activeEngine: EngineType;
  claudeCliPath: string;
  claudeModel: string;
  claudeApiKey?: string;
  antigravityCliPath: string;
  antigravityModel: string;
  antigravityApiKey?: string;
  effortLevel: EffortLevel;
  skipPermissions: boolean;
  continuityStrategy: ContinuityStrategy;
  recentTurnsCount: number;
  codexCliPath?: string;
  codexApiKey?: string;
  codexModel: string;
  deepseekApiKey?: string;
  deepseekModel: string;
  autoApproveRead: boolean;
  autoApproveEdit: boolean;
}

export interface EngineScanItem {
  engine: EngineType;
  name: string;
  found: boolean;
  binaryPath: string;
  version?: string;
  authenticated: boolean;
  authMethod?: string;
  authDetail: string;
  canBrowseBinary: boolean;
  loginCommand?: string;
}

export interface AdminAuthPublicInfo {
  username: string;
  isDefaultPassword?: boolean;
}

export interface HotkeyConfig {
  holdPeekKey: string;
  toggleAppVisibility: string;
  toggleWidgetMode: string;
  quitApp: string;
  toggleWatchBuf: string;
  toggleHandoff: string;
  triggerSync: string;
}

export interface AppSettings {
  language: AppLanguage;
  stealthMode: StealthThemeMode;
  cipherEnabled: boolean;
  cipherLanguage: 'rust-kernel' | 'cpp-vulkan' | 'asm-hex';
  autoStartOs: boolean;
  alwaysOnTop: boolean;
  peekWindowOpen: boolean;
  sync: SyncConfig;
  engine: EngineConfig;
  hotkeys?: HotkeyConfig;
  adminAuth?: AdminAuthPublicInfo;
}

export interface StandardStructureStatus {
  isStandard: boolean;
  hasHandoff: boolean;
  hasDecisions: boolean;
  hasDocs: boolean;
  hasTasks: boolean;
  hasOutputs: boolean;
  hasAgentsMd: boolean;
  hasClaudeMd: boolean;
  missing: string[];
}

declare global {
  interface Window {
    ndevApi?: any;
  }
}

