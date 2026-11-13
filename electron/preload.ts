import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('ndevApi', {
  getInitialState: () => ipcRenderer.invoke('get-initial-state'),
  setWidgetMode: (mode: boolean) => ipcRenderer.invoke('set-widget-mode', mode),
  togglePeekWindow: (forceState?: boolean) => ipcRenderer.invoke('toggle-peek-window', forceState),
  setPeekOpacity: (opacity: number) => ipcRenderer.invoke('set-peek-opacity', opacity),
  syncLiveBuffer: (payload: {
    realText: string;
    disguisedText: string;
    cursorIndex: number;
    language?: string;
    cipherLanguage?: string;
    recentMessages?: any[];
    attachments?: any[];
  }) => ipcRenderer.send('sync-live-buffer', payload),
  updateInputFromPeek: (realText: string) => ipcRenderer.send('peek-input-updated', realText),
  triggerSendFromPeek: () => ipcRenderer.send('peek-trigger-send'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  verifyAdminLogin: (payload: { username: string; password: string }) =>
    ipcRenderer.invoke('verify-admin-login', payload),
  updateAdminCredentials: (payload: {
    currentPassword: string;
    newUsername: string;
    newPassword: string;
    lang?: string;
  }) => ipcRenderer.invoke('update-admin-credentials', payload),
  selectRepoFolder: () => ipcRenderer.invoke('select-repo-folder'),
  selectSyncFolder: () => ipcRenderer.invoke('select-sync-folder'),
  saveRepoData: (repo: any) => ipcRenderer.invoke('save-repo-data', repo),
  createChatSession: (payload: { repoId: string; title?: string; withHandoff?: boolean }) =>
    ipcRenderer.invoke('create-chat-session', payload),
  selectChatSession: (payload: { repoId: string; sessionId: string }) =>
    ipcRenderer.invoke('select-chat-session', payload),
  renameChatSession: (payload: { repoId: string; sessionId: string; title: string }) =>
    ipcRenderer.invoke('rename-chat-session', payload),
  deleteChatSession: (payload: { repoId: string; sessionId: string }) =>
    ipcRenderer.invoke('delete-chat-session', payload),
  resetMachineSessionWithHandoff: (repoId: string, sessionId?: string) =>
    ipcRenderer.invoke('reset-machine-session-with-handoff', repoId, sessionId),
  triggerCloudSync: () => ipcRenderer.invoke('trigger-cloud-sync'),
  testGDriveConnection: (syncDraft: any, lang?: string) =>
    ipcRenderer.invoke('test-gdrive-connection', syncDraft, lang),
  startGDriveOAuth: (syncDraft: any, lang?: string) =>
    ipcRenderer.invoke('start-gdrive-oauth', syncDraft, lang),
  selectServiceAccountFile: (lang?: string) =>
    ipcRenderer.invoke('select-service-account-file', lang),
  scanEngines: (engineDraft?: any) => ipcRenderer.invoke('scan-engines', engineDraft),
  selectEngineBinary: (engine: string) => ipcRenderer.invoke('select-engine-binary', engine),
  launchEngineCliLogin: (payload: { engine: string; binaryPath?: string }) =>
    ipcRenderer.invoke('launch-engine-cli-login', payload),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  saveClipboardAttachment: (payload: {
    name?: string;
    mimeType: string;
    dataBase64: string;
  }) => ipcRenderer.invoke('save-clipboard-attachment', payload),
  attachLocalFiles: (filePaths: string[]) =>
    ipcRenderer.invoke('attach-local-files', filePaths),
  selectChatAttachments: () => ipcRenderer.invoke('select-chat-attachments'),
  getFilePath: (file: File) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
      return (file as any)?.path || '';
    } catch {
      return (file as any)?.path || '';
    }
  },
  sendEnginePrompt: (payload: {
    repoId: string;
    sessionId?: string;
    prompt: string;
    disguisedHeader: string;
    disguisedCodeBlock: string;
    attachments?: any[];
    modelOverride?: string;
    effortOverride?: string;
    skipPermissionsOverride?: boolean;
  }) => ipcRenderer.invoke('send-engine-prompt', payload),
  abortEngine: () => ipcRenderer.invoke('abort-engine'),
  checkStandardStructure: (folderPath: string) =>
    ipcRenderer.invoke('check-standard-structure', folderPath),
  scaffoldStandardStructure: (folderPath: string, repoName: string, branch?: string) =>
    ipcRenderer.invoke('scaffold-standard-structure', folderPath, repoName, branch),
  readRepoHandoffDisk: (folderPath: string) =>
    ipcRenderer.invoke('read-repo-handoff-disk', folderPath),
  writeRepoHandoffDisk: (folderPath: string, handoff: any, branch?: string) =>
    ipcRenderer.invoke('write-repo-handoff-disk', folderPath, handoff, branch),
  openPathInExplorer: (targetPath: string) =>
    ipcRenderer.invoke('open-path-in-explorer', targetPath),
  onStreamEvent: (cb: (data: any) => void) => {
    const listener = (_e: any, data: any) => cb(data);
    ipcRenderer.on('engine-stream-event', listener);
    return () => ipcRenderer.removeListener('engine-stream-event', listener);
  },
  onWidgetModeChanged: (cb: (mode: boolean) => void) => {
    const listener = (_e: any, mode: any) => cb(mode);
    ipcRenderer.on('widget-mode-changed', listener);
    return () => ipcRenderer.removeListener('widget-mode-changed', listener);
  },
  onLiveBufferUpdated: (cb: (payload: any) => void) => {
    const listener = (_e: any, payload: any) => cb(payload);
    ipcRenderer.on('live-buffer-updated', listener);
    return () => ipcRenderer.removeListener('live-buffer-updated', listener);
  },
  onPeekInputUpdated: (cb: (realText: string) => void) => {
    const listener = (_e: any, realText: string) => cb(realText);
    ipcRenderer.on('peek-input-updated', listener);
    return () => ipcRenderer.removeListener('peek-input-updated', listener);
  },
  onPeekTriggerSend: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('peek-trigger-send', listener);
    return () => ipcRenderer.removeListener('peek-trigger-send', listener);
  },
  onSettingsUpdated: (cb: (settings: any) => void) => {
    const listener = (_e: any, settings: any) => cb(settings);
    ipcRenderer.on('settings-updated', listener);
    return () => ipcRenderer.removeListener('settings-updated', listener);
  },
  onPeekWindowState: (cb: (isOpen: boolean) => void) => {
    const listener = (_e: any, isOpen: boolean) => cb(isOpen);
    ipcRenderer.on('peek-window-state', listener);
    return () => ipcRenderer.removeListener('peek-window-state', listener);
  },
  onPeekFocusInput: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on('peek-focus-input', listener);
    return () => ipcRenderer.removeListener('peek-focus-input', listener);
  },
  onHotkeyAction: (cb: (action: string) => void) => {
    const listener = (_e: any, action: string) => cb(action);
    ipcRenderer.on('hotkey-action', listener);
    return () => ipcRenderer.removeListener('hotkey-action', listener);
  },
});
