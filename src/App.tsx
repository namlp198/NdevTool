import React, { Component, ErrorInfo, ReactNode, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code2,
  CornerDownLeft,
  Cpu,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Lock,
  MessageSquare,
  Minimize2,
  Minus,
  Paperclip,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Shield,
  ShieldAlert,
  Square,
  Terminal,
  Trash2,
  Type,
  Unlock,
  UserCheck,
  X,
} from 'lucide-react';
import {
  AgentStatus,
  AppLanguage,
  AppSettings,
  ChatAttachment,
  ChatMessage,
  ChatSession,
  ContinuityStrategy,
  EffortLevel,
  EngineScanItem,
  EngineType,
  HandoffSummary,
  HotkeyConfig,
  RepoProfile,
  StandardStructureStatus,
  StealthThemeMode,
  ToolActivity,
  ThoughtEntry,
} from './types';
import {
  encodeToDisguisedCode,
  formatHoldKeyDisplay,
  generateDisguisedHeader,
  hashToHex,
  isHoldKeyMatch,
  normalizeKeyEventName,
} from './utils/cipherEngine';
import {
  localizeHandoffField,
  localizeMessageText,
  localizeStatusDetail,
  TRANSLATIONS,
} from './utils/i18n';
import {
  DEFAULT_TYPOGRAPHY,
  applyTypographySettings,
  getFontFamilyCSS,
  getFontSizePixels,
  getFontWeightValue,
  getLineHeightValue,
  getStyleVariantProperties,
} from './utils/typography';
import { FloatingCornerWidget } from './components/FloatingCornerWidget';
import { PeekInspectorWindow } from './components/PeekInspectorWindow';
import { StructuredMessage, ThoughtsList } from './components/RichMessage';

const DEFAULT_HOTKEYS: HotkeyConfig = {
  holdPeekKey: 'Alt',
  toggleAppVisibility: 'CommandOrControl+Shift+A',
  toggleWidgetMode: 'CommandOrControl+Shift+W',
  quitApp: 'CommandOrControl+Shift+Q',
  toggleWatchBuf: 'CommandOrControl+Shift+P',
  toggleHandoff: 'CommandOrControl+Shift+H',
  triggerSync: 'CommandOrControl+Shift+S',
};

type ProtectedActionTarget = 'settings' | 'watch-buf' | 'handoff' | 'sync';

// Context window size per model id ('[1m]' suffix or Gemini = 1M-token variant)
function getContextWindow(model?: string): number {
  const m = (model || '').toLowerCase();
  if (/gemini/i.test(m)) return 1_000_000;
  if (/\[1m\]|1m/i.test(m)) return 1_000_000;
  if (/deepseek/i.test(m)) return 128_000;
  return 200_000;
}

// Circular context-usage gauge: green < 60%, amber < 85%, red above
function UsageRing({
  used,
  limit,
  revealed,
  title,
  label,
  onClick,
}: {
  used: number;
  limit: number;
  revealed: boolean;
  title: string;
  label?: string;
  onClick?: () => void;
}) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const pct = Math.round(ratio * 100);
  const color = ratio < 0.6 ? '#22c55e' : ratio < 0.85 ? '#f59e0b' : '#ef4444';
  const r = 7;
  const c = 2 * Math.PI * r;
  return (
    <span
      className={`inline-flex items-center gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      title={title}
      onClick={onClick}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
        <circle cx="9" cy="9" r={r} fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <circle
          cx="9"
          cy="9"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
        />
      </svg>
      {revealed && (
        <span className="font-semibold tabular-nums" style={{ color }}>
          {label ? `${label} ` : ''}
          {pct}%
        </span>
      )}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function formatResetTime(isoStr?: string | null, isWeekly: boolean = false): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    if (isWeekly) {
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `Resets ${day} ${time}`;
    } else {
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `Resets at ${time}`;
    }
  } catch {
    return '';
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NdevTool UI ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded border border-red-500/50 bg-[#0a0507] text-red-300 font-mono text-xs space-y-2 m-4 shadow-2xl">
          <div className="font-bold flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            {this.props.fallbackTitle || 'A rendering error occurred in this module'}
          </div>
          <div className="text-[11px] text-slate-300 break-words font-mono bg-black/60 p-2 rounded">
            {this.state.error?.message || String(this.state.error)}
          </div>
          {this.props.onReset && (
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                this.props.onReset?.();
              }}
              className="px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 text-xs font-semibold"
            >
              Close / Recover
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  const [isPeekRoute, setIsPeekRoute] = useState(window.location.hash === '#peek');
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'vi',
    stealthMode: 'kernel-log',
    cipherEnabled: true,
    cipherLanguage: 'rust-kernel',
    autoStartOs: false,
    alwaysOnTop: true,
    peekWindowOpen: false,
    hotkeys: { ...DEFAULT_HOTKEYS },
    typography: { ...DEFAULT_TYPOGRAPHY },
    adminAuth: {
      username: 'admin',
      isDefaultPassword: true,
    },
    sync: {
      mode: 'both',
      localSyncFolderPath: '',
      autoSync: true,
      encryptionPassphrase: '',
    },
    engine: {
      activeEngine: 'claude-code',
      claudeCliPath: 'claude',
      claudeModel: 'claude-sonnet-5-5',
      antigravityCliPath: 'agentapi',
      antigravityModel: 'Gemini 4 Argon',
      effortLevel: 'medium',
      skipPermissions: true,
      continuityStrategy: 'smart-handoff',
      recentTurnsCount: 6,
      codexModel: 'o3-mini',
      deepseekModel: 'deepseek-chat',
      autoApproveRead: true,
      autoApproveEdit: true,
    },
  });

  const [repos, setRepos] = useState<RepoProfile[]>([]);
  const [activeRepoId, setActiveRepoId] = useState<string>('');
  const [expandedRepoIds, setExpandedRepoIds] = useState<Record<string, boolean>>({});
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');
  const [machineId, setMachineId] = useState<string>('LOCAL_NODE');

  // Cipher / Input / Attachment states
  const [realInput, setRealInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isDragOverInput, setIsDragOverInput] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [planUsage, setPlanUsage] = useState<any>(null);
  const [showPlanUsagePopup, setShowPlanUsagePopup] = useState(false);
  const planUsagePopupRef = useRef<HTMLDivElement>(null);
  const [peekWindowOpen, setPeekWindowOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Modals (Settings, WATCH_BUF click, and HANDOFF click are gated by Super Admin Login; hotkeys bypass login)
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [pendingProtectedTarget, setPendingProtectedTarget] =
    useState<ProtectedActionTarget | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [showMainSendConfirmModal, setShowMainSendConfirmModal] = useState(false);
  const [previewImageAttachment, setPreviewImageAttachment] = useState<ChatAttachment | null>(
    null
  );
  const [standardStatus, setStandardStatus] = useState<StandardStructureStatus | null>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);

  // Live Engine status & streaming states
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');

  // Plan limits: refresh on mount, every 5 minutes, and after each finished turn
  useEffect(() => {
    if (agentStatus !== 'idle') return;
    let cancelled = false;
    const load = () =>
      window.ndevApi?.getPlanUsage?.().then((u: any) => {
        if (!cancelled) setPlanUsage(u?.ok ? u : null);
      });
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [agentStatus]);

  // Click outside & Escape listener for Plan Usage Popover
  useEffect(() => {
    if (!showPlanUsagePopup) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        planUsagePopupRef.current &&
        !planUsagePopupRef.current.contains(e.target as Node)
      ) {
        setShowPlanUsagePopup(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPlanUsagePopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPlanUsagePopup]);
  const [statusDetail, setStatusDetail] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [liveTools, setLiveTools] = useState<ToolActivity[]>([]);
  const [liveThoughts, setLiveThoughts] = useState<ThoughtEntry[]>([]);
  const [syncBadgeState, setSyncBadgeState] = useState<{
    type: 'idle' | 'syncing' | 'ok' | 'unconfigured' | 'error';
    count?: number;
  }>({ type: 'idle' });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const confirmSendBtnRef = useRef<HTMLButtonElement>(null);
  const cloudSyncRef = useRef<() => Promise<void>>(async () => {});
  const sendPromptRef = useRef<() => Promise<void>>(async () => {});

  const lang: AppLanguage = settings.language || 'vi';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  // Helper to require Super Admin login when clicking Settings, WATCH_BUF, HANDOFF, or SYNC without hotkeys
  const requestProtectedAction = (target: ProtectedActionTarget) => {
    if (target === 'settings') setShowSettingsModal(false);
    setPendingProtectedTarget(target);
    setShowAdminLoginModal(true);
  };

  const requestOpenSettings = () => requestProtectedAction('settings');

  useEffect(() => {
    const onHash = () => setIsPeekRoute(window.location.hash === '#peek');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (showMainSendConfirmModal) {
      requestAnimationFrame(() => {
        confirmSendBtnRef.current?.focus();
      });
    }
  }, [showMainSendConfirmModal]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMainSendConfirmModal) {
        e.preventDefault();
        setShowMainSendConfirmModal(false);
        hiddenTextareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showMainSendConfirmModal]);

  useEffect(() => {
    applyTypographySettings(settings.typography);
  }, [settings.typography]);

  useEffect(() => {
    if (isPeekRoute) return;
    if (window.ndevApi) {
      window.ndevApi.getInitialState().then((init: any) => {
        if (init.settings) {
          setSettings({ language: 'vi', ...init.settings });
          if (init.settings.typography) applyTypographySettings(init.settings.typography);
        }
        if (init.repos && init.repos.length > 0) {
          setRepos(init.repos);
          setActiveRepoId(init.repos[0].id);
          const initExpanded: Record<string, boolean> = {};
          init.repos.forEach((r: RepoProfile, i: number) => {
            initExpanded[r.id] = i === 0;
          });
          setExpandedRepoIds(initExpanded);
        }
        if (init.machineId) setMachineId(init.machineId);
        if (init.isWidgetMode !== undefined) setIsWidgetMode(init.isWidgetMode);
      });

      window.ndevApi.isWindowMaximized?.().then((max: boolean) => {
        setIsMaximized(Boolean(max));
      });

      const unsubMaxState = window.ndevApi.onWindowMaximizedState?.((max: boolean) => {
        setIsMaximized(Boolean(max));
      });

      const unsubStream = window.ndevApi.onStreamEvent((evt: any) => {
        if (evt.type === 'status') {
          setAgentStatus(evt.status);
          if (evt.detail) setStatusDetail(evt.detail);
          if (evt.toolActivities) setLiveTools([...evt.toolActivities]);
          if (evt.thoughts) setLiveThoughts([...evt.thoughts]);
        } else if (evt.type === 'chunk') {
          setStreamingText(evt.text || '');
          if (evt.toolActivities) setLiveTools([...evt.toolActivities]);
        }
      });

      const unsubWidget = window.ndevApi.onWidgetModeChanged((mode: boolean) => {
        setIsWidgetMode(mode);
      });

      const unsubPeek = window.ndevApi.onPeekWindowState((open: boolean) => {
        setPeekWindowOpen(open);
      });

      const unsubSettings = window.ndevApi.onSettingsUpdated?.((nextSettings: AppSettings) => {
        if (nextSettings) {
          setSettings((prev) => ({ ...prev, ...nextSettings }));
        }
      });

      const unsubHotkey = window.ndevApi.onHotkeyAction?.((action: string) => {
        if (action === 'toggle-handoff') {
          // Pressing the secret HANDOFF hotkey opens/toggles HANDOFF directly without login
          setShowHandoffModal((prev) => !prev);
        } else if (action === 'trigger-sync') {
          // Pressing the secret SYNC hotkey triggers Cloud Sync directly without login
          cloudSyncRef.current();
        }
      });

      const unsubPeekInput = window.ndevApi.onPeekInputUpdated?.((nextText: string) => {
        setRealInput(nextText);
      });

      const unsubPeekSend = window.ndevApi.onPeekTriggerSend?.(() => {
        sendPromptRef.current();
      });

      return () => {
        unsubStream?.();
        unsubWidget?.();
        unsubMaxState?.();
        unsubPeek?.();
        unsubSettings?.();
        unsubHotkey?.();
        unsubPeekInput?.();
        unsubPeekSend?.();
      };
    }
  }, [isPeekRoute]);

  const configuredHoldKey = settings.hotkeys?.holdPeekKey || DEFAULT_HOTKEYS.holdPeekKey || 'Alt';
  const configuredHoldKeyDisplay = formatHoldKeyDisplay(configuredHoldKey);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHoldKeyMatch(e, configuredHoldKey, 'down')) {
        if (configuredHoldKey.toLowerCase() === 'alt') {
          e.preventDefault();
        }
        setIsAltHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isHoldKeyMatch(e, configuredHoldKey, 'up')) {
        setIsAltHeld(false);
      }
    };
    const handleBlur = () => setIsAltHeld(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [configuredHoldKey]);

  const activeRepo = repos.find((r) => r.id === activeRepoId) || repos[0];

  useEffect(() => {
    if (!activeRepo?.localPath || !window.ndevApi?.checkStandardStructure) {
      setStandardStatus(null);
      return;
    }
    window.ndevApi.checkStandardStructure(activeRepo.localPath).then((st: any) => {
      setStandardStatus(st);
    });
  }, [activeRepo?.localPath, activeRepo?.id]);

  const handleScaffoldStandard = async () => {
    if (!activeRepo?.localPath || !window.ndevApi?.scaffoldStandardStructure) return;
    setIsScaffolding(true);
    try {
      const res = await window.ndevApi.scaffoldStandardStructure(
        activeRepo.localPath,
        activeRepo.name,
        activeRepo.branch
      );
      if (res?.status) {
        setStandardStatus(res.status);
      }
      const diskHandoff = await window.ndevApi.readRepoHandoffDisk(activeRepo.localPath);
      if (diskHandoff) {
        const updatedRepos = await window.ndevApi.saveRepoData({
          ...activeRepo,
          handoff: diskHandoff,
        });
        if (updatedRepos) setRepos(updatedRepos);
      }
    } catch (err) {
      console.error('Failed to scaffold standard structure:', err);
    } finally {
      setIsScaffolding(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (activeRepo?.messages) {
      window.ndevApi?.syncLiveBuffer({
        realText: realInput,
        disguisedText: encodeToDisguisedCode(
          realInput,
          settings.cipherLanguage,
          activeRepo.messages.length
        ),
        cursorIndex: realInput.length,
        language: lang,
        cipherLanguage: settings.cipherLanguage,
        attachments: pendingAttachments,
        recentMessages: activeRepo.messages.slice(-6),
      });
    }
  }, [activeRepo?.messages, streamingText, lang, settings.cipherLanguage, pendingAttachments]);

  const handleRealInputChange = (val: string) => {
    setRealInput(val);
    const disguised = encodeToDisguisedCode(
      val,
      settings.cipherLanguage,
      activeRepo?.messages.length || 0
    );
    window.ndevApi?.syncLiveBuffer({
      realText: val,
      disguisedText: disguised,
      cursorIndex: val.length,
      language: lang,
      cipherLanguage: settings.cipherLanguage,
      attachments: pendingAttachments,
      recentMessages: activeRepo?.messages?.slice(-6) || [],
    });
  };

  // Handle Ctrl+V paste of images (screenshots, copied images) or files into the chat box
  const handlePasteInChat = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!window.ndevApi) return;
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items || []);
    const files = Array.from(clipboardData.files || []);

    // Check if there are any image items or file items in the clipboard
    const fileItems = items.filter((it) => it.kind === 'file');
    if (fileItems.length === 0 && files.length === 0) {
      return; // Normal text paste
    }

    // Prevent default only if no plain text or if pasting image/files
    const hasPlainText = clipboardData.getData('text/plain');
    if (!hasPlainText || fileItems.some((it) => it.type.startsWith('image/'))) {
      e.preventDefault();
    }

    const newAttachments: ChatAttachment[] = [];
    const localPathsToAttach: string[] = [];

    for (const f of files) {
      const localPath = window.ndevApi.getFilePath?.(f);
      if (localPath) {
        localPathsToAttach.push(localPath);
      } else {
        // In-memory clipboard blob (e.g. screenshot from Snipping Tool / PrintScreen)
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(f);
        });
        if (dataUrl) {
          const saved = await window.ndevApi.saveClipboardAttachment({
            name: f.name || `paste_${Date.now()}.png`,
            mimeType: f.type || 'image/png',
            dataBase64: dataUrl,
          });
          if (saved) newAttachments.push(saved);
        }
      }
    }

    if (files.length === 0 && fileItems.length > 0) {
      for (const item of fileItems) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const localPath = window.ndevApi.getFilePath?.(blob);
        if (localPath) {
          localPathsToAttach.push(localPath);
        } else {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            const saved = await window.ndevApi.saveClipboardAttachment({
              name: blob.name || `paste_${Date.now()}.png`,
              mimeType: blob.type || item.type || 'image/png',
              dataBase64: dataUrl,
            });
            if (saved) newAttachments.push(saved);
          }
        }
      }
    }

    if (localPathsToAttach.length > 0) {
      const attachedFromDisk = await window.ndevApi.attachLocalFiles(localPathsToAttach);
      if (Array.isArray(attachedFromDisk)) {
        newAttachments.push(...attachedFromDisk);
      }
    }

    if (newAttachments.length > 0) {
      setPendingAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  // Handle Drag & Drop of images/files onto the chat input
  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverInput(false);
    if (!window.ndevApi) return;

    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    if (droppedFiles.length === 0) return;

    const localPaths: string[] = [];
    const newAttachments: ChatAttachment[] = [];

    for (const f of droppedFiles) {
      const p = window.ndevApi.getFilePath?.(f);
      if (p) {
        localPaths.push(p);
      } else {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(f);
        });
        if (dataUrl) {
          const saved = await window.ndevApi.saveClipboardAttachment({
            name: f.name,
            mimeType: f.type || 'application/octet-stream',
            dataBase64: dataUrl,
          });
          if (saved) newAttachments.push(saved);
        }
      }
    }

    if (localPaths.length > 0) {
      const fromDisk = await window.ndevApi.attachLocalFiles(localPaths);
      if (Array.isArray(fromDisk)) {
        newAttachments.push(...fromDisk);
      }
    }

    if (newAttachments.length > 0) {
      setPendingAttachments((prev) => [...prev, ...newAttachments]);
      hiddenTextareaRef.current?.focus();
    }
  };

  const handlePickAttachmentsDialog = async () => {
    if (!window.ndevApi?.selectChatAttachments) return;
    const picked = await window.ndevApi.selectChatAttachments();
    if (Array.isArray(picked) && picked.length > 0) {
      setPendingAttachments((prev) => [...prev, ...picked]);
      hiddenTextareaRef.current?.focus();
    }
  };

  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleRequestSendPrompt = () => {
    const trimmed = realInput.trim();
    if ((!trimmed && pendingAttachments.length === 0) || !activeRepo || agentStatus !== 'idle') {
      return;
    }
    setShowMainSendConfirmModal(true);
  };

  const executeSendPrompt = async () => {
    setShowMainSendConfirmModal(false);
    const trimmed = realInput.trim();
    if ((!trimmed && pendingAttachments.length === 0) || !activeRepo || agentStatus !== 'idle') {
      return;
    }

    const finalPromptText = trimmed || t.defaultAttachmentPrompt;
    const attachmentsToSend = [...pendingAttachments];
    const msgIndex = activeRepo.messages.length + 1;
    const nowIso = new Date().toISOString();
    const disguisedHeader = generateDisguisedHeader('user', msgIndex, nowIso);
    const disguisedCodeBlock = encodeToDisguisedCode(
      finalPromptText,
      settings.cipherLanguage,
      msgIndex
    );

    setRealInput('');
    setPendingAttachments([]);
    window.ndevApi?.syncLiveBuffer({
      realText: '',
      disguisedText: '',
      cursorIndex: 0,
      language: lang,
      attachments: [],
      recentMessages: activeRepo.messages.slice(-6),
    });
    setStreamingText('');
    setLiveTools([]);
    setLiveThoughts([]);
    setAgentStatus('thinking');

    const activeEng = settings.engine.activeEngine;
    const currentModel =
      activeEng === 'claude-code'
        ? settings.engine.claudeModel || 'claude-sonnet-5-5'
        : activeEng === 'antigravity'
        ? settings.engine.antigravityModel || 'Gemini 4 Argon'
        : activeEng === 'deepseek'
        ? settings.engine.deepseekModel || 'deepseek-chat'
        : settings.engine.codexModel || 'o3-mini';
    const currentEffort = settings.engine.effortLevel || 'medium';
    const skipPerms = settings.engine.skipPermissions !== false;

    if (window.ndevApi) {
      const res = await window.ndevApi.sendEnginePrompt({
        repoId: activeRepo.id,
        sessionId: activeRepo.activeSessionId,
        prompt: finalPromptText,
        disguisedHeader,
        disguisedCodeBlock,
        attachments: attachmentsToSend,
        modelOverride: currentModel,
        effortOverride: currentEffort,
        skipPermissionsOverride: skipPerms,
      });
      if (res?.repos) {
        setRepos(res.repos);
      }
      setStreamingText('');
      setLiveTools([]);
      setLiveThoughts([]);
      setAgentStatus('idle');
      hiddenTextareaRef.current?.focus();
    }
  };

  sendPromptRef.current = executeSendPrompt;

  const handleUpdateSettings = async (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    if (patch.typography) {
      applyTypographySettings(updated.typography);
    }
    const saved = await window.ndevApi?.saveSettings(updated);
    if (saved) {
      setSettings(saved);
      if (saved.typography) applyTypographySettings(saved.typography);
    }
    window.ndevApi?.syncLiveBuffer({
      realText: realInput,
      disguisedText: encodeToDisguisedCode(
        realInput,
        updated.cipherLanguage,
        activeRepo?.messages.length || 0
      ),
      cursorIndex: realInput.length,
      language: updated.language || lang,
      attachments: pendingAttachments,
      recentMessages: activeRepo?.messages?.slice(-6) || [],
    });
  };

  const handleCloudSync = async () => {
    setSyncBadgeState({ type: 'syncing' });
    if (window.ndevApi) {
      const res = await window.ndevApi.triggerCloudSync();
      if (res?.repos) setRepos(res.repos);
      if (res?.settings) setSettings(res.settings);
      if (res?.status === 'unconfigured') {
        setSyncBadgeState({ type: 'unconfigured' });
        setStatusDetail(res.error || t.syncUnconfiguredDetail);
        requestOpenSettings();
        setTimeout(() => setSyncBadgeState({ type: 'idle' }), 5000);
      } else if (res?.status === 'error') {
        setSyncBadgeState({ type: 'error' });
        setStatusDetail(res.error || t.syncErrorDetail);
        setTimeout(() => setSyncBadgeState({ type: 'idle' }), 6000);
      } else {
        setSyncBadgeState({ type: 'ok', count: res?.syncedCount ?? 0 });
        if (res?.targetDescription) {
          setStatusDetail(`${t.syncedToPrefix} ${res.targetDescription}`);
        }
        setTimeout(() => setSyncBadgeState({ type: 'idle' }), 4000);
      }
    }
  };

  const handleResetAndHandoff = async () => {
    if (!activeRepo || !window.ndevApi) return;
    const updatedRepos = await window.ndevApi.resetMachineSessionWithHandoff(
      activeRepo.id,
      activeRepo.activeSessionId
    );
    if (updatedRepos) {
      setRepos(updatedRepos);
      setStatusDetail(t.newHandoffPreparedStatus);
    }
  };

  const handleCreateChatSession = async (repoId: string, withHandoff = false) => {
    if (!window.ndevApi?.createChatSession) return;
    const updatedRepos = await window.ndevApi.createChatSession({ repoId, withHandoff });
    if (Array.isArray(updatedRepos)) {
      setRepos(updatedRepos);
      setActiveRepoId(repoId);
      setExpandedRepoIds((prev) => ({ ...prev, [repoId]: true }));
    }
  };

  const handleSelectChatSession = async (repoId: string, sessionId: string) => {
    setActiveRepoId(repoId);
    setExpandedRepoIds((prev) => ({ ...prev, [repoId]: true }));
    if (!window.ndevApi?.selectChatSession) return;
    const updatedRepos = await window.ndevApi.selectChatSession({ repoId, sessionId });
    if (Array.isArray(updatedRepos)) {
      setRepos(updatedRepos);
    }
  };

  const handleRenameChatSession = async (repoId: string, sessionId: string, title: string) => {
    setEditingSessionId(null);
    const trimmed = title.trim();
    if (!trimmed || !window.ndevApi?.renameChatSession) return;
    const updatedRepos = await window.ndevApi.renameChatSession({
      repoId,
      sessionId,
      title: trimmed,
    });
    if (Array.isArray(updatedRepos)) {
      setRepos(updatedRepos);
    }
  };

  const handleDeleteChatSession = async (repoId: string, sessionId: string) => {
    if (!window.ndevApi?.deleteChatSession) return;
    const updatedRepos = await window.ndevApi.deleteChatSession({ repoId, sessionId });
    if (Array.isArray(updatedRepos)) {
      setRepos(updatedRepos);
    }
  };

  cloudSyncRef.current = handleCloudSync;

  const handleSaveCustomHandoff = async (nextHandoff: HandoffSummary) => {
    if (!activeRepo || !window.ndevApi) return;
    const updatedRepo: RepoProfile = {
      ...activeRepo,
      handoff: nextHandoff,
      contextSummary: `[Goal]: ${nextHandoff.currentGoal}`,
    };
    const updatedRepos = await window.ndevApi.saveRepoData(updatedRepo);
    if (updatedRepos) setRepos(updatedRepos);
    // Explicit user save: the only place latest.md is written to the repo working tree
    if (activeRepo.localPath) {
      await window.ndevApi.writeRepoHandoffDisk?.(activeRepo.localPath, nextHandoff, activeRepo.branch);
    }
    setShowHandoffModal(false);
  };

  const handleAddRepo = async () => {
    if (!window.ndevApi) return;
    const updatedRepos = await window.ndevApi.selectRepoFolder();
    if (updatedRepos && updatedRepos.length > 0) {
      setRepos(updatedRepos);
      setActiveRepoId(updatedRepos[0].id);
      setExpandedRepoIds((prev) => ({ ...prev, [updatedRepos[0].id]: true }));
    }
  };

  if (isPeekRoute) {
    return <PeekInspectorWindow />;
  }

  if (isWidgetMode) {
    return (
      <FloatingCornerWidget
        status={agentStatus}
        language={lang}
        onExpand={() => window.ndevApi?.setWidgetMode(false)}
      />
    );
  }

  const disguisedLivePreview = encodeToDisguisedCode(
    realInput,
    settings.cipherLanguage,
    activeRepo?.messages.length || 0
  );

  const showPlainTextInInput = !settings.cipherEnabled || isAltHeld;
  const currentMachineSessionId =
    settings.engine.activeEngine === 'antigravity'
      ? activeRepo?.agySessionByMachine?.[machineId]
      : activeRepo?.sessionByMachine?.[machineId];

  const activeEng = settings.engine.activeEngine;
  const activeModelDisplay =
    activeEng === 'claude-code'
      ? settings.engine.claudeModel || 'claude-sonnet-5-5'
      : activeEng === 'antigravity'
      ? settings.engine.antigravityModel || 'Gemini 4 Argon'
      : activeEng === 'deepseek'
      ? settings.engine.deepseekModel || 'deepseek-chat'
      : settings.engine.codexModel || 'o3-mini';

  const syncButtonLabel =
    syncBadgeState.type === 'syncing'
      ? t.syncingStatus
      : syncBadgeState.type === 'ok'
      ? `${t.syncOkStatus} (${syncBadgeState.count ?? 0})`
      : syncBadgeState.type === 'unconfigured'
      ? t.syncUnconfiguredBadge
      : syncBadgeState.type === 'error'
      ? t.syncErrorBadge
      : t.syncBtn;

  const localizedStatusDetail = localizeStatusDetail(statusDetail, lang);
  const localizedAgentStatus = t.agentStatusLabels[agentStatus] || agentStatus.toUpperCase();

  return (
    <div className="w-screen h-screen bg-obsidian/95 border border-border rounded-lg flex flex-col overflow-hidden text-xs font-mono scanline shadow-2xl">
      {/* Top Stealth System Header */}
      <header className="min-h-[42px] py-1 bg-[#090d14] border-b border-border px-3.5 flex flex-wrap items-center justify-between gap-2 drag-region">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-matrix shadow-[0_0_8px_#00ff9c] shrink-0" />
          <span className="font-bold tracking-wider text-slate-200 text-[11px] whitespace-nowrap">
            {t.appTitle}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-mystic/15 text-mystic border border-mystic/30 truncate">
            {isAltHeld
              ? `${t.nodeLabel}: ${machineId}`
              : `IRQ_VEC: 0x${hashToHex(machineId, 8)}`}
          </span>
          {/* Read-only active Engine & Model badge (Disguised until Alt is held; configured inside Super Admin Settings) */}
          <button
            onClick={requestOpenSettings}
            title={isAltHeld ? t.switchEngineTooltip : 'MMU_PAGE_FAULT_HANDLER'}
            className="no-drag px-2 py-0.5 rounded bg-[#06090e] hover:bg-[#0d1520] border border-matrix/30 text-[10px] text-matrix font-semibold flex items-center gap-1 whitespace-nowrap"
          >
            <Cpu className="w-3 h-3 text-matrix shrink-0" />
            <span>
              {isAltHeld
                ? `${activeEng.toUpperCase()} :: ${activeModelDisplay}`
                : `RING0_MMU :: VK_PIPE_0x${hashToHex(activeEng + activeModelDisplay, 4)}`}
            </span>
          </button>
        </div>

        {/* Disguise & System Quick Controls (Language switcher moved inside Settings only) */}
        <div className="flex items-center gap-1.5 no-drag flex-wrap">
          <button
            onClick={() =>
              handleUpdateSettings({
                stealthMode:
                  settings.stealthMode === 'kernel-log' ? 'ide-comment' : 'kernel-log',
              })
            }
            className="px-2 py-1 rounded bg-[#0c131d] hover:bg-[#131e2e] border border-border text-[10px] text-cyber flex items-center gap-1 whitespace-nowrap"
            title={t.switchThemeTooltip}
          >
            <Code2 className="w-3 h-3" />
            {settings.stealthMode === 'kernel-log' ? t.themeKernelBtn : t.themeIdeBtn}
          </button>

          <button
            onClick={async () => {
              if (peekWindowOpen) {
                const open = await window.ndevApi?.togglePeekWindow(false);
                setPeekWindowOpen(Boolean(open));
              } else {
                // Clicking WATCH_BUF without the secret hotkey requires Super Admin login
                requestProtectedAction('watch-buf');
              }
            }}
            className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition-colors whitespace-nowrap ${
              peekWindowOpen
                ? 'bg-mystic/20 border-mystic text-mystic'
                : 'bg-[#0c131d] border-border text-slate-300 hover:text-white'
            }`}
            title={t.watchBufTooltip}
          >
            <Eye className="w-3 h-3" />
            {t.watchBufBtn}
          </button>

          <button
            onClick={() => requestProtectedAction('handoff')}
            className="px-2 py-1 rounded bg-[#0c131d] hover:bg-[#131e2e] border border-amber/40 text-[10px] text-amber flex items-center gap-1 whitespace-nowrap"
            title={t.handoffTooltip}
          >
            <FileSpreadsheet className="w-3 h-3" />
            {t.handoffBtn}
          </button>

          <button
            onClick={() => requestProtectedAction('sync')}
            className="px-2 py-1 rounded bg-[#0c131d] hover:bg-[#131e2e] border border-border text-[10px] text-matrix flex items-center gap-1 whitespace-nowrap"
            title={t.syncTooltip}
          >
            <Cloud className="w-3 h-3" />
            {syncButtonLabel}
          </button>

          <button
            onClick={requestOpenSettings}
            className="p-1 rounded bg-[#0c131d] hover:bg-[#131e2e] border border-border text-slate-300 hover:text-matrix"
            title={t.settingsTooltip}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => window.ndevApi?.setWidgetMode(true)}
            className="px-2 py-1 rounded bg-matrix/15 hover:bg-matrix/25 border border-matrix/40 text-matrix text-[10px] flex items-center gap-1 font-semibold whitespace-nowrap"
            title={t.cornerTooltip}
          >
            <Minimize2 className="w-3 h-3" />
            {t.cornerBtn}
          </button>

          {/* OS Window Controls (Top-Right Control Box: Minimize, Maximize/Restore, Close) */}
          <div className="flex items-center gap-1 no-drag ml-1 pl-2 border-l border-border/80">
            <button
              type="button"
              onClick={() => window.ndevApi?.minimizeWindow?.()}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#142030] transition-colors"
              title={t.winMinimize}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={async () => {
                const max = await window.ndevApi?.toggleMaximizeWindow?.();
                setIsMaximized(Boolean(max));
              }}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#142030] transition-colors"
              title={isMaximized ? t.winRestore : t.winMaximize}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5 text-cyber" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => window.ndevApi?.closeWindow?.()}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-red-600/90 transition-colors"
              title={t.winClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Repository & Handoff Manager (Disguised until Alt is held) */}
        <aside className="w-72 shrink-0 bg-[#080c12] border-r border-border flex flex-col">
          <div className="p-2.5 border-b border-border flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 truncate">
              <FolderGit2 className="w-3.5 h-3.5 text-matrix shrink-0" />{' '}
              {isAltHeld ? `${t.reposTitle} (${repos.length})` : `SLAB_POOLS (${repos.length})`}
            </span>
            <button
              onClick={handleAddRepo}
              className="px-2 py-0.5 rounded bg-matrix/10 hover:bg-matrix/20 border border-matrix/30 text-matrix text-[10px] flex items-center gap-1 whitespace-nowrap shrink-0"
              title={isAltHeld ? t.mountTooltip : 'MMAP_SLAB_REGION'}
            >
              <FolderPlus className="w-3 h-3" /> {isAltHeld ? t.mountBtn : '+MMAP'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
            {repos.map((repo) => {
              const isSelectedRepo = repo.id === activeRepo?.id;
              const isExpanded =
                expandedRepoIds[repo.id] !== undefined ? expandedRepoIds[repo.id] : isSelectedRepo;
              const repoSessions: ChatSession[] =
                Array.isArray(repo.sessions) && repo.sessions.length > 0
                  ? repo.sessions
                  : [
                      {
                        id: `ses-${repo.id}-1`,
                        title: `${t.sessionDefaultPrefix} #1`,
                        createdAt: repo.lastUpdated || '',
                        updatedAt: repo.lastUpdated || '',
                        messages: repo.messages || [],
                        handoff: repo.handoff,
                        sessionByMachine: repo.sessionByMachine,
                        agySessionByMachine: repo.agySessionByMachine,
                      },
                    ];
              const currentActiveSessionId = repo.activeSessionId || repoSessions[0]?.id;

              const maskedRepoName = `kmod_0x${hashToHex(repo.name, 6).toLowerCase()}.ko`;
              const maskedBranch = `0x${hashToHex(repo.branch || 'main', 4)}`;
              const maskedPath = `/sys/kernel/slab/0x${hashToHex(repo.localPath, 8)}/dma_ring`;

              return (
                <div
                  key={repo.id}
                  className={`rounded border transition-all ${
                    isSelectedRepo
                      ? 'bg-[#0d1420] border-matrix/45 shadow-[inset_2px_0_0_#00ff9c]'
                      : 'bg-[#090e16]/60 border-border/50 hover:border-border'
                  }`}
                >
                  {/* Parent Node: Repository Header */}
                  <div
                    onClick={() => {
                      setActiveRepoId(repo.id);
                      setExpandedRepoIds((prev) => ({
                        ...prev,
                        [repo.id]: !isExpanded,
                      }));
                    }}
                    className="p-2 cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-matrix shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <FolderGit2 className="w-3.5 h-3.5 text-matrix shrink-0" />
                        <span className="font-semibold text-[11px] truncate text-matrix">
                          {isAltHeld ? repo.name : maskedRepoName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-border text-slate-300">
                          {isAltHeld ? repo.branch || 'main' : maskedBranch}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateChatSession(repo.id, false);
                          }}
                          title={isAltHeld ? t.newChatSessionTooltip : 'ALLOC_RING_CTX'}
                          className="p-0.5 rounded bg-matrix/15 hover:bg-matrix/30 border border-matrix/40 text-matrix"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-[9px] text-slate-500 truncate mt-0.5 pl-4"
                      title={isAltHeld ? repo.localPath : maskedPath}
                    >
                      {isAltHeld ? repo.localPath : maskedPath}
                    </div>
                  </div>

                  {/* Child Nodes Tree: Chat Sessions under this Repo */}
                  {isExpanded && (
                    <div className="pb-2 pr-1.5 pl-3">
                      <div className="border-l border-matrix/30 pl-2 space-y-1">
                        {repoSessions.map((ses, sIdx) => {
                          const isSesActive =
                            isSelectedRepo && ses.id === currentActiveSessionId;
                          const sesMsgsCount = ses.messages?.length || 0;
                          const maskedSesTitle = `ctx_0x${hashToHex(ses.id, 4).toLowerCase()} :: ${
                            sesMsgsCount * 16
                          }KB`;
                          const isEditingThis = editingSessionId === ses.id;

                          return (
                            <div
                              key={ses.id}
                              onClick={() => handleSelectChatSession(repo.id, ses.id)}
                              className={`group relative flex items-center justify-between gap-1 px-2 py-1.5 rounded border cursor-pointer transition-colors ${
                                isSesActive
                                  ? 'bg-matrix/15 border-matrix/50 text-white'
                                  : 'bg-[#070b11]/80 border-transparent text-slate-400 hover:bg-[#0f1724] hover:text-slate-200'
                              }`}
                            >
                              {/* Tree branch connector */}
                              <span className="text-matrix/40 text-[9px] font-mono shrink-0">
                                {sIdx === repoSessions.length - 1 ? '└─' : '├─'}
                              </span>
                              <MessageSquare
                                className={`w-3 h-3 shrink-0 ${
                                  isSesActive ? 'text-matrix' : 'text-cyber/70'
                                }`}
                              />

                              {isEditingThis ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 flex items-center gap-1 min-w-0"
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingSessionTitle}
                                    onChange={(e) => setEditingSessionTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameChatSession(
                                          repo.id,
                                          ses.id,
                                          editingSessionTitle
                                        );
                                      } else if (e.key === 'Escape') {
                                        setEditingSessionId(null);
                                      }
                                    }}
                                    className="w-full bg-[#05080c] border border-matrix rounded px-1 py-0.5 text-[10px] text-matrix focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRenameChatSession(repo.id, ses.id, editingSessionTitle)
                                    }
                                    className="text-matrix hover:text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-[10px] truncate ${
                                        isSesActive
                                          ? 'font-bold text-matrix'
                                          : 'font-medium text-slate-300'
                                      }`}
                                      title={isAltHeld ? ses.title : maskedSesTitle}
                                    >
                                      {isAltHeld ? ses.title : maskedSesTitle}
                                    </div>
                                  </div>

                                  <span className="text-[9px] text-slate-500 shrink-0">
                                    {isAltHeld ? `${sesMsgsCount}` : `0x${sesMsgsCount.toString(16)}`}
                                  </span>

                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="hidden group-hover:flex items-center gap-0.5 shrink-0 bg-[#0b121c] px-1 rounded"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSessionId(ses.id);
                                        setEditingSessionTitle(ses.title);
                                      }}
                                      title={t.renameSessionTooltip}
                                      className="p-0.5 text-slate-400 hover:text-cyber"
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteChatSession(repo.id, ses.id)}
                                      title={t.deleteSessionTooltip}
                                      className="p-0.5 text-slate-400 hover:text-red-400"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Quick + New Chat Session button at bottom of Repo tree */}
                        <button
                          type="button"
                          onClick={() => handleCreateChatSession(repo.id, false)}
                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[9px] text-matrix/80 hover:text-matrix hover:bg-matrix/10 border border-dashed border-matrix/25 transition-colors"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>
                            {isAltHeld ? t.newChatSessionBtn : '+ ALLOC_DMA_SESSION'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cross-Machine Handoff Summary Panel (Disguised until Alt is held) */}
          {activeRepo && (
            <div className="p-2.5 border-t border-border bg-[#06090e] space-y-2">
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="text-amber font-bold flex items-center gap-1 truncate">
                  {isAltHeld ? t.handoffSummaryTitle : 'DMA_REG_STATE_DUMP'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => requestProtectedAction('handoff')}
                    className="p-1 rounded hover:bg-[#111a27] text-slate-400 hover:text-white"
                    title={isAltHeld ? t.editHandoffTooltip : 'REG_DESC_INSPECT'}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleResetAndHandoff}
                    className="px-1.5 py-0.5 rounded bg-amber/15 hover:bg-amber/25 border border-amber/40 text-amber text-[9px] flex items-center gap-0.5 whitespace-nowrap"
                    title={isAltHeld ? t.newSesTooltip : 'INVLPGA_TLB_FLUSH'}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />{' '}
                    {isAltHeld ? t.newSesBtn : 'FLUSH_TLB'}
                  </button>
                </div>
              </div>

              {isAltHeld ? (
                <div className="text-[10px] space-y-1.5 bg-[#0a0f18] p-2 rounded border border-border/70">
                  <div
                    className="text-cyber truncate"
                    title={localizeHandoffField(activeRepo.handoff?.currentGoal, 'goal', lang)}
                  >
                    <span className="text-slate-500">{t.goalLabel}</span>{' '}
                    {localizeHandoffField(activeRepo.handoff?.currentGoal, 'goal', lang)}
                  </div>
                  <div className="text-slate-400 line-clamp-2 text-[9px]">
                    {localizeHandoffField(activeRepo.handoff?.recentProgress, 'progress', lang)}
                  </div>
                  <div
                    className="text-amber/90 truncate text-[9px]"
                    title={localizeHandoffField(activeRepo.handoff?.nextSteps, 'nextSteps', lang)}
                  >
                    <span className="text-slate-500">{t.nextStepsShortLabel}</span>{' '}
                    {localizeHandoffField(activeRepo.handoff?.nextSteps, 'nextSteps', lang)}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9px] text-slate-500">
                    <span className="truncate">
                      {currentMachineSessionId
                        ? `${t.localSesActive} ${currentMachineSessionId.slice(0, 6)}`
                        : t.freshHandoffMode}
                    </span>
                    <span className="text-matrix shrink-0">
                      +{settings.engine.recentTurnsCount || 6} {t.turnsSuffix}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] space-y-1.5 bg-[#0a0f18] p-2 rounded border border-border/70 font-mono">
                  <div className="text-cyber truncate">
                    <span className="text-slate-500">CR3_PGD:</span>{' '}
                    0x{hashToHex(activeRepo.handoff?.currentGoal || 'goal', 8)} :: pte=0x063_RW
                  </div>
                  <div className="text-matrix/80 line-clamp-2 text-[9px] break-all">
                    {encodeToDisguisedCode(
                      localizeHandoffField(activeRepo.handoff?.recentProgress, 'progress', lang) ||
                        'init_ring0_state',
                      settings.cipherLanguage,
                      2
                    )}
                  </div>
                  <div className="text-amber/90 truncate text-[9px]">
                    <span className="text-slate-500">RSP_RET:</span>{' '}
                    0x{hashToHex(activeRepo.handoff?.nextSteps || 'next', 8)} &gt;&gt; sys_irq_exit()
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9px] text-slate-500">
                    <span className="truncate">
                      TLB_CTX: 0x{hashToHex(currentMachineSessionId || 'init_tlb', 6)}
                    </span>
                    <span className="text-matrix shrink-0">
                      +0x{((settings.engine.recentTurnsCount || 6) * 16).toString(16).toUpperCase()}B
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center Panel: Disguised Chat Stream + Camouflage Cipher Input */}
        <main className="flex-1 flex flex-col bg-[#06090e] overflow-hidden min-w-0">
          {/* Active Repo Top Status & Standard AI Workspace Bar */}
          {activeRepo && (
            <div className="px-3.5 py-1.5 border-b border-border bg-[#080d14] flex items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-matrix flex items-center gap-1.5 truncate">
                  <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                  {isAltHeld ? activeRepo.name : `SLAB_POOL_0x${hashToHex(activeRepo.name, 4)}`}
                </span>
                <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 rounded bg-[#06090e] border border-border/70 truncate">
                  {isAltHeld
                    ? activeRepo.branch || 'main'
                    : `b=0x${hashToHex(activeRepo.branch || 'main', 4)}`}
                </span>
                {isAltHeld && activeRepo.localPath && (
                  <span
                    className="text-[10px] text-slate-400 font-mono truncate max-w-[260px] cursor-pointer hover:text-matrix"
                    onClick={() => window.ndevApi?.openPathInExplorer(activeRepo.localPath)}
                    title={activeRepo.localPath}
                  >
                    {activeRepo.localPath}
                  </span>
                )}
              </div>

              {isAltHeld ? (
                <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                  {standardStatus?.isStandard ? (
                    <span className="px-2 py-0.5 rounded bg-matrix/15 border border-matrix/40 text-matrix font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-matrix" /> {t.standardAiBadgeOk}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleScaffoldStandard}
                      disabled={isScaffolding}
                      className="px-2 py-0.5 rounded bg-amber/20 hover:bg-amber/30 border border-amber/60 text-amber font-bold flex items-center gap-1 shadow-sm transition-colors animate-pulse"
                      title={
                        standardStatus?.missing?.length
                          ? t.missingStandardComponents(standardStatus.missing)
                          : t.scaffoldStandardBtn
                      }
                    >
                      <AlertCircle className="w-3 h-3 text-amber" />
                      {isScaffolding ? t.scaffoldingStandardInProgress : t.scaffoldStandardBtn}
                    </button>
                  )}

                  {activeRepo.localPath && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          window.ndevApi?.openPathInExplorer(
                            activeRepo.localPath + '/handoff/latest.md'
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-[#0e1622] hover:bg-[#162234] border border-border text-slate-300 hover:text-white"
                        title="handoff/latest.md"
                      >
                        📋 handoff
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.ndevApi?.openPathInExplorer(activeRepo.localPath + '/tasks')
                        }
                        className="px-1.5 py-0.5 rounded bg-[#0e1622] hover:bg-[#162234] border border-border text-slate-300 hover:text-white"
                        title="tasks/"
                      >
                        🎯 {t.openTasksBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.ndevApi?.openPathInExplorer(activeRepo.localPath + '/decisions')
                        }
                        className="px-1.5 py-0.5 rounded bg-[#0e1622] hover:bg-[#162234] border border-border text-slate-300 hover:text-white"
                        title="decisions/"
                      >
                        🏛️ {t.openDecisionsBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          window.ndevApi?.openPathInExplorer(activeRepo.localPath + '/docs')
                        }
                        className="px-1.5 py-0.5 rounded bg-[#0e1622] hover:bg-[#162234] border border-border text-slate-300 hover:text-white"
                        title="docs/"
                      >
                        📚 {t.openDocsBtn}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="font-mono text-[9px] text-slate-500">
                  SLAB_DESC: 0x{hashToHex(activeRepo.localPath || 'slab', 8)} [RW]
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-text">
            {activeRepo?.messages.map((msg, idx) => (
              <DisguisedMessageItem
                key={msg.id}
                msg={msg}
                index={idx}
                mode={settings.stealthMode}
                cipherLanguage={settings.cipherLanguage}
                globalReveal={isAltHeld}
                lang={lang}
                toggleTooltip={t.toggleDisguiseMsgTooltip}
                onPreviewAttachment={(att) => setPreviewImageAttachment(att)}
              />
            ))}

            {(agentStatus !== 'idle' || streamingText) && (
              <div className="border border-mystic/40 bg-[#0b1018] rounded p-2.5 space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-[10px] text-mystic">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {isAltHeld
                      ? `[${t.streamChannelLabel} :: ${settings.engine.activeEngine.toUpperCase()}] >> ${localizedStatusDetail}`
                      : `[DMA_RING_CH0 :: 0x${hashToHex(settings.engine.activeEngine, 4)}] >> irq_dispatch_poll(0x${hashToHex(localizedStatusDetail, 6)})`}
                  </span>
                  <button
                    onClick={() => window.ndevApi?.abortEngine()}
                    className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Square className="w-2.5 h-2.5" /> {t.sigintBtn}
                  </button>
                </div>

                {liveThoughts.length > 0 && (
                  <div className="border-l-2 border-mystic/50 pl-2 py-0.5 space-y-1 max-h-40 overflow-y-auto">
                    <div className="text-[10px] font-semibold text-mystic">
                      {isAltHeld
                        ? `${lang === 'vi' ? 'Đang suy nghĩ' : 'Thinking'} (${liveThoughts.length})`
                        : `IRQ_TRACE_BUF (0x${liveThoughts.length.toString(16)})`}
                    </div>
                    {isAltHeld ? (
                      <ThoughtsList thoughts={liveThoughts.slice(-3)} compact />
                    ) : (
                      <div className="text-[10px] text-slate-500">
                        0x{hashToHex(liveThoughts[liveThoughts.length - 1].text, 12)}
                      </div>
                    )}
                  </div>
                )}

                {liveTools.length > 0 && (
                  <div className="space-y-1 border-l-2 border-cyber/40 pl-2 py-0.5">
                    {liveTools.slice(-4).map((tItem) => (
                      <div key={tItem.id} className="text-[10px] text-cyber/90">
                        &gt; syscall::{tItem.toolName}("
                        {isAltHeld ? tItem.target || '' : `0x${hashToHex(tItem.target || 'target', 8)}`}")
                      </div>
                    ))}
                  </div>
                )}

                {streamingText && (
                  <pre className="text-[11px] text-matrix/90 whitespace-pre-wrap font-mono leading-relaxed">
                    {showPlainTextInInput
                      ? streamingText
                      : encodeToDisguisedCode(streamingText, settings.cipherLanguage, 7)}
                  </pre>
                )}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Cipher Input Console (Only Effort & Attachment controls outside; Engine/Model moved inside Settings) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverInput(true);
            }}
            onDragLeave={() => setIsDragOverInput(false)}
            onDrop={handleDropFiles}
            className={`border-t bg-[#090d14] p-2.5 space-y-2 transition-colors ${
              isDragOverInput ? 'border-matrix bg-[#0d1824]' : 'border-border'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() =>
                    handleUpdateSettings({ cipherEnabled: !settings.cipherEnabled })
                  }
                  className={`px-2 py-0.5 rounded border flex items-center gap-1 font-semibold whitespace-nowrap ${
                    settings.cipherEnabled
                      ? 'bg-matrix/15 border-matrix/40 text-matrix'
                      : 'bg-amber/15 border-amber/40 text-amber'
                  }`}
                >
                  {settings.cipherEnabled ? (
                    <>
                      <Lock className="w-3 h-3" /> {t.cipherMaskOn}
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" /> {t.cipherMaskOff}
                    </>
                  )}
                </button>

                {settings.cipherEnabled && (
                  <select
                    value={settings.cipherLanguage}
                    onChange={(e) =>
                      handleUpdateSettings({
                        cipherLanguage: e.target.value as AppSettings['cipherLanguage'],
                      })
                    }
                    className="bg-[#06090e] border border-border rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                  >
                    <option value="rust-kernel">{t.maskRust}</option>
                    <option value="cpp-vulkan">{t.maskCpp}</option>
                    <option value="asm-hex">{t.maskAsm}</option>
                  </select>
                )}

                {/* Per-Message Effort Level Selector (Disguised until Alt is held) */}
                <select
                  value={settings.engine.effortLevel || 'high'}
                  onChange={(e) =>
                    handleUpdateSettings({
                      engine: {
                        ...settings.engine,
                        effortLevel: e.target.value as EffortLevel,
                      },
                    })
                  }
                  title={isAltHeld ? t.effortSelectTooltip : 'IRQ_SCHED_PRIORITY'}
                  className="bg-[#06090e] border border-mystic/40 rounded px-1.5 py-0.5 text-mystic font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="low">
                    {isAltHeld ? `${t.effortPrefix} ${t.effortLow}` : 'IRQ_PRIO: 0x01_IDLE'}
                  </option>
                  <option value="medium">
                    {isAltHeld ? `${t.effortPrefix} ${t.effortMedium}` : 'IRQ_PRIO: 0x02_SCHED'}
                  </option>
                  <option value="high">
                    {isAltHeld ? `${t.effortPrefix} ${t.effortHigh}` : 'IRQ_PRIO: 0x04_RT_HI'}
                  </option>
                  <option value="xhigh">
                    {isAltHeld ? `${t.effortPrefix} ${t.effortXhigh}` : 'IRQ_PRIO: 0x08_NMI'}
                  </option>
                  <option value="max">
                    {isAltHeld ? `${t.effortPrefix} ${t.effortMax}` : 'IRQ_PRIO: 0xFF_RING0'}
                  </option>
                </select>

                {/* Dynamic Engine / Plan Usage Ring & Popover */}
                {(() => {
                  const activeEng = settings.engine.activeEngine; // 'claude-code' | 'antigravity' | 'codex' | 'deepseek'
                  const activeModel =
                    activeEng === 'claude-code'
                      ? settings.engine.claudeModel || 'claude-sonnet-5-5'
                      : activeEng === 'antigravity'
                      ? settings.engine.antigravityModel || 'Gemini 3.8 Flash'
                      : activeEng === 'deepseek'
                      ? settings.engine.deepseekModel || 'deepseek-chat'
                      : settings.engine.codexModel || 'o3-mini';

                  const isGemini = activeEng === 'antigravity' || /gemini/i.test(activeModel);

                  // Tìm tin nhắn assistant của ENGINE ĐANG CHỌN (tránh lấy nhầm token của engine khác)
                  const lastAssistantOfEngine = [...(activeRepo?.messages || [])]
                    .reverse()
                    .find((m) => {
                      if (m.role !== 'assistant') return false;
                      if (isGemini) {
                        return m.engine === 'antigravity' || /gemini/i.test(m.modelUsed || '');
                      }
                      if (activeEng === 'claude-code') {
                        return m.engine === 'claude-code' || /claude/i.test(m.modelUsed || '');
                      }
                      return m.engine === activeEng;
                    });

                  // Số token đã dùng của engine hiện tại
                  const usedTokens =
                    lastAssistantOfEngine?.contextTokens ||
                    lastAssistantOfEngine?.tokensIn ||
                    0;

                  // Giới hạn context window chuẩn theo từng engine/model
                  const contextLimit = getContextWindow(activeModel);

                  // Với Claude Code: vòng tròn thể hiện % của 5-hour limit (Claude Subscription Usage)
                  // Với Gemini / Antigravity: vòng tròn thể hiện context window usage của phiên (trên tổng 1,000,000 tokens)
                  const fiveHourPct =
                    planUsage?.fiveHour?.percent != null ? Number(planUsage.fiveHour.percent) : 0;
                  const weeklyPct =
                    planUsage?.weekly?.percent != null ? Number(planUsage.weekly.percent) : 0;

                  let displayPercent = 0;
                  let ringRatio = 0;

                  if (isGemini) {
                    ringRatio = contextLimit > 0 ? Math.min(usedTokens / contextLimit, 1) : 0;
                    displayPercent = Math.round(ringRatio * 100);
                  } else if (activeEng === 'claude-code') {
                    displayPercent = Math.round(fiveHourPct);
                    ringRatio = Math.min(Math.max(fiveHourPct / 100, 0), 1);
                  } else {
                    ringRatio = contextLimit > 0 ? Math.min(usedTokens / contextLimit, 1) : 0;
                    displayPercent = Math.round(ringRatio * 100);
                  }

                  const ringColor =
                    ringRatio < 0.6 ? '#3b82f6' : ringRatio < 0.85 ? '#f59e0b' : '#ef4444';
                  const r = 7;
                  const c = 2 * Math.PI * r;

                  const ringTitle = isAltHeld
                    ? isGemini
                      ? `Google Gemini [${activeModel}]: ${usedTokens.toLocaleString()} / ${(contextLimit / 1_000_000).toFixed(0)}M tokens (${displayPercent}%)`
                      : activeEng === 'claude-code'
                      ? `Claude Plan limits: 5h (${displayPercent}%) · Weekly (${Math.round(weeklyPct)}%)`
                      : `${activeModel}: ${usedTokens.toLocaleString()} / ${contextLimit.toLocaleString()} tokens (${displayPercent}%)`
                    : isGemini
                    ? 'RING0_QUOTA_WATCH :: GEMINI_MMU'
                    : 'RING0_QUOTA_WATCH :: MMU_LIMITS';

                  return (
                    <span className="relative inline-flex items-center gap-1.5" ref={planUsagePopupRef}>
                      {/* Plan / Engine Usage Popover Modal */}
                      {showPlanUsagePopup && (
                        <div
                          className="absolute bottom-full left-0 mb-2 w-[300px] sm:w-[330px] bg-[#1a1d23] border border-[#323946] rounded-xl shadow-2xl p-4 text-xs select-none z-50 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#282d38]">
                            <span className="text-slate-200 font-medium text-[13px]">
                              {isAltHeld
                                ? isGemini
                                  ? 'Google Gemini · Antigravity'
                                  : `Plan usage limits${planUsage?.plan ? ` · ${planUsage.plan.charAt(0).toUpperCase()}${planUsage.plan.slice(1)}` : ' · Pro'}`
                                : isGemini
                                ? 'RING0_QUOTA_WATCH :: GEMINI_MMU'
                                : 'RING0_QUOTA_WATCH :: MMU_LIMITS'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeEng === 'claude-code') {
                                  window.ndevApi?.getPlanUsage?.().then((u: any) => {
                                    if (u?.ok) setPlanUsage(u);
                                  });
                                }
                              }}
                              className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1 font-medium cursor-pointer"
                              title={isAltHeld ? (isGemini ? activeModel : 'Refresh usage') : 'SYNC_MMU'}
                            >
                              {isAltHeld
                                ? isGemini
                                  ? `${activeModel}`
                                  : 'See all →'
                                : '0x7F_SYNC →'}
                            </button>
                          </div>

                          {/* GEMINI POPUP CONTENT */}
                          {isGemini ? (
                            <>
                              {/* 1. Context Window */}
                              <div className="space-y-1.5 mb-3.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-100 font-medium">
                                    {isAltHeld ? 'Context window' : 'CONTEXT_MMU_MAP'}
                                  </span>
                                  <span className="text-slate-400 font-normal tabular-nums">
                                    {isAltHeld
                                      ? `${usedTokens.toLocaleString()} / ${(contextLimit / 1_000_000).toFixed(0)}M (${displayPercent}%)`
                                      : `PAGES @ 0x${hashToHex(String(usedTokens), 4)}  ${displayPercent}%`}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-[#2d333f] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(Math.max(displayPercent, usedTokens > 0 ? 1 : 0), 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* 2. Daemon & Rate Limit Status */}
                              <div className="space-y-1.5 mb-3.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-100 font-medium">
                                    {isAltHeld ? 'Antigravity CLI Daemon' : 'BURST_IO_LIMIT'}
                                  </span>
                                  <span className="text-slate-400 font-normal tabular-nums">
                                    {isAltHeld ? 'Connected · Ready' : 'STATUS @ 0x00_OK'}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-[#2d333f] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                    style={{ width: '100%' }}
                                  />
                                </div>
                              </div>

                              {/* 3. Model Active Details */}
                              <div className="pt-2 border-t border-[#282d38] flex items-center justify-between text-[11px] text-slate-400">
                                <span>{isAltHeld ? 'Active Model:' : 'SYS_MODEL:'}</span>
                                <span className="text-slate-200 font-mono font-medium">
                                  {isAltHeld ? activeModel : `0x${hashToHex(activeModel, 6)}`}
                                </span>
                              </div>
                            </>
                          ) : (
                            /* CLAUDE POPUP CONTENT */
                            <>
                              {/* 5-hour limit */}
                              <div className="space-y-1.5 mb-3.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-100 font-medium">
                                    {isAltHeld ? '5-hour limit' : 'IRQ_WINDOW_5H'}
                                  </span>
                                  <span className="text-slate-400 font-normal tabular-nums">
                                    {isAltHeld
                                      ? `${formatResetTime(planUsage?.fiveHour?.resetsAt, false)}  ${Math.round(fiveHourPct)}%`
                                      : `RESET_VEC @ 0x${hashToHex(planUsage?.fiveHour?.resetsAt || '5h', 4)}  ${Math.round(fiveHourPct)}%`}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-[#2d333f] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(Math.max(fiveHourPct, 0), 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Weekly limit */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-100 font-medium">
                                    {isAltHeld ? 'Weekly · all models' : 'BURST_CYCLE_7D'}
                                  </span>
                                  <span className="text-slate-400 font-normal tabular-nums">
                                    {isAltHeld
                                      ? `${formatResetTime(planUsage?.weekly?.resetsAt, true)}  ${Math.round(weeklyPct)}%`
                                      : `EPOCH_TICK @ 0x${hashToHex(planUsage?.weekly?.resetsAt || '7d', 4)}  ${Math.round(weeklyPct)}%`}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-[#2d333f] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(Math.max(weeklyPct, 0), 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Per-model weekly limits */}
                              {(planUsage?.limits || [])
                                .filter((l: any) => l.kind === 'weekly_scoped')
                                .map((l: any, i: number) => (
                                  <div key={`scoped-${i}`} className="space-y-1.5 mt-3.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-100 font-medium">
                                        {isAltHeld ? `Weekly · ${l.scopeModel || 'model'}` : `BURST_CYCLE_7D_${i}`}
                                      </span>
                                      <span className="text-slate-400 font-normal tabular-nums">
                                        {Math.round(l.percent)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-[#2d333f] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#3b82f6] rounded-full"
                                        style={{ width: `${Math.min(Math.max(l.percent, 0), 100)}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}

                              {/* Model Context Tokens In-Use */}
                              <div className="pt-2.5 mt-3 border-t border-[#282d38] flex items-center justify-between text-[11px] text-slate-400">
                                <span>{isAltHeld ? `Session Context (${activeModel}):` : 'RING0_CTX:'}</span>
                                <span className="text-slate-200 font-mono font-medium">
                                  {isAltHeld
                                    ? `${usedTokens.toLocaleString()} / ${contextLimit.toLocaleString()} tokens`
                                    : `0x${hashToHex(String(usedTokens), 4)}`}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Usage Ring Button */}
                      <span
                        className="inline-flex items-center gap-1 cursor-pointer hover:opacity-85 transition-opacity"
                        title={ringTitle}
                        onClick={() => setShowPlanUsagePopup((prev) => !prev)}
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90">
                          <circle cx="9" cy="9" r={r} fill="none" stroke="#1e293b" strokeWidth="2.5" />
                          <circle
                            cx="9"
                            cy="9"
                            r={r}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={c}
                            strokeDashoffset={c * (1 - ringRatio)}
                            className="transition-all duration-300"
                          />
                        </svg>
                        {isAltHeld && (
                          <span className="font-semibold tabular-nums text-[10px]" style={{ color: ringColor }}>
                            {displayPercent}%
                          </span>
                        )}
                      </span>
                    </span>
                  );
                })()}

                {/* Headless Auto-Permission Toggle (Disguised until Alt is held) */}
                <button
                  onClick={() =>
                    handleUpdateSettings({
                      engine: {
                        ...settings.engine,
                        skipPermissions: settings.engine.skipPermissions === false,
                      },
                    })
                  }
                  title={isAltHeld ? t.autoPermitTooltip : 'MMU_PAGE_PROTECTION_BITS'}
                  className={`px-2 py-0.5 rounded border font-semibold whitespace-nowrap ${
                    settings.engine.skipPermissions !== false
                      ? 'bg-matrix/15 border-matrix/40 text-matrix'
                      : 'bg-red-500/15 border-red-500/40 text-red-400'
                  }`}
                >
                  {isAltHeld
                    ? settings.engine.skipPermissions !== false
                      ? t.autoPermitOn
                      : t.autoPermitOff
                    : settings.engine.skipPermissions !== false
                    ? 'MMU_PROT: 0x07_RWX'
                    : 'MMU_PROT: 0x01_RO'}
                </button>

                {/* Attach Image / File Button (Also supports Ctrl+V and Drag & Drop) */}
                <button
                  type="button"
                  onClick={handlePickAttachmentsDialog}
                  title={isAltHeld ? t.attachBtnTooltip : 'DMA_MAP_SCATTER_GATHER'}
                  className="px-2 py-0.5 rounded bg-cyber/15 hover:bg-cyber/25 border border-cyber/40 text-cyber font-semibold flex items-center gap-1 whitespace-nowrap"
                >
                  <Paperclip className="w-3 h-3" />
                  {isAltHeld ? t.attachBtn : '+DMA_BUF'}
                </button>
              </div>

            </div>

            {/* Pending Pasted / Attached Images & Files Bar */}
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded bg-[#060a10] border border-cyber/30">
                <span className="text-[10px] text-cyber font-bold">
                  {t.attachmentsCountLabel} ({pendingAttachments.length})
                </span>
                {pendingAttachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className="group flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b131e] border border-border hover:border-cyber/50 text-[10px]"
                  >
                    {showPlainTextInInput ? (
                      <>
                        {att.isImage && att.previewDataUrl ? (
                          <img
                            src={att.previewDataUrl}
                            alt={att.name}
                            onClick={() => setPreviewImageAttachment(att)}
                            className="w-7 h-7 object-cover rounded border border-matrix/40 cursor-pointer"
                          />
                        ) : att.isImage ? (
                          <ImageIcon className="w-3.5 h-3.5 text-matrix" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-amber" />
                        )}
                        <span className="text-slate-200 max-w-[160px] truncate" title={att.filePath}>
                          {att.name}
                        </span>
                        <span className="text-slate-500">({formatBytes(att.size)})</span>
                      </>
                    ) : (
                      <span className="text-matrix font-mono">
                        [DMA_MMAP_0x{(0x7f00 + idx).toString(16).toUpperCase()} ::{' '}
                        {att.isImage ? 'IMG_FRAME' : 'FD_STREAM'} {formatBytes(att.size)}]
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePendingAttachment(att.id)}
                      title={t.removeAttachmentTooltip}
                      className="text-slate-500 hover:text-red-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => hiddenTextareaRef.current?.focus()}
              className="relative min-h-[82px] max-h-[150px] overflow-y-auto rounded bg-[#05080c] border border-border focus-within:border-matrix/60 p-2.5 cursor-text"
            >
              <textarea
                ref={hiddenTextareaRef}
                value={realInput}
                onChange={(e) => handleRealInputChange(e.target.value)}
                onPaste={handlePasteInChat}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRequestSendPrompt();
                  }
                }}
                placeholder=""
                className={`w-full h-full bg-transparent resize-none focus:outline-none font-mono text-xs leading-relaxed ${
                  showPlainTextInInput
                    ? 'text-matrix caret-matrix'
                    : 'text-transparent caret-transparent selection:bg-transparent'
                }`}
                rows={3}
              />

              {!showPlainTextInInput && (
                <div className="pointer-events-none absolute inset-0 p-2.5 overflow-hidden">
                  {realInput.length === 0 ? (
                    <div className="text-slate-600 text-[11px]">
                      <span className="text-matrix">root@ring0-node</span>:
                      <span className="text-cyber">
                        ~/kmod_0x{hashToHex(activeRepo?.name || 'kernel', 6).toLowerCase()}
                      </span>
                      $ <span className="italic">{t.disguisedPlaceholder}</span>
                    </div>
                  ) : (
                    <pre className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-matrix">
                      {disguisedLivePreview}
                      <span className="inline-block w-1.5 h-3.5 bg-matrix ml-0.5 animate-pulse align-middle" />
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-2 text-[10px] min-w-0 flex-1">
                <Activity
                  className={`w-3.5 h-3.5 shrink-0 ${
                    agentStatus === 'idle' ? 'text-matrix' : 'text-mystic animate-spin'
                  }`}
                />
                <span className="text-slate-400 shrink-0">{t.statusLabel}</span>
                <span
                  className={`font-semibold uppercase shrink-0 ${
                    agentStatus === 'idle' ? 'text-matrix' : 'text-mystic'
                  }`}
                >
                  [{localizedAgentStatus}]
                </span>
                <span
                  className="text-slate-500 truncate flex-1"
                  title={isAltHeld ? localizedStatusDetail : 'RING0_IRQ_IDLE_LOOP'}
                >
                  {isAltHeld
                    ? localizedStatusDetail
                    : `mmu::tlb_sync(0x${hashToHex(localizedStatusDetail, 6)}) :: status=0x00_OK`}
                </span>
              </div>

              <button
                onClick={handleRequestSendPrompt}
                disabled={
                  agentStatus !== 'idle' ||
                  (!realInput.trim() && pendingAttachments.length === 0)
                }
                className="px-3.5 py-1 rounded bg-matrix/20 hover:bg-matrix/30 disabled:opacity-40 border border-matrix/50 text-matrix font-bold text-[11px] flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3" /> {t.execSyscallBtn}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Image Lightbox Modal when user clicks an attached image */}
      {previewImageAttachment && previewImageAttachment.previewDataUrl && (
        <div
          onClick={() => setPreviewImageAttachment(null)}
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[88vh] bg-[#090e16] border border-matrix/50 rounded-lg p-3 flex flex-col gap-2 shadow-2xl"
          >
            <div className="flex items-center justify-between text-xs text-matrix border-b border-border pb-1.5">
              <span className="font-bold truncate">{previewImageAttachment.name}</span>
              <button
                onClick={() => setPreviewImageAttachment(null)}
                className="text-slate-400 hover:text-white px-2"
              >
                {t.escCloseLabel}
              </button>
            </div>
            <img
              src={previewImageAttachment.previewDataUrl}
              alt={previewImageAttachment.name}
              className="max-h-[78vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* Main Chat Send Confirmation Modal */}
      {showMainSendConfirmModal && (
        <div
          onClick={() => {
            setShowMainSendConfirmModal(false);
            hiddenTextareaRef.current?.focus();
          }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#08101a] border border-amber/60 rounded-lg shadow-2xl p-4 space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between text-amber font-bold text-xs pb-1 border-b border-border">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="w-3.5 h-3.5 text-amber" />
                {t.mainConfirmSendTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowMainSendConfirmModal(false);
                  hiddenTextareaRef.current?.focus();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-300">
              {t.mainConfirmSendDesc}
            </div>

            {/* Target Engine & Model details */}
            <div className="flex items-center justify-between p-2 rounded bg-[#0b131e] border border-border/80 text-[10px]">
              <span className="text-slate-400">Target Engine:</span>
              <span className="text-matrix font-bold">
                {settings.engine.activeEngine.toUpperCase()} :: {activeModelDisplay}
              </span>
            </div>

            {/* Message Preview (Decrypted or Masked according to user view) */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>Nội dung gửi đi (Message Preview):</span>
                <span className="text-[9px] text-slate-500">
                  {realInput.length} ký tự
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto rounded bg-[#060a10] border border-border/80 p-2.5 text-[11px] whitespace-pre-wrap break-words text-cyber select-text">
                {isAltHeld || showPlainTextInInput
                  ? realInput || '(Chỉ gửi tệp đính kèm)'
                  : (disguisedLivePreview || '(Chỉ gửi tệp đính kèm)')}
              </div>
            </div>

            {/* Pending Attachments list */}
            {pendingAttachments.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-mystic font-semibold">
                  Tệp đính kèm ({pendingAttachments.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {pendingAttachments.map((att) => (
                    <span
                      key={att.id}
                      className="px-2 py-0.5 rounded bg-mystic/15 border border-mystic/30 text-[10px] text-mystic font-mono truncate max-w-[200px]"
                    >
                      {att.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  setShowMainSendConfirmModal(false);
                  hiddenTextareaRef.current?.focus();
                }}
                className="px-3 py-1 rounded bg-[#101a28] hover:bg-[#172538] border border-border text-slate-300 text-[11px]"
              >
                {t.mainConfirmCancelBtn}
              </button>
              <button
                ref={confirmSendBtnRef}
                type="button"
                autoFocus
                onClick={executeSendPrompt}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    executeSendPrompt();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMainSendConfirmModal(false);
                    hiddenTextareaRef.current?.focus();
                  }
                }}
                className="px-4 py-1 rounded bg-matrix text-black font-bold hover:opacity-90 text-[11px] flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,156,0.2)]"
              >
                {t.mainConfirmSendBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handoff Summary Inspector & Editor Modal */}
      {showHandoffModal && activeRepo && (
        <HandoffModal
          repo={activeRepo}
          machineId={machineId}
          lang={lang}
          recentTurnsCount={settings.engine.recentTurnsCount || 6}
          standardStatus={standardStatus}
          onScaffold={handleScaffoldStandard}
          onClose={() => setShowHandoffModal(false)}
          onSave={handleSaveCustomHandoff}
          onResetSession={async () => {
            await handleResetAndHandoff();
            setShowHandoffModal(false);
          }}
        />
      )}

      {/* Super Admin Login Modal (Required when clicking Settings, WATCH_BUF or HANDOFF without hotkeys) */}
      {showAdminLoginModal && (
        <AdminLoginModal
          lang={lang}
          defaultUsername={settings.adminAuth?.username || 'admin'}
          isDefaultPassword={settings.adminAuth?.isDefaultPassword !== false}
          onClose={() => {
            setShowAdminLoginModal(false);
            setPendingProtectedTarget(null);
          }}
          onSuccess={async () => {
            const target = pendingProtectedTarget || 'settings';
            setShowAdminLoginModal(false);
            setPendingProtectedTarget(null);
            if (target === 'watch-buf') {
              const open = await window.ndevApi?.togglePeekWindow(true);
              setPeekWindowOpen(Boolean(open));
            } else if (target === 'handoff') {
              setShowHandoffModal(true);
            } else if (target === 'sync') {
              await handleCloudSync();
            } else {
              setShowSettingsModal(true);
            }
          }}
        />
      )}

      {/* Settings & Cloud Sync Modal (Unlocked only after Super Admin authentication) */}
      {showSettingsModal && (
        <ErrorBoundary
          fallbackTitle="Settings Modal encountered a display error"
          onReset={() => setShowSettingsModal(false)}
        >
          <SettingsModal
            settings={settings}
            onClose={() => setShowSettingsModal(false)}
            onReposUpdated={(nextRepos) => setRepos(nextRepos)}
            onSettingsUpdated={(nextSettings) => setSettings(nextSettings)}
            onLanguagePreviewChange={(nextLang) => handleUpdateSettings({ language: nextLang })}
            onSave={async (next) => {
              await handleUpdateSettings(next);
              setShowSettingsModal(false);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

const DisguisedMessageItem: React.FC<{
  msg: ChatMessage;
  index: number;
  mode: StealthThemeMode;
  cipherLanguage: 'rust-kernel' | 'cpp-vulkan' | 'asm-hex';
  globalReveal: boolean;
  lang: AppLanguage;
  toggleTooltip: string;
  onPreviewAttachment?: (att: ChatAttachment) => void;
}> = ({
  msg,
  index,
  mode,
  cipherLanguage,
  globalReveal,
  lang,
  toggleTooltip,
  onPreviewAttachment,
}) => {
  const [revealedManually, setRevealedManually] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  const displayRealContent = localizeMessageText(msg, lang);

  const fallbackDisguisedCode =
    msg.disguisedCodeBlock && msg.disguisedCodeBlock.trim().length > 0
      ? msg.disguisedCodeBlock
      : encodeToDisguisedCode(displayRealContent, cipherLanguage, index + 1);

  const isRevealed = globalReveal || revealedManually;
  const hasAttachments = Boolean(msg.attachments && msg.attachments.length > 0);

  const renderAttachmentsBlock = () => {
    if (!hasAttachments || !msg.attachments) return null;
    if (!isRevealed) {
      return (
        <div className="text-[10px] text-cyber/80 font-mono bg-[#060a10] p-1.5 rounded border border-border/60 space-y-0.5">
          {msg.attachments.map((att, i) => (
            <div key={att.id}>
              // [DMA_BUFFER_0x{(0x8a00 + i).toString(16).toUpperCase()}] :: mapped_type="
              {att.isImage ? 'VK_IMAGE_2D' : 'RAW_FD_STREAM'}", bytes={att.size}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {msg.attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-2 p-1.5 rounded bg-[#0b131e] border border-cyber/40 text-[10px]"
          >
            {att.isImage && att.previewDataUrl ? (
              <img
                src={att.previewDataUrl}
                alt={att.name}
                onClick={() => onPreviewAttachment?.(att)}
                className="w-12 h-12 object-cover rounded border border-matrix/40 cursor-pointer hover:opacity-90"
              />
            ) : att.isImage ? (
              <ImageIcon className="w-4 h-4 text-matrix" />
            ) : (
              <FileText className="w-4 h-4 text-amber" />
            )}
            <div className="min-w-0">
              <div className="text-cyber font-semibold truncate max-w-[200px]" title={att.filePath}>
                {att.name}
              </div>
              <div className="text-slate-500 text-[9px]">{formatBytes(att.size)}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (mode === 'ide-comment') {
    const startLine = index * 14 + 101;
    return (
      <div className="rounded bg-[#090e16] border border-border/80 p-2.5 font-mono text-[11px] space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-border/50 pb-1">
          <span>
            <span className="text-mystic">#[inline(always)]</span> // {msg.disguisedHeader}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-cyber">
              {isRevealed ? msg.engine : `0x${hashToHex(msg.engine || 'sys', 4)}`}
            </span>
            <button
              onClick={() => setRevealedManually(!revealedManually)}
              className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                isRevealed
                  ? 'border-amber/50 text-amber bg-amber/10'
                  : 'border-matrix/40 text-matrix bg-matrix/10'
              }`}
              title={toggleTooltip}
            >
              {isRevealed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span className="text-[9px]">{isRevealed ? t.msgRealBadge : t.msgMaskedBadge}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <div className="select-none text-slate-600 text-right pr-1 border-r border-border/50">
            <div>{startLine}</div>
            <div>{startLine + 1}</div>
            <div>{startLine + 2}</div>
          </div>
          <div className="flex-1 overflow-x-auto space-y-1.5">
            {renderAttachmentsBlock()}
            {isRevealed ? (
              <>
                <div className="text-slate-500">{t.decodedRealMsgHeader}</div>
                {msg.role === 'assistant' ? (
                  <div className="pl-2">
                    <StructuredMessage
                      content={displayRealContent}
                      thoughts={msg.thoughts}
                      tools={msg.toolActivities}
                      labels={{
                        thinking: lang === 'vi' ? 'Suy nghĩ' : 'Thinking',
                        tools: lang === 'vi' ? 'Thao tác công cụ' : 'Tool activity',
                      }}
                    />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap leading-relaxed pl-2 text-cyber/90">
                    {displayRealContent}
                  </pre>
                )}
                <div className="text-slate-500"> */</div>
              </>
            ) : (
              <pre className="whitespace-pre-wrap leading-relaxed text-matrix/90">
                {fallbackDisguisedCode}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded bg-[#080d14] border border-border/70 p-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] border-b border-border/50 pb-1">
        <span
          className={`font-semibold ${
            msg.role === 'user'
              ? 'text-cyber'
              : msg.role === 'assistant'
              ? 'text-matrix'
              : 'text-amber'
          }`}
        >
          {msg.disguisedHeader}
        </span>
        <div className="flex items-center gap-2 text-slate-500">
          <span>
            {isRevealed ? `@${msg.machineId}` : `@0x${hashToHex(msg.machineId || 'node', 6)}`}
          </span>
          <span className="px-1 rounded bg-border/60 text-slate-300">
            {isRevealed ? msg.engine : `RING0_${hashToHex(msg.engine || 'eng', 4)}`}
          </span>
          {msg.modelUsed && (
            <span className="px-1 rounded bg-cyber/10 text-cyber border border-cyber/30">
              {isRevealed ? msg.modelUsed : `PIPE_0x${hashToHex(msg.modelUsed, 4)}`}
            </span>
          )}
          {msg.effortUsed && (
            <span className="px-1 rounded bg-mystic/10 text-mystic border border-mystic/30">
              {isRevealed
                ? `${t.effortBadgePrefix}${msg.effortUsed}`
                : `IRQ_0x${hashToHex(msg.effortUsed, 2)}`}
            </span>
          )}
          {isRevealed && msg.costUsd !== undefined && msg.costUsd > 0 && (
            <span className="text-amber">${msg.costUsd.toFixed(4)}</span>
          )}
          <button
            onClick={() => setRevealedManually(!revealedManually)}
            className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
              isRevealed
                ? 'border-amber/50 text-amber bg-amber/10'
                : 'border-matrix/40 text-matrix bg-matrix/10'
            }`}
            title={toggleTooltip}
          >
            {isRevealed ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span className="text-[9px]">{isRevealed ? t.msgRealBadge : t.msgMaskedBadge}</span>
          </button>
        </div>
      </div>

      {!(isRevealed && msg.role === 'assistant') && msg.toolActivities && msg.toolActivities.length > 0 && (
        <div className="text-[10px] text-mystic/90 bg-[#06090e] p-1.5 rounded border border-mystic/20 space-y-0.5">
          {msg.toolActivities.map((tItem) => (
            <div key={tItem.id}>
              &gt;&gt; [IO_TRACE::{tItem.toolName.toUpperCase()}] target="
              {isRevealed ? tItem.target || '' : `0x${hashToHex(tItem.target || 'target', 8)}`}"
            </div>
          ))}
        </div>
      )}

      {renderAttachmentsBlock()}

      {isRevealed && msg.role === 'assistant' ? (
        <StructuredMessage
          content={displayRealContent}
          thoughts={msg.thoughts}
          tools={msg.toolActivities}
          labels={{
            thinking: lang === 'vi' ? 'Suy nghĩ' : 'Thinking',
            tools: lang === 'vi' ? 'Thao tác công cụ' : 'Tool activity',
          }}
        />
      ) : (
        <pre
          className={`text-[11px] whitespace-pre-wrap font-mono leading-relaxed ${
            isRevealed ? 'text-amber' : 'text-matrix/90'
          }`}
        >
          {isRevealed ? displayRealContent : fallbackDisguisedCode}
        </pre>
      )}
    </div>
  );
};

const AdminLoginModal: React.FC<{
  lang: AppLanguage;
  defaultUsername: string;
  isDefaultPassword: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ lang, defaultUsername, isDefaultPassword, onClose, onSuccess }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const [username, setUsername] = useState(defaultUsername || 'admin');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const passInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    passInputRef.current?.focus();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.ndevApi?.verifyAdminLogin) return;
    setVerifying(true);
    setError('');
    try {
      const res = await window.ndevApi.verifyAdminLogin({ username, password });
      if (res?.ok) {
        onSuccess();
      } else {
        setError(t.adminInvalidCredentials);
      }
    } catch {
      setError(t.adminInvalidCredentials);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-[#090e16] border border-mystic/60 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-[#0d1522] border-b border-border flex items-center justify-between">
          <span className="font-bold text-mystic flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-matrix" /> {t.adminLoginModalTitle}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            {t.escCloseLabel}
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-4 space-y-3.5 text-xs">
          <div className="p-2.5 rounded bg-[#06090e] border border-border text-[11px] text-slate-300 leading-relaxed">
            {t.adminLoginSubtitle}
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.adminUsernameLabel}
            </label>
            <div className="relative flex items-center">
              <UserCheck className="w-3.5 h-3.5 text-matrix absolute left-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#06090e] border border-border rounded pl-8 pr-2.5 py-1.5 text-matrix font-bold focus:outline-none focus:border-matrix"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.adminPasswordLabel}
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-3.5 h-3.5 text-amber absolute left-2.5" />
              <input
                ref={passInputRef}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.adminPasswordPlaceholder}
                className="w-full bg-[#06090e] border border-border rounded pl-8 pr-8 py-1.5 text-slate-100 focus:outline-none focus:border-mystic"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isDefaultPassword && (
            <div className="p-2 rounded bg-amber/10 border border-amber/30 text-[10px] text-amber">
              {t.adminDefaultHint}
            </div>
          )}

          {error && (
            <div className="p-2 rounded bg-red-500/15 border border-red-500/40 text-[10px] text-red-300 font-semibold">
              {error}
            </div>
          )}

          <div className="pt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border text-slate-400 hover:text-white text-xs"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              disabled={verifying || !username.trim() || !password}
              className="px-4 py-1.5 rounded bg-matrix/20 hover:bg-matrix/30 disabled:opacity-40 border border-matrix text-matrix font-bold text-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              {verifying ? t.adminVerifyingBtn : t.adminLoginBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HandoffModal: React.FC<{
  repo: RepoProfile;
  machineId: string;
  lang: AppLanguage;
  recentTurnsCount: number;
  standardStatus?: StandardStructureStatus | null;
  onScaffold?: () => void;
  onClose: () => void;
  onSave: (handoff: HandoffSummary) => void;
  onResetSession: () => void;
}> = ({
  repo,
  machineId,
  lang,
  recentTurnsCount,
  standardStatus,
  onScaffold,
  onClose,
  onSave,
  onResetSession,
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const [goal, setGoal] = useState(() =>
    localizeHandoffField(repo.handoff?.currentGoal || repo.contextSummary, 'goal', lang)
  );
  const [progress, setProgress] = useState(() =>
    localizeHandoffField(repo.handoff?.recentProgress, 'progress', lang)
  );
  const [files, setFiles] = useState((repo.handoff?.touchedFiles || []).join(', '));
  const [nextSteps, setNextSteps] = useState(() =>
    localizeHandoffField(repo.handoff?.nextSteps, 'nextSteps', lang)
  );

  useEffect(() => {
    setGoal((prev) => localizeHandoffField(prev, 'goal', lang));
    setProgress((prev) => localizeHandoffField(prev, 'progress', lang));
    setNextSteps((prev) => localizeHandoffField(prev, 'nextSteps', lang));
  }, [lang]);

  const localSes = repo.sessionByMachine?.[machineId] || repo.agySessionByMachine?.[machineId];

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-[#090e16] border border-amber/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-2.5 bg-[#0d1522] border-b border-border flex items-center justify-between">
          <span className="font-bold text-amber flex items-center gap-2 text-xs">
            <FileSpreadsheet className="w-4 h-4" /> {t.handoffModalTitle} ({repo.name})
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            {t.escCloseLabel}
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          <div className="p-2.5 rounded bg-[#06090e] border border-border text-[11px] text-slate-300 space-y-1">
            <div>
              <span className="text-matrix font-semibold">{t.handoffHowItWorksTitle}</span>{' '}
              {t.handoffHowItWorksDesc(recentTurnsCount)}
            </div>
            <div className="text-[10px] text-slate-400">
              {t.currentMachineSessionLabel} ({machineId}):{' '}
              <span className="text-cyber font-semibold">
                {localSes ? `${localSes} (${t.sessionActiveSuffix})` : t.freshSessionPending}
              </span>
            </div>
          </div>

          {repo.localPath && (
            <div className="p-2 rounded bg-[#0b121d] border border-border flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 truncate text-slate-300">
                <FolderGit2 className="w-3.5 h-3.5 text-matrix shrink-0" />
                <span className="truncate">
                  {t.diskHandoffLinked}:{' '}
                  <span className="text-matrix font-mono">{repo.localPath}/handoff/latest.md</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const disk = await window.ndevApi?.readRepoHandoffDisk(repo.localPath);
                    if (disk) {
                      setGoal(disk.currentGoal || '');
                      setProgress(disk.recentProgress || '');
                      setFiles((disk.touchedFiles || []).join(', '));
                      setNextSteps(disk.nextSteps || '');
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-[#131e2e] hover:bg-[#1a293d] border border-border text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                  title={t.reloadFromDiskBtn}
                >
                  <RefreshCw className="w-2.5 h-2.5 text-cyber" /> {t.reloadFromDiskBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.ndevApi?.openPathInExplorer(repo.localPath + '/handoff/latest.md');
                  }}
                  className="px-2 py-0.5 rounded bg-matrix/10 hover:bg-matrix/20 border border-matrix/40 text-[10px] text-matrix font-semibold flex items-center gap-1"
                  title={t.openLatestHandoffBtn}
                >
                  <FileText className="w-2.5 h-2.5" /> {t.openLatestHandoffBtn}
                </button>
                {standardStatus && !standardStatus.isStandard && onScaffold && (
                  <button
                    type="button"
                    onClick={onScaffold}
                    className="px-2 py-0.5 rounded bg-amber/20 hover:bg-amber/30 border border-amber/60 text-[10px] text-amber font-bold flex items-center gap-1"
                    title={t.scaffoldStandardBtn}
                  >
                    <AlertCircle className="w-2.5 h-2.5 text-amber" /> {t.scaffoldStandardBtn}
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.fieldCurrentGoal}
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t.fieldCurrentGoalPlaceholder}
              className="w-full bg-[#06090e] border border-border rounded px-2.5 py-1.5 text-matrix"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.fieldRecentProgress}
            </label>
            <textarea
              rows={3}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder={t.fieldRecentProgressPlaceholder}
              className="w-full bg-[#06090e] border border-border rounded px-2.5 py-1.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.fieldTouchedFiles}
            </label>
            <input
              type="text"
              value={files}
              onChange={(e) => setFiles(e.target.value)}
              placeholder={t.fieldTouchedFilesPlaceholder}
              className="w-full bg-[#06090e] border border-border rounded px-2.5 py-1.5 text-cyber"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              {t.fieldNextSteps}
            </label>
            <textarea
              rows={2}
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder={t.fieldNextStepsPlaceholder}
              className="w-full bg-[#06090e] border border-border rounded px-2.5 py-1.5 text-amber"
            />
          </div>
        </div>

        <div className="px-4 py-2.5 bg-[#0d1522] border-t border-border flex items-center justify-between gap-2">
          <button
            onClick={onResetSession}
            className="px-3 py-1 rounded bg-amber/15 border border-amber/40 text-amber hover:bg-amber/25 text-xs flex items-center gap-1"
            title={t.resetAndLoadHandoffTooltip}
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.resetAndLoadHandoffBtn}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded border border-border text-slate-400 hover:text-white text-xs"
            >
              {t.closeBtn}
            </button>
            <button
              onClick={() =>
                onSave({
                  currentGoal: goal,
                  recentProgress: progress,
                  touchedFiles: files
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  nextSteps,
                  updatedAt: new Date().toISOString(),
                  sourceMachineId: machineId,
                })
              }
              className="px-4 py-1 rounded bg-matrix/20 border border-matrix text-matrix font-bold text-xs hover:bg-matrix/30"
            >
              {t.saveHandoffBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{
  settings: AppSettings;
  onClose: () => void;
  onReposUpdated?: (repos: RepoProfile[]) => void;
  onSettingsUpdated?: (settings: AppSettings) => void;
  onLanguagePreviewChange?: (lang: AppLanguage) => void;
  onSave: (next: AppSettings) => void;
}> = ({
  settings,
  onClose,
  onReposUpdated,
  onSettingsUpdated,
  onLanguagePreviewChange,
  onSave,
}) => {
  const [draft, setDraft] = useState<AppSettings>(() => {
    const cloned = JSON.parse(JSON.stringify(settings));
    cloned.hotkeys = { ...DEFAULT_HOTKEYS, ...(cloned.hotkeys || {}) };
    cloned.typography = { ...DEFAULT_TYPOGRAPHY, ...(cloned.typography || {}) };
    return cloned;
  });
  const [recordingHotkeyField, setRecordingHotkeyField] = useState<keyof HotkeyConfig | null>(
    null
  );

  const standardClaudeModels = [
    'claude-sonnet-5-5',
    'claude-opus-5-5',
    'claude-fable-5-2',
    'claude-haiku-5-5',
    'sonnet',
    'opus',
    'haiku',
  ];
  const standardAgyModels = [
    'Gemini 4 Argon',
    'Gemini 3.8 Flash',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'Claude Fable 5.2',
    'GPT-OSS 120B (Medium)',
  ];

  const [isCustomClaudeModel, setIsCustomClaudeModel] = useState<boolean>(() => {
    const cur = settings.engine.claudeModel || 'claude-sonnet-5-5';
    return !standardClaudeModels.includes(cur);
  });
  const [isCustomAgyModel, setIsCustomAgyModel] = useState<boolean>(() => {
    const cur = settings.engine.antigravityModel || 'Gemini 4 Argon';
    return !standardAgyModels.includes(cur);
  });
  const [gdriveTesting, setGdriveTesting] = useState(false);
  const [gdriveTestResult, setGdriveTestResult] = useState<{
    ok?: boolean;
    kind?:
      | 'sa-loaded'
      | 'testing-progress'
      | 'test-success'
      | 'test-fail'
      | 'oauth-wait'
      | 'oauth-success'
      | 'oauth-fail'
      | 'raw';
    email?: string;
    syncedCount?: number;
    folderName?: string;
    folderId?: string;
    rawError?: string;
    folderWebUrl?: string;
  }>({});

  // Section 1: Engine Auto-Scan & Auth Login states
  const [engineScanItems, setEngineScanItems] = useState<EngineScanItem[]>([]);
  const [isScanningEngines, setIsScanningEngines] = useState<boolean>(false);
  const [engineLoginTarget, setEngineLoginTarget] = useState<EngineScanItem | null>(null);
  const [loginKeyInput, setLoginKeyInput] = useState<string>('');

  // Section 4: Super Admin password update states
  const [adminNewUsername, setAdminNewUsername] = useState(
    settings.adminAuth?.username || 'admin'
  );
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminUpdateStatus, setAdminUpdateStatus] = useState<{
    ok?: boolean;
    msg?: string;
  }>({});

  useEffect(() => {
    if (settings.language && settings.language !== draft.language) {
      setDraft((prev) => ({ ...prev, language: settings.language }));
    }
  }, [settings.language]);

  const currentLang: AppLanguage = draft.language || 'vi';
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.vi;

  const handleScanEngines = async (engineOverride?: AppSettings['engine']) => {
    if (!window.ndevApi?.scanEngines) return;
    setIsScanningEngines(true);
    try {
      const targetEngineCfg = engineOverride || draft.engine;
      const res = await window.ndevApi.scanEngines(targetEngineCfg);
      if (res?.items) {
        setEngineScanItems(res.items);
        if (engineLoginTarget) {
          const updatedTarget = res.items.find(
            (it: EngineScanItem) => it.engine === engineLoginTarget.engine
          );
          if (updatedTarget) setEngineLoginTarget(updatedTarget);
        }
      }
      if (res?.detectedPaths) {
        setDraft((prev) => ({
          ...prev,
          engine: {
            ...prev.engine,
            ...(engineOverride || {}),
            claudeCliPath: res.detectedPaths.claudeCliPath || prev.engine.claudeCliPath,
            antigravityCliPath:
              res.detectedPaths.antigravityCliPath || prev.engine.antigravityCliPath,
            codexCliPath: res.detectedPaths.codexCliPath || prev.engine.codexCliPath,
          },
        }));
      }
    } catch {
      // ignore scan error
    } finally {
      setIsScanningEngines(false);
    }
  };

  useEffect(() => {
    handleScanEngines(draft.engine);
  }, []);

  const handleManualBrowseEngine = async (engineType: EngineType) => {
    if (!window.ndevApi?.selectEngineBinary) return;
    const pickedPath = await window.ndevApi.selectEngineBinary(engineType);
    if (!pickedPath) return;

    const nextEngineCfg = {
      ...draft.engine,
      ...(engineType === 'claude-code'
        ? { claudeCliPath: pickedPath }
        : engineType === 'antigravity'
        ? { antigravityCliPath: pickedPath }
        : engineType === 'codex'
        ? { codexCliPath: pickedPath }
        : {}),
    };
    setDraft((prev) => ({
      ...prev,
      engine: nextEngineCfg,
    }));
    await handleScanEngines(nextEngineCfg);
  };

  const handleOpenEngineLoginModal = (item: EngineScanItem) => {
    setEngineLoginTarget(item);
    const existingKey =
      item.engine === 'claude-code'
        ? draft.engine.claudeApiKey || ''
        : item.engine === 'antigravity'
        ? draft.engine.antigravityApiKey || ''
        : item.engine === 'codex'
        ? draft.engine.codexApiKey || ''
        : draft.engine.deepseekApiKey || '';
    setLoginKeyInput(existingKey);
  };

  const handleSaveEngineLoginKey = async () => {
    if (!engineLoginTarget) return;
    const trimmedKey = loginKeyInput.trim();
    const eng = engineLoginTarget.engine;
    const nextEngineCfg = {
      ...draft.engine,
      ...(eng === 'claude-code'
        ? { claudeApiKey: trimmedKey }
        : eng === 'antigravity'
        ? { antigravityApiKey: trimmedKey }
        : eng === 'codex'
        ? { codexApiKey: trimmedKey }
        : { deepseekApiKey: trimmedKey }),
    };
    const nextSettings = {
      ...draft,
      engine: nextEngineCfg,
    };
    setDraft(nextSettings);
    await window.ndevApi?.saveSettings(nextSettings);
    onSettingsUpdated?.(nextSettings);
    await handleScanEngines(nextEngineCfg);
    setEngineLoginTarget(null);
  };

  const renderGdriveTestMessage = (): string => {
    if (!gdriveTestResult.kind) return '';
    switch (gdriveTestResult.kind) {
      case 'sa-loaded':
        return t.gdriveSaLoadedMsg(gdriveTestResult.email || '');
      case 'testing-progress':
        return t.gdriveTestingProgressMsg;
      case 'test-success':
        return t.gdriveTestSuccessMsg(
          gdriveTestResult.syncedCount ?? 0,
          gdriveTestResult.folderName || 'NdevTool_Sync',
          gdriveTestResult.email || '',
          gdriveTestResult.folderId || ''
        );
      case 'test-fail':
        return gdriveTestResult.rawError || t.gdriveTestFailMsg;
      case 'oauth-wait':
        return t.gdriveOAuthBrowserWaitMsg;
      case 'oauth-success':
        return t.gdriveOAuthSuccessMsg(
          gdriveTestResult.email || '',
          gdriveTestResult.syncedCount ?? 0,
          gdriveTestResult.folderName || 'NdevTool_Sync'
        );
      case 'oauth-fail':
        return gdriveTestResult.rawError || t.gdriveOAuthFailMsg;
      case 'raw':
      default:
        return gdriveTestResult.rawError || '';
    }
  };

  const handleBrowseSyncFolder = async () => {
    const picked = await window.ndevApi?.selectSyncFolder();
    if (picked) {
      setDraft({
        ...draft,
        sync: { ...draft.sync, localSyncFolderPath: picked },
      });
    }
  };

  const handlePickServiceAccount = async () => {
    try {
      const res = await window.ndevApi?.selectServiceAccountFile(currentLang);
      if (res?.content) {
        setDraft({
          ...draft,
          sync: {
            ...draft.sync,
            gdriveAuthMethod: 'service-account',
            gdriveServiceAccountJson: res.content,
            gdriveConnectedEmail: res.clientEmail || draft.sync.gdriveConnectedEmail,
          },
        });
        setGdriveTestResult({
          ok: true,
          kind: 'sa-loaded',
          email: res.clientEmail || '',
        });
      }
    } catch (e: any) {
      setGdriveTestResult({
        ok: false,
        kind: 'raw',
        rawError: e.message || String(e),
      });
    }
  };

  const handleTestAndCreateGDriveFolder = async () => {
    if (!window.ndevApi?.testGDriveConnection) return;
    setGdriveTesting(true);
    setGdriveTestResult({ kind: 'testing-progress' });
    try {
      const res = await window.ndevApi.testGDriveConnection(draft.sync, currentLang);
      if (res?.ok) {
        if (res.settings) setDraft({ ...res.settings, language: currentLang });
        if (res.repos && onReposUpdated) onReposUpdated(res.repos);
        setGdriveTestResult({
          ok: true,
          kind: 'test-success',
          syncedCount: res.syncedCount,
          folderName: res.folderName,
          email: res.email || '',
          folderId: res.folderId,
          folderWebUrl: res.folderWebUrl,
        });
      } else {
        setGdriveTestResult({
          ok: false,
          kind: 'test-fail',
          rawError: res?.error,
        });
      }
    } catch (e: any) {
      setGdriveTestResult({
        ok: false,
        kind: 'test-fail',
        rawError: e.message || String(e),
      });
    } finally {
      setGdriveTesting(false);
    }
  };

  const handleStartBrowserOAuth = async () => {
    if (!window.ndevApi?.startGDriveOAuth) return;
    setGdriveTesting(true);
    setGdriveTestResult({ kind: 'oauth-wait' });
    try {
      const res = await window.ndevApi.startGDriveOAuth(draft.sync, currentLang);
      if (res?.ok) {
        if (res.settings) setDraft({ ...res.settings, language: currentLang });
        if (res.repos && onReposUpdated) onReposUpdated(res.repos);
        setGdriveTestResult({
          ok: true,
          kind: 'oauth-success',
          email: res.email || '',
          syncedCount: res.syncedCount,
          folderName: res.folderName,
          folderWebUrl: res.folderWebUrl,
        });
      } else {
        setGdriveTestResult({
          ok: false,
          kind: 'oauth-fail',
          rawError: res?.error,
        });
      }
    } catch (e: any) {
      setGdriveTestResult({
        ok: false,
        kind: 'oauth-fail',
        rawError: e.message || String(e),
      });
    } finally {
      setGdriveTesting(false);
    }
  };

  const handleUpdateSuperAdmin = async () => {
    if (!adminCurrentPass || !adminNewPass) {
      setAdminUpdateStatus({ ok: false, msg: t.adminPasswordEmpty });
      return;
    }
    if (adminNewPass !== adminConfirmPass) {
      setAdminUpdateStatus({ ok: false, msg: t.adminPasswordMismatch });
      return;
    }
    const res = await window.ndevApi?.updateAdminCredentials({
      currentPassword: adminCurrentPass,
      newUsername: adminNewUsername,
      newPassword: adminNewPass,
      lang: currentLang,
    });
    if (res?.ok) {
      setAdminCurrentPass('');
      setAdminNewPass('');
      setAdminConfirmPass('');
      setAdminUpdateStatus({ ok: true, msg: t.adminUpdateSuccess });
      if (res.settings) {
        setDraft((prev) => ({
          ...prev,
          adminAuth: res.settings.adminAuth,
        }));
        onSettingsUpdated?.(res.settings);
      }
    } else {
      setAdminUpdateStatus({ ok: false, msg: res?.error || t.adminInvalidCredentials });
    }
  };

  const testResultMessage = renderGdriveTestMessage();
  const activeEngineInDraft = draft.engine.activeEngine;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl bg-[#090e16] border border-matrix/50 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 py-2.5 bg-[#0d1522] border-b border-border flex items-center justify-between">
          <span className="font-bold text-matrix flex items-center gap-2 text-xs">
            <Shield className="w-4 h-4" /> {t.settingsModalTitle}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">
            {t.escCloseLabel}
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Language, Engine & Model Selection, Continuity Strategy */}
          <div className="space-y-2.5 border border-border rounded p-3.5 bg-[#06090e]">
            <div className="font-bold text-cyber flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> {t.sec1Title}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Active Engine Selector */}
              <div>
                <label className="block text-[10px] text-matrix font-bold mb-1">
                  {t.defaultActiveEngineLabel}
                </label>
                <select
                  value={draft.engine.activeEngine}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      engine: { ...draft.engine, activeEngine: e.target.value as EngineType },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-matrix/50 rounded px-2 py-1 text-matrix font-bold"
                >
                  <option value="claude-code">{t.engineDescClaude}</option>
                  <option value="antigravity">{t.engineDescAgy}</option>
                  <option value="deepseek">{t.engineDescDeepseek}</option>
                  <option value="codex">{t.engineDescCodex}</option>
                </select>
              </div>

              {/* Active Model Selector for currently selected Engine */}
              <div>
                <label className="block text-[10px] text-cyber font-bold mb-1">
                  {t.activeModelForEngineLabel}
                </label>
                <div className="space-y-1.5">
                  <select
                    value={
                      activeEngineInDraft === 'claude-code'
                        ? isCustomClaudeModel
                          ? '__custom'
                          : draft.engine.claudeModel || 'claude-sonnet-5-5'
                        : activeEngineInDraft === 'antigravity'
                        ? isCustomAgyModel
                          ? '__custom'
                          : draft.engine.antigravityModel || 'Gemini 4 Argon'
                        : activeEngineInDraft === 'deepseek'
                        ? draft.engine.deepseekModel || 'deepseek-chat'
                        : draft.engine.codexModel || 'o3-mini'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeEngineInDraft === 'claude-code') {
                        if (val === '__custom') {
                          setIsCustomClaudeModel(true);
                        } else {
                          setIsCustomClaudeModel(false);
                          setDraft({
                            ...draft,
                            engine: {
                              ...draft.engine,
                              claudeModel: val,
                            },
                          });
                        }
                      } else if (activeEngineInDraft === 'antigravity') {
                        if (val === '__custom') {
                          setIsCustomAgyModel(true);
                        } else {
                          setIsCustomAgyModel(false);
                          setDraft({
                            ...draft,
                            engine: {
                              ...draft.engine,
                              antigravityModel: val,
                            },
                          });
                        }
                      } else {
                        setDraft({
                          ...draft,
                          engine: {
                            ...draft.engine,
                            ...(activeEngineInDraft === 'deepseek'
                              ? { deepseekModel: val }
                              : { codexModel: val }),
                          },
                        });
                      }
                    }}
                    className="w-full bg-[#0b111a] border border-cyber/50 rounded px-2 py-1 text-cyber font-bold"
                  >
                    {activeEngineInDraft === 'claude-code' && (
                      <>
                        <option value="claude-sonnet-5-5">Claude Sonnet 5.5 (claude-sonnet-5-5)</option>
                        <option value="claude-opus-5-5">Claude Opus 5.5 (claude-opus-5-5)</option>
                        <option value="claude-fable-5-2">Claude Fable 5.2 (claude-fable-5-2)</option>
                        <option value="claude-haiku-5-5">Claude Haiku 5.5 (claude-haiku-5-5)</option>
                        <option value="sonnet">Claude Sonnet (legacy: sonnet)</option>
                        <option value="opus">Claude Opus (legacy: opus)</option>
                        <option value="haiku">Claude Haiku (legacy: haiku)</option>
                        <option value="__custom">{t.modelCustomOption}</option>
                      </>
                    )}
                    {activeEngineInDraft === 'antigravity' && (
                      <>
                        <option value="Gemini 4 Argon">Gemini 4 Argon</option>
                        <option value="Gemini 3.8 Flash">Gemini 3.8 Flash</option>
                        <option value="Claude Opus 5.5">Claude Opus 5.5 (AGY)</option>
                        <option value="Claude Sonnet 5.5">Claude Sonnet 5.5 (AGY)</option>
                        <option value="Claude Fable 5.2">Claude Fable 5.2 (AGY)</option>
                        <option value="GPT-OSS 120B (Medium)">GPT-OSS 120B (Medium)</option>
                        <option value="__custom">{t.modelCustomOption}</option>
                      </>
                    )}
                    {activeEngineInDraft === 'deepseek' && (
                      <>
                        <option value="deepseek-chat">DeepSeek-V3 (deepseek-chat)</option>
                        <option value="deepseek-reasoner">DeepSeek-R1 (deepseek-reasoner)</option>
                      </>
                    )}
                    {activeEngineInDraft === 'codex' && (
                      <>
                        <option value="o3-mini">OpenAI o3-mini</option>
                        <option value="o1">OpenAI o1</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                      </>
                    )}
                  </select>

                  {activeEngineInDraft === 'claude-code' && isCustomClaudeModel && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={draft.engine.claudeModel || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            engine: {
                              ...draft.engine,
                              claudeModel: e.target.value,
                            },
                          })
                        }
                        placeholder={t.customModelPlaceholder}
                        className="w-full bg-[#06090e] border border-matrix/50 rounded px-2.5 py-1 text-matrix font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {activeEngineInDraft === 'antigravity' && isCustomAgyModel && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={draft.engine.antigravityModel || ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            engine: {
                              ...draft.engine,
                              antigravityModel: e.target.value,
                            },
                          })
                        }
                        placeholder={t.customModelPlaceholder}
                        className="w-full bg-[#06090e] border border-matrix/50 rounded px-2.5 py-1 text-matrix font-mono text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.uiLanguageLabel}
                </label>
                <select
                  value={currentLang}
                  onChange={(e) => {
                    const nextLang = e.target.value as AppLanguage;
                    setDraft({
                      ...draft,
                      language: nextLang,
                    });
                    onLanguagePreviewChange?.(nextLang);
                  }}
                  className="w-full bg-[#0b111a] border border-mystic/40 rounded px-2 py-1 text-mystic font-bold"
                >
                  <option value="vi">{t.langOptionVi}</option>
                  <option value="en">{t.langOptionEn}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.continuityStrategyLabel}
                </label>
                <select
                  value={draft.engine.continuityStrategy || 'smart-handoff'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      engine: {
                        ...draft.engine,
                        continuityStrategy: e.target.value as ContinuityStrategy,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-amber"
                >
                  <option value="smart-handoff">{t.strategySmartHandoff}</option>
                  <option value="always-handoff">{t.strategyAlwaysHandoff}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.claudeCliPathLabel}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={draft.engine.claudeCliPath}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        engine: { ...draft.engine, claudeCliPath: e.target.value },
                      })
                    }
                    className="flex-1 bg-[#0b111a] border border-border rounded px-2 py-1 text-matrix"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualBrowseEngine('claude-code')}
                    className="px-2 py-1 rounded bg-border hover:bg-slate-700 text-slate-200 text-[10px] whitespace-nowrap"
                  >
                    {t.engineManualBrowseBtn}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.antigravityCliPathLabel}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={draft.engine.antigravityCliPath || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        engine: { ...draft.engine, antigravityCliPath: e.target.value },
                      })
                    }
                    className="flex-1 bg-[#0b111a] border border-border rounded px-2 py-1 text-amber"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualBrowseEngine('antigravity')}
                    className="px-2 py-1 rounded bg-border hover:bg-slate-700 text-slate-200 text-[10px] whitespace-nowrap"
                  >
                    {t.engineManualBrowseBtn}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.recentTurnsCountLabel}
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={draft.engine.recentTurnsCount || 6}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      engine: {
                        ...draft.engine,
                        recentTurnsCount: Number(e.target.value) || 6,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-matrix"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.deepseekApiKeyLabel}
                </label>
                <input
                  type="password"
                  value={draft.engine.deepseekApiKey || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      engine: { ...draft.engine, deepseekApiKey: e.target.value },
                    })
                  }
                  placeholder="sk-..."
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>

            {/* Engine Auto-Scanner, Auth Warning & Login / Manual Browse Panel */}
            <div className="mt-3 pt-3 border-t border-border/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-matrix flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyber" />
                    {t.engineScannerTitle}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {t.engineManualBrowseHint}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isScanningEngines}
                  onClick={() => handleScanEngines(draft.engine)}
                  className="px-2.5 py-1 rounded bg-cyber/15 hover:bg-cyber/25 border border-cyber/50 text-cyber font-bold text-[10px] flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningEngines ? 'animate-spin' : ''}`} />
                  {isScanningEngines ? t.engineScanningBtn : t.engineScanBtn}
                </button>
              </div>

              {engineScanItems.some((it) => !it.found || !it.authenticated) && (
                <div className="p-2 rounded bg-amber/10 border border-amber/40 text-amber text-[10px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber" />
                  <span>{t.engineWarningBanner}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {engineScanItems.map((item) => {
                  const isActive = draft.engine.activeEngine === item.engine;
                  const isAllReady = item.found && item.authenticated;
                  return (
                    <div
                      key={item.engine}
                      className={`p-2.5 rounded border space-y-1.5 ${
                        !isAllReady
                          ? 'bg-[#120d0e] border-amber/50'
                          : isActive
                          ? 'bg-[#091520] border-matrix/60'
                          : 'bg-[#090f17] border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold text-[11px] text-slate-100 flex items-center gap-1.5 truncate">
                          {item.name}
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-matrix/20 border border-matrix/40 text-matrix text-[9px]">
                              ACTIVE
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono truncate">
                          {item.version || ''}
                        </span>
                      </div>

                      {/* Binary Found / Missing Status + Auth Status */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                            item.found
                              ? 'bg-matrix/15 border-matrix/40 text-matrix'
                              : 'bg-red-500/15 border-red-500/40 text-red-400'
                          }`}
                        >
                          {item.found ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {item.found ? t.engineStatusFound : t.engineStatusMissing}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                            item.authenticated
                              ? 'bg-cyber/15 border-cyber/40 text-cyber'
                              : 'bg-amber/20 border-amber/50 text-amber'
                          }`}
                        >
                          {item.authenticated ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          {item.authenticated ? t.engineAuthOk : t.engineAuthMissing}
                        </span>
                      </div>

                      <div
                        className="text-[10px] text-slate-400 font-mono truncate"
                        title={item.binaryPath}
                      >
                        Path: <span className="text-slate-300">{item.binaryPath}</span>
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          item.authenticated ? 'text-matrix/90' : 'text-amber'
                        }`}
                        title={item.authDetail}
                      >
                        Auth: {item.authDetail}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEngineLoginModal(item)}
                          className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${
                            !item.authenticated
                              ? 'bg-amber/25 hover:bg-amber/35 border border-amber text-amber animate-pulse'
                              : 'bg-[#111c2b] hover:bg-[#18263a] border border-border text-slate-300'
                          }`}
                        >
                          <KeyRound className="w-3 h-3" />
                          {t.engineLoginBtn}
                        </button>

                        {item.canBrowseBinary && (
                          <button
                            type="button"
                            onClick={() => handleManualBrowseEngine(item.engine)}
                            className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 ${
                              !item.found
                                ? 'bg-cyber/20 hover:bg-cyber/30 border border-cyber text-cyber font-bold'
                                : 'bg-[#0d1520] hover:bg-[#152234] border border-border text-slate-300'
                            }`}
                          >
                            <FolderGit2 className="w-3 h-3" />
                            {t.engineManualBrowseBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Real Google Drive Folder & Cloud Handoff Transport */}
          <div className="space-y-2.5 border border-matrix/40 rounded p-3.5 bg-[#06090e]">
            <div className="flex items-center justify-between">
              <div className="font-bold text-matrix flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" /> {t.sec2Title}
              </div>
              {draft.sync.gdriveFolderWebUrl && (
                <button
                  onClick={() => window.ndevApi?.openExternalUrl(draft.sync.gdriveFolderWebUrl)}
                  className="px-2 py-0.5 rounded bg-cyber/15 border border-cyber/40 text-cyber text-[10px] font-bold hover:bg-cyber/25"
                >
                  {t.gdriveOpenWebFolderBtn}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.transportChannelLabel}
                </label>
                <select
                  value={draft.sync.mode}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: {
                        ...draft.sync,
                        mode: e.target.value as AppSettings['sync']['mode'],
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                >
                  <option value="both">{t.transportBoth}</option>
                  <option value="gdrive-api">{t.transportGdriveApi}</option>
                  <option value="folder">{t.transportFolder}</option>
                  <option value="git-repo">{t.transportGitRepo}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-matrix font-semibold mb-1">
                  {t.gdriveFolderNameLabel}
                </label>
                <input
                  type="text"
                  value={draft.sync.gdriveFolderName || 'NdevTool_Sync'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: { ...draft.sync, gdriveFolderName: e.target.value },
                    })
                  }
                  placeholder="NdevTool_Sync"
                  className="w-full bg-[#0b111a] border border-matrix/40 rounded px-2 py-1 text-matrix font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.gdriveFolderIdLabel}
                </label>
                <input
                  type="text"
                  value={draft.sync.gdriveFolderId || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: { ...draft.sync, gdriveFolderId: e.target.value },
                    })
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-cyber"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.gdriveAuthMethodLabel}
                </label>
                <select
                  value={draft.sync.gdriveAuthMethod || 'token'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: {
                        ...draft.sync,
                        gdriveAuthMethod: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-amber/40 rounded px-2 py-1 text-amber font-semibold"
                >
                  <option value="token">{t.gdriveAuthOptionToken}</option>
                  <option value="oauth-browser">{t.gdriveAuthOptionBrowser}</option>
                  <option value="service-account">{t.gdriveAuthOptionSa}</option>
                </select>
              </div>

              {(draft.sync.gdriveAuthMethod || 'token') === 'token' && (
                <div className="col-span-2 space-y-1.5 bg-[#09101a] p-2.5 rounded border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-300 font-semibold">
                      {t.gdriveTokenLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        window.ndevApi?.openExternalUrl(
                          'https://developers.google.com/oauthplayground/#step1&apisSelect=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&url=https%3A%2F%2F&content_type=application%2Fjson&http_method=GET&useDefaultOauthCred=checked'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-cyber/15 hover:bg-cyber/25 border border-cyber/40 text-cyber text-[10px] font-semibold"
                    >
                      {t.gdriveGetPlaygroundTokenBtn}
                    </button>
                  </div>
                  <input
                    type="password"
                    value={draft.sync.gdriveAccessToken || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sync: { ...draft.sync, gdriveAccessToken: e.target.value },
                      })
                    }
                    placeholder={t.gdriveTokenPlaceholder}
                    className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                  />
                </div>
              )}

              {draft.sync.gdriveAuthMethod === 'oauth-browser' && (
                <div className="col-span-2 grid grid-cols-2 gap-2.5 bg-[#09101a] p-2.5 rounded border border-border">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      {t.gdriveClientIdLabel}
                    </label>
                    <input
                      type="text"
                      value={draft.sync.gdriveClientId || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          sync: { ...draft.sync, gdriveClientId: e.target.value },
                        })
                      }
                      placeholder="123456789-abc.apps.googleusercontent.com"
                      className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      {t.gdriveClientSecretLabel}
                    </label>
                    <input
                      type="password"
                      value={draft.sync.gdriveClientSecret || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          sync: { ...draft.sync, gdriveClientSecret: e.target.value },
                        })
                      }
                      placeholder="GOCSPX-..."
                      className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      {draft.sync.gdriveConnectedEmail
                        ? t.gdriveConnectedEmailStatus(draft.sync.gdriveConnectedEmail)
                        : t.gdriveAutoRefreshHint}
                    </span>
                    <button
                      type="button"
                      disabled={gdriveTesting}
                      onClick={handleStartBrowserOAuth}
                      className="px-3 py-1 rounded bg-amber/20 hover:bg-amber/30 border border-amber/50 text-amber font-bold text-[11px]"
                    >
                      {t.gdriveSignInBrowserBtn}
                    </button>
                  </div>
                </div>
              )}

              {draft.sync.gdriveAuthMethod === 'service-account' && (
                <div className="col-span-2 space-y-1.5 bg-[#09101a] p-2.5 rounded border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-300 font-semibold">
                      {t.gdriveServiceAccountLabel}
                    </label>
                    <button
                      type="button"
                      onClick={handlePickServiceAccount}
                      className="px-2 py-0.5 rounded bg-border hover:bg-slate-700 text-slate-200 text-[10px]"
                    >
                      {t.gdrivePickSaFileBtn}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={draft.sync.gdriveServiceAccountJson || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sync: { ...draft.sync, gdriveServiceAccountJson: e.target.value },
                      })
                    }
                    placeholder='{"type": "service_account", "client_email": "...", "private_key": "..."}'
                    className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200 font-mono text-[10px]"
                  />
                  <div className="text-[10px] text-amber/90">{t.gdriveSaNote}</div>
                </div>
              )}

              <div className="col-span-2 flex flex-col gap-1.5">
                <button
                  type="button"
                  disabled={gdriveTesting}
                  onClick={handleTestAndCreateGDriveFolder}
                  className="w-full py-1.5 px-3 rounded bg-matrix/20 hover:bg-matrix/30 disabled:opacity-50 border border-matrix text-matrix font-bold text-[11px] flex items-center justify-center gap-2"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  {gdriveTesting ? t.gdriveTestingBtn : t.gdriveTestAndCreateFolderBtn}
                </button>

                {testResultMessage && (
                  <div
                    className={`p-2 rounded border text-[10px] flex items-center justify-between gap-2 ${
                      gdriveTestResult.ok === false
                        ? 'bg-red-500/10 border-red-500/40 text-red-300'
                        : 'bg-matrix/10 border-matrix/40 text-matrix'
                    }`}
                  >
                    <span>{testResultMessage}</span>
                    {gdriveTestResult.folderWebUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          window.ndevApi?.openExternalUrl(gdriveTestResult.folderWebUrl)
                        }
                        className="px-2 py-0.5 rounded bg-cyber/20 border border-cyber text-cyber font-bold whitespace-nowrap"
                      >
                        {t.gdriveOpenWebFolderBtn}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.syncFolderLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.sync.localSyncFolderPath}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sync: { ...draft.sync, localSyncFolderPath: e.target.value },
                      })
                    }
                    placeholder={t.syncFolderPlaceholder}
                    className="flex-1 bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                  />
                  <button
                    onClick={handleBrowseSyncFolder}
                    className="px-2.5 py-1 rounded bg-border hover:bg-slate-700 text-slate-200"
                  >
                    {t.browseBtn}
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-amber" /> {t.aesPassphraseLabel}
                </label>
                <input
                  type="password"
                  value={draft.sync.encryptionPassphrase || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: { ...draft.sync, encryptionPassphrase: e.target.value },
                    })
                  }
                  placeholder={t.aesPlaceholder}
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Stealth, Global Hotkeys & OS Startup */}
          <div className="space-y-3 border border-border rounded p-3.5 bg-[#06090e]">
            <div className="font-bold text-mystic">{t.sec3Title}</div>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.autoStartOs}
                  onChange={(e) => setDraft({ ...draft, autoStartOs: e.target.checked })}
                />
                <span>{t.autoStartCheckbox}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.alwaysOnTop}
                  onChange={(e) => setDraft({ ...draft, alwaysOnTop: e.target.checked })}
                />
                <span>{t.alwaysOnTopCheckbox}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.sync.autoSync}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sync: { ...draft.sync, autoSync: e.target.checked },
                    })
                  }
                />
                <span>{t.autoSyncCheckbox}</span>
              </label>
            </div>

            {/* Global Hotkeys Configuration Sub-Panel */}
            <div className="border-t border-border/70 pt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-cyber">{t.hotkeysSectionTitle}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.hotkeysSectionDesc}</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      hotkeys: { ...DEFAULT_HOTKEYS },
                    })
                  }
                  className="px-2.5 py-1 rounded bg-border hover:bg-slate-700 text-slate-200 text-[10px] whitespace-nowrap shrink-0"
                >
                  {t.hotkeyResetDefaultBtn}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { key: 'holdPeekKey', label: t.hotkeyHoldPeekLabel },
                    { key: 'toggleAppVisibility', label: t.hotkeyToggleAppLabel },
                    { key: 'toggleWidgetMode', label: t.hotkeyToggleWidgetLabel },
                    { key: 'quitApp', label: t.hotkeyQuitAppLabel },
                    { key: 'toggleWatchBuf', label: t.hotkeyWatchBufLabel },
                    { key: 'toggleHandoff', label: t.hotkeyHandoffLabel },
                    { key: 'triggerSync', label: t.hotkeySyncLabel },
                  ] as { key: keyof HotkeyConfig; label: string }[]
                ).map(({ key, label }) => {
                  const isRecording = recordingHotkeyField === key;
                  const isHoldKeyField = key === 'holdPeekKey';
                  const currentVal = draft.hotkeys?.[key] || DEFAULT_HOTKEYS[key];
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded border ${
                        isHoldKeyField
                          ? 'col-span-2 bg-[#0a1422] border-cyber/40'
                          : key === 'toggleWatchBuf' ||
                            key === 'toggleHandoff' ||
                            key === 'triggerSync'
                          ? 'bg-[#09121d] border-amber/30'
                          : 'bg-[#090f17] border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-[10px] text-slate-300 font-semibold">
                          {label}
                        </label>
                        {isHoldKeyField && (
                          <div className="flex items-center gap-1">
                            {(['Alt', 'Control', 'Shift', 'CapsLock', 'Tab', 'F2', 'Backquote'] as const).map(
                              (preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    setDraft({
                                      ...draft,
                                      hotkeys: {
                                        ...DEFAULT_HOTKEYS,
                                        ...(draft.hotkeys || {}),
                                        holdPeekKey: preset,
                                      },
                                    });
                                    setRecordingHotkeyField(null);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                                    currentVal.toLowerCase() === preset.toLowerCase()
                                      ? 'bg-cyber/25 border-cyber text-cyber font-bold'
                                      : 'bg-[#0d1624] border-border text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {preset === 'Control'
                                    ? 'Ctrl'
                                    : preset === 'Backquote'
                                    ? '` (Tilde)'
                                    : preset}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={
                          isRecording
                            ? isHoldKeyField
                              ? t.hotkeyHoldPeekRecordingBadge
                              : t.hotkeyRecordingBadge
                            : currentVal
                        }
                        placeholder={t.hotkeyRecordPlaceholder}
                        onFocus={() => setRecordingHotkeyField(key)}
                        onClick={() => setRecordingHotkeyField(key)}
                        onBlur={() => {
                          if (recordingHotkeyField === key) setRecordingHotkeyField(null);
                        }}
                        onKeyDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.key === 'Escape') {
                            setRecordingHotkeyField(null);
                            return;
                          }
                          // Wait for keyup if user is pressing a standalone modifier key (Alt, Control, Shift, Meta)
                          if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
                            return;
                          }
                          const parts: string[] = [];
                          if (e.ctrlKey || e.metaKey) {
                            parts.push(isHoldKeyField ? 'Control' : 'CommandOrControl');
                          }
                          if (e.altKey) parts.push('Alt');
                          if (e.shiftKey) parts.push('Shift');

                          const mainKey = normalizeKeyEventName(e.key);
                          parts.push(mainKey);
                          const combo = parts.join('+');
                          setDraft({
                            ...draft,
                            hotkeys: {
                              ...DEFAULT_HOTKEYS,
                              ...(draft.hotkeys || {}),
                              [key]: combo,
                            },
                          });
                          setRecordingHotkeyField(null);
                        }}
                        onKeyUp={(e) => {
                          if (recordingHotkeyField !== key) return;
                          if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
                            e.preventDefault();
                            e.stopPropagation();
                            const modName = isHoldKeyField
                              ? normalizeKeyEventName(e.key)
                              : e.key === 'Control' || e.key === 'Meta'
                              ? 'CommandOrControl'
                              : e.key;
                            setDraft({
                              ...draft,
                              hotkeys: {
                                ...DEFAULT_HOTKEYS,
                                ...(draft.hotkeys || {}),
                                [key]: modName,
                              },
                            });
                            setRecordingHotkeyField(null);
                          }
                        }}
                        className={`w-full rounded px-2 py-1 font-mono text-[11px] cursor-pointer focus:outline-none ${
                          isRecording
                            ? 'bg-amber/20 border border-amber text-amber font-bold animate-pulse'
                            : isHoldKeyField
                            ? 'bg-[#0b111a] border border-cyber/50 text-cyber font-semibold hover:border-cyber'
                            : 'bg-[#0b111a] border border-matrix/40 text-matrix font-semibold hover:border-matrix'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Typography, Font Size & Display Styles */}
          <div className="space-y-3 border border-border rounded p-3.5 bg-[#06090e]">
            <div className="font-bold text-cyber flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-matrix" />
                {t.secTypographyTitle}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    typography: { ...DEFAULT_TYPOGRAPHY },
                  })
                }
                className="px-2.5 py-0.5 rounded bg-border hover:bg-slate-700 text-slate-300 text-[10px] font-normal"
              >
                {t.hotkeyResetDefaultBtn}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Font Family */}
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                  {t.fontFamilyLabel}
                </label>
                <select
                  value={draft.typography?.fontFamily || 'jetbrains-mono'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...DEFAULT_TYPOGRAPHY,
                        ...(draft.typography || {}),
                        fontFamily: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-matrix/50 rounded px-2 py-1 text-matrix font-semibold focus:outline-none"
                >
                  <option value="jetbrains-mono">JetBrains Mono (Hacker Default)</option>
                  <option value="fira-code">Fira Code (Ligatures)</option>
                  <option value="cascadia-code">Cascadia Code (Windows Terminal)</option>
                  <option value="consolas">Consolas (Classic Clean)</option>
                  <option value="roboto-mono">Roboto Mono (Modern Monospace)</option>
                  <option value="source-code-pro">Source Code Pro (Adobe Code)</option>
                  <option value="courier-new">Courier New (Typewriter Vintage)</option>
                  <option value="custom">-- Custom System Font... --</option>
                </select>

                {draft.typography?.fontFamily === 'custom' && (
                  <input
                    type="text"
                    value={draft.typography?.customFontFamily || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        typography: {
                          ...DEFAULT_TYPOGRAPHY,
                          ...(draft.typography || {}),
                          customFontFamily: e.target.value,
                        },
                      })
                    }
                    placeholder={t.customFontPlaceholder}
                    className="mt-1.5 w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                  {t.fontSizeLabel}
                </label>
                <select
                  value={draft.typography?.fontSize || 'sm'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...DEFAULT_TYPOGRAPHY,
                        ...(draft.typography || {}),
                        fontSize: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-cyber/50 rounded px-2 py-1 text-cyber font-semibold focus:outline-none"
                >
                  <option value="xs">{t.sizeXs}</option>
                  <option value="sm">{t.sizeSm}</option>
                  <option value="base">{t.sizeBase}</option>
                  <option value="lg">{t.sizeLg}</option>
                  <option value="xl">{t.sizeXl}</option>
                </select>
              </div>

              {/* Display Style Variant */}
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">
                  {t.fontStyleVariantLabel}
                </label>
                <select
                  value={draft.typography?.fontStyleVariant || 'standard'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...DEFAULT_TYPOGRAPHY,
                        ...(draft.typography || {}),
                        fontStyleVariant: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-mystic/50 rounded px-2 py-1 text-mystic font-semibold focus:outline-none"
                >
                  <option value="standard">{t.styleStandard}</option>
                  <option value="matrix-glow">{t.styleMatrixGlow}</option>
                  <option value="cyber-neon">{t.styleCyberNeon}</option>
                  <option value="hacker-crisp">{t.styleHackerCrisp}</option>
                  <option value="terminal-amber">{t.styleTerminalAmber}</option>
                </select>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.lineHeightLabel}
                </label>
                <select
                  value={draft.typography?.lineHeight || 'normal'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...DEFAULT_TYPOGRAPHY,
                        ...(draft.typography || {}),
                        lineHeight: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200 focus:outline-none"
                >
                  <option value="tight">{t.lineHeightTight}</option>
                  <option value="normal">{t.lineHeightNormal}</option>
                  <option value="relaxed">{t.lineHeightRelaxed}</option>
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.fontWeightLabel}
                </label>
                <select
                  value={draft.typography?.fontWeight || 'normal'}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      typography: {
                        ...DEFAULT_TYPOGRAPHY,
                        ...(draft.typography || {}),
                        fontWeight: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200 focus:outline-none"
                >
                  <option value="normal">{t.weightNormal}</option>
                  <option value="medium">{t.weightMedium}</option>
                  <option value="semibold">{t.weightSemibold}</option>
                  <option value="bold">{t.weightBold}</option>
                </select>
              </div>

              {/* Quick Info Badge */}
              <div className="flex flex-col justify-end">
                <div className="text-[10px] text-slate-400 bg-[#09111c] border border-border/80 rounded p-2">
                  <span className="text-matrix font-semibold">Active: </span>
                  <span className="font-mono">
                    {getFontSizePixels(draft.typography?.fontSize || 'sm')} / {draft.typography?.fontFamily || 'jetbrains-mono'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Typography Preview Box */}
            <div className="mt-2 border border-border/70 rounded p-3 bg-[#04070d]">
              <div className="flex items-center justify-between text-[10px] text-cyber font-bold border-b border-border/60 pb-1.5 mb-2">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-matrix" />
                  {t.typographyPreviewLabel}
                </span>
                <span className="text-slate-400 text-[9px] font-mono">
                  {draft.typography?.fontFamily || 'jetbrains-mono'} · {getFontSizePixels(draft.typography?.fontSize || 'sm')} · {draft.typography?.fontStyleVariant || 'standard'}
                </span>
              </div>
              <div
                className="p-3 rounded bg-[#070c14] border border-border/80 overflow-hidden"
                style={{
                  fontFamily: getFontFamilyCSS(draft.typography?.fontFamily || 'jetbrains-mono', draft.typography?.customFontFamily),
                  fontSize: getFontSizePixels(draft.typography?.fontSize || 'sm'),
                  lineHeight: getLineHeightValue(draft.typography?.lineHeight || 'normal'),
                  fontWeight: getFontWeightValue(draft.typography?.fontWeight || 'normal'),
                  textShadow: getStyleVariantProperties(draft.typography?.fontStyleVariant || 'standard').textShadow,
                  letterSpacing: getStyleVariantProperties(draft.typography?.fontStyleVariant || 'standard').letterSpacing,
                }}
              >
                <div className="text-matrix font-mono">
                  pub unsafe fn kernel_trace_dispatch(frame: *mut DmaContext) -&gt; Result&lt;0x00_OK&gt; &#123;
                </div>
                <div className="text-slate-300 font-mono pl-4">
                  // NdevTool :: Stealth Hacker Coding Environment &amp; Cross-Machine Handoff
                </div>
                <div className="text-cyber font-mono pl-4">
                  mmu::sync_tlb_page(VirtAddr::new(0x7ff8b000));
                </div>
                <div className="text-amber font-mono pl-4">
                  println!("Font size &amp; style preview is active. Ready to deploy.");
                </div>
                <div className="text-matrix font-mono">&#125;</div>
              </div>
            </div>
          </div>

          {/* Section 5: Single Super Admin Credentials Management */}
          <div className="space-y-2.5 border border-mystic/40 rounded p-3.5 bg-[#06090e]">
            <div className="font-bold text-amber flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> {t.sec4Title}
            </div>
            <div className="grid grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.adminNewUsernameLabel}
                </label>
                <input
                  type="text"
                  value={adminNewUsername}
                  onChange={(e) => setAdminNewUsername(e.target.value)}
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-matrix font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.adminCurrentPasswordLabel}
                </label>
                <input
                  type="password"
                  value={adminCurrentPass}
                  onChange={(e) => setAdminCurrentPass(e.target.value)}
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.adminNewPasswordLabel}
                </label>
                <input
                  type="password"
                  value={adminNewPass}
                  onChange={(e) => setAdminNewPass(e.target.value)}
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  {t.adminConfirmPasswordLabel}
                </label>
                <input
                  type="password"
                  value={adminConfirmPass}
                  onChange={(e) => setAdminConfirmPass(e.target.value)}
                  className="w-full bg-[#0b111a] border border-border rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                {adminUpdateStatus.msg && (
                  <span
                    className={`text-[10px] font-semibold ${
                      adminUpdateStatus.ok ? 'text-matrix' : 'text-red-400'
                    }`}
                  >
                    {adminUpdateStatus.msg}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleUpdateSuperAdmin}
                className="px-3 py-1 rounded bg-mystic/20 hover:bg-mystic/30 border border-mystic/50 text-mystic font-bold text-[11px]"
              >
                {t.adminUpdateBtn}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-2.5 bg-[#0d1522] border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-border text-slate-400 hover:text-white text-xs"
          >
            {t.cancelBtn}
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-4 py-1 rounded bg-matrix/20 border border-matrix text-matrix font-bold text-xs hover:bg-matrix/30"
          >
            {t.saveApplyBtn}
          </button>
        </div>

        {/* Dedicated Engine Auth Login Modal when clicking "Đăng nhập / Auth Login" */}
        {engineLoginTarget && (
          <div
            onClick={() => setEngineLoginTarget(null)}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#08101a] border border-amber/60 rounded-lg shadow-2xl overflow-hidden text-xs font-mono"
            >
              <div className="px-4 py-2.5 bg-[#101a28] border-b border-border flex items-center justify-between">
                <span className="font-bold text-amber flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  {t.engineLoginModalTitle} :: {engineLoginTarget.name}
                </span>
                <button
                  type="button"
                  onClick={() => setEngineLoginTarget(null)}
                  className="text-slate-400 hover:text-white"
                >
                  {t.escCloseLabel}
                </button>
              </div>

              <div className="p-4 space-y-3.5">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {t.engineLoginModalSubtitle}
                </p>

                <div className="p-2.5 rounded bg-[#0b131e] border border-border/80 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Engine:</span>
                    <span className="text-matrix font-bold">{engineLoginTarget.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CLI Path:</span>
                    <span className="text-cyber truncate max-w-[300px]">
                      {engineLoginTarget.binaryPath}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span
                      className={
                        engineLoginTarget.authenticated
                          ? 'text-matrix font-bold'
                          : 'text-amber font-bold'
                      }
                    >
                      {engineLoginTarget.authDetail}
                    </span>
                  </div>
                </div>

                {/* Option 1: Launch Official Interactive CLI Login Window */}
                <div className="p-3 rounded bg-[#09121d] border border-cyber/40 space-y-2">
                  <div className="font-bold text-cyber text-[11px]">
                    {t.engineLoginCliSectionTitle}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Command: <code className="text-matrix">{engineLoginTarget.loginCommand}</code>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        window.ndevApi?.launchEngineCliLogin({
                          engine: engineLoginTarget.engine,
                          binaryPath: engineLoginTarget.binaryPath,
                        })
                      }
                      className="px-3 py-1.5 rounded bg-cyber/20 hover:bg-cyber/30 border border-cyber text-cyber font-bold text-[11px]"
                    >
                      {t.engineLoginCliBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScanEngines(draft.engine)}
                      className="px-2.5 py-1.5 rounded bg-matrix/15 hover:bg-matrix/25 border border-matrix/50 text-matrix font-semibold text-[10px] flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t.engineLoginRecheckBtn}
                    </button>
                  </div>
                </div>

                {/* Option 2: Direct API Key / Auth Token Input Form */}
                <div className="p-3 rounded bg-[#09121d] border border-matrix/40 space-y-2">
                  <div className="font-bold text-matrix text-[11px]">
                    {t.engineLoginKeySectionTitle}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      {engineLoginTarget.engine === 'claude-code'
                        ? 'Anthropic API Key / Claude Auth Token (ANTHROPIC_API_KEY)'
                        : engineLoginTarget.engine === 'antigravity'
                        ? 'Gemini / Antigravity API Key (GEMINI_API_KEY)'
                        : engineLoginTarget.engine === 'codex'
                        ? 'OpenAI Codex API Key (OPENAI_API_KEY)'
                        : 'DeepSeek Coder API Key (DEEPSEEK_API_KEY)'}
                    </label>
                    <input
                      type="password"
                      autoFocus
                      value={loginKeyInput}
                      onChange={(e) => setLoginKeyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEngineLoginKey();
                        }
                      }}
                      placeholder="sk-... / AIza..."
                      className="w-full bg-[#060a10] border border-matrix/50 rounded px-2.5 py-1.5 text-matrix font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEngineLoginTarget(null)}
                      className="px-3 py-1 rounded border border-border text-slate-400 hover:text-white text-[11px]"
                    >
                      {t.closeBtn}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEngineLoginKey}
                      className="px-3.5 py-1 rounded bg-matrix text-black font-bold hover:opacity-90 text-[11px]"
                    >
                      {t.engineLoginSaveKeyBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
