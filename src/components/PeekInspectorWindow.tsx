import React, { useEffect, useRef, useState } from 'react';
import {
  CornerDownLeft,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  Play,
  ShieldCheck,
  Unlock,
  X,
} from 'lucide-react';
import { AppLanguage, ChatAttachment } from '../types';
import {
  encodeToDisguisedCode,
  formatHoldKeyDisplay,
  hashToHex,
  isHoldKeyMatch,
} from '../utils/cipherEngine';
import { localizeMessageText, TRANSLATIONS } from '../utils/i18n';

declare global {
  interface Window {
    ndevApi?: any;
  }
}

export const PeekInspectorWindow: React.FC = () => {
  const [lang, setLang] = useState<AppLanguage>('vi');
  const [cipherLanguage, setCipherLanguage] = useState<'rust-kernel' | 'cpp-vulkan' | 'asm-hex'>(
    'rust-kernel'
  );
  const [opacity, setOpacity] = useState<number>(() => {
    const saved = Number(localStorage.getItem('ndev_peek_opacity'));
    return saved >= 0.15 && saved <= 1.0 ? saved : 0.45;
  });
  const [enterNewlineMode, setEnterNewlineMode] = useState<boolean>(true);
  const [holdPeekKey, setHoldPeekKey] = useState<string>('Alt');
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(() => document.hasFocus());
  const [isAltHeld, setIsAltHeld] = useState<boolean>(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState<boolean>(false);

  const [buffer, setBuffer] = useState<{
    realText: string;
    disguisedText: string;
    cursorIndex: number;
    attachments?: ChatAttachment[];
    recentMessages?: {
      id: string;
      role: string;
      realContent: string;
      disguisedHeader?: string;
      disguisedCodeBlock?: string;
      engine: string;
      attachments?: ChatAttachment[];
    }[];
  }>({
    realText: '',
    disguisedText: '',
    cursorIndex: 0,
    attachments: [],
    recentMessages: [],
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const confirmSendBtnRef = useRef<HTMLButtonElement>(null);

  const focusInputTextarea = () => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        try {
          el.setSelectionRange(len, len);
        } catch {}
      }
    });
  };

  useEffect(() => {
    window.ndevApi?.setPeekOpacity?.(opacity);
  }, [opacity]);

  useEffect(() => {
    focusInputTextarea();
    const t1 = setTimeout(focusInputTextarea, 60);
    const t2 = setTimeout(focusInputTextarea, 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (showSendConfirmModal) {
      requestAnimationFrame(() => {
        confirmSendBtnRef.current?.focus();
      });
    }
  }, [showSendConfirmModal]);

  useEffect(() => {
    const onFocus = () => {
      setIsWindowFocused(true);
      if (!showSendConfirmModal) {
        focusInputTextarea();
      }
    };
    const onBlur = () => {
      setIsWindowFocused(false);
      setIsAltHeld(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSendConfirmModal) {
        e.preventDefault();
        setShowSendConfirmModal(false);
        focusInputTextarea();
        return;
      }
      if (isHoldKeyMatch(e, holdPeekKey, 'down')) {
        e.preventDefault();
        setIsAltHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (isHoldKeyMatch(e, holdPeekKey, 'up')) {
        e.preventDefault();
        setIsAltHeld(false);
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [holdPeekKey, showSendConfirmModal]);

  useEffect(() => {
    if (!window.ndevApi) return;
    window.ndevApi.getInitialState().then((init: any) => {
      if (init?.settings?.language) {
        setLang(init.settings.language);
      }
      if (init?.settings?.cipherLanguage) {
        setCipherLanguage(init.settings.cipherLanguage);
      }
      if (init?.settings?.hotkeys?.holdPeekKey) {
        setHoldPeekKey(init.settings.hotkeys.holdPeekKey);
      }
      if (init?.liveBuffer) {
        setBuffer((prev) => ({
          ...prev,
          ...init.liveBuffer,
        }));
      }
      if (init?.repos?.length > 0) {
        const msgs = init.repos[0].messages || [];
        setBuffer((prev) => ({
          ...prev,
          recentMessages:
            prev.recentMessages && prev.recentMessages.length > 0
              ? prev.recentMessages
              : msgs.slice(-6),
        }));
      }
    });

    const unsubBuffer = window.ndevApi.onLiveBufferUpdated?.((payload: any) => {
      if (payload.language) setLang(payload.language);
      if (payload.cipherLanguage) setCipherLanguage(payload.cipherLanguage);
      setBuffer((prev) => ({
        ...prev,
        ...payload,
        attachments: payload.attachments ?? prev.attachments,
        recentMessages: payload.recentMessages || prev.recentMessages,
      }));
    });

    const unsubSettings = window.ndevApi.onSettingsUpdated?.((nextSettings: any) => {
      if (nextSettings?.language) {
        setLang(nextSettings.language);
      }
      if (nextSettings?.cipherLanguage) {
        setCipherLanguage(nextSettings.cipherLanguage);
      }
      if (nextSettings?.hotkeys?.holdPeekKey) {
        setHoldPeekKey(nextSettings.hotkeys.holdPeekKey);
      }
    });

    const unsubFocus = window.ndevApi.onPeekFocusInput?.(() => {
      setShowSendConfirmModal(false);
      focusInputTextarea();
    });

    return () => {
      if (unsubBuffer) unsubBuffer();
      if (unsubSettings) unsubSettings();
      if (unsubFocus) unsubFocus();
    };
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const holdKeyDisplay = formatHoldKeyDisplay(holdPeekKey);

  // Reverse of Main UI:
  // By default WATCH_BUF shows plain text; when WATCH_BUF is focused and user presses/holds holdPeekKey (default Alt), it masks/encrypts text!
  const isMaskedByAlt = isWindowFocused && isAltHeld;

  const handleOpacityChange = (nextVal: number) => {
    const clamped = Math.max(0.15, Math.min(1.0, nextVal));
    setOpacity(clamped);
    localStorage.setItem('ndev_peek_opacity', String(clamped));
    window.ndevApi?.setPeekOpacity?.(clamped);
  };

  const handleTextChange = (nextText: string) => {
    const disguised = encodeToDisguisedCode(
      nextText,
      cipherLanguage,
      buffer.recentMessages?.length || 1
    );
    setBuffer((prev) => ({
      ...prev,
      realText: nextText,
      disguisedText: disguised,
      cursorIndex: nextText.length,
    }));
    window.ndevApi?.updateInputFromPeek?.(nextText);
  };

  const handleInsertNewline = () => {
    const el = textareaRef.current;
    if (!el) {
      handleTextChange(buffer.realText + '\n');
      return;
    }
    const start = el.selectionStart ?? buffer.realText.length;
    const end = el.selectionEnd ?? buffer.realText.length;
    const updated = buffer.realText.slice(0, start) + '\n' + buffer.realText.slice(end);
    handleTextChange(updated);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  };

  const handleRequestSend = () => {
    if (!buffer.realText.trim() && (!buffer.attachments || buffer.attachments.length === 0)) {
      return;
    }
    setShowSendConfirmModal(true);
  };

  const handleConfirmExecuteSend = () => {
    setShowSendConfirmModal(false);
    window.ndevApi?.triggerSendFromPeek?.();
    focusInputTextarea();
  };

  const disguisedInputCode =
    buffer.disguisedText ||
    encodeToDisguisedCode(buffer.realText, cipherLanguage, buffer.recentMessages?.length || 1);

  const getRoleLabel = (role: string) => {
    if (role === 'user') return t.roleUser;
    if (role === 'assistant') return t.roleAssistant;
    return t.roleSystem;
  };

  return (
    <div className="w-screen h-screen bg-[#070b10]/55 border border-matrix/30 rounded-md flex flex-col overflow-hidden text-xs font-mono shadow-2xl backdrop-blur-[2px]">
      {/* Disguised Titlebar with Opacity Slider & Alt-Mask Indicator */}
      <div className="min-h-[32px] py-1 bg-[#0a1018]/70 border-b border-border/70 px-2.5 flex items-center justify-between gap-2 drag-region">
        <div className="flex items-center gap-2 text-[11px] text-matrix truncate min-w-0">
          <Cpu className="w-3.5 h-3.5 text-mystic animate-pulse shrink-0" />
          <span className="font-semibold tracking-wider truncate">
            {isMaskedByAlt
              ? `RING0::DMA_WATCH_0x${hashToHex(t.peekWindowTitle, 6)}`
              : t.peekWindowTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 no-drag shrink-0">
          {/* Status badge showing reverse Alt-to-Encrypt behavior */}
          <span
            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 whitespace-nowrap ${
              isMaskedByAlt
                ? 'bg-amber/20 border-amber/50 text-amber'
                : 'bg-matrix/15 border-matrix/30 text-matrix'
            }`}
          >
            {isMaskedByAlt ? (
              <>
                <Lock className="w-2.5 h-2.5" />{' '}
                {t.peekAltMaskedActive.replace(/\bALT\b/g, holdKeyDisplay)}
              </>
            ) : (
              <>
                <Unlock className="w-2.5 h-2.5" />{' '}
                {t.peekAltMaskHint.replace(/\bALT\b/g, holdKeyDisplay)}
              </>
            )}
          </span>

          {/* Live Opacity Slider (15% - 100%) */}
          <div className="flex items-center gap-1 bg-[#060a10]/80 border border-border/80 rounded px-1.5 py-0.5 text-[9px] text-slate-300">
            <span className="text-cyber font-semibold">{t.peekOpacityLabel}:</span>
            <input
              type="range"
              min={15}
              max={100}
              step={5}
              value={Math.round(opacity * 100)}
              onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
              className="w-14 h-1 accent-matrix cursor-pointer"
              title={`${t.peekOpacityLabel}: ${Math.round(opacity * 100)}%`}
            />
            <span className="w-7 text-right text-matrix font-bold">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          <span className="px-1.5 py-0.5 rounded bg-mystic/15 border border-mystic/30 text-[10px] text-mystic font-bold flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            {lang.toUpperCase()}
          </span>

          <button
            onClick={() => window.ndevApi?.togglePeekWindow(false)}
            className="text-slate-400 hover:text-red-400 p-1"
            title={t.closeInspectorTooltip}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Memory Watch Body with Interactive Multiline Input & Reverse-Alt Encryption */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 select-text">
        <div className="grid grid-cols-12 text-[10px] text-slate-400 font-semibold border-b border-border/60 pb-1">
          <div className="col-span-3">{t.colSymbol}</div>
          <div className="col-span-2">{t.colType}</div>
          <div className="col-span-7">{t.colValue}</div>
        </div>

        <div className="grid grid-cols-12 items-start text-[11px] py-1 border-b border-border/40 gap-1">
          <div className="col-span-3 space-y-1">
            <div className="text-cyber font-semibold">
              {isMaskedByAlt ? 'ring0_dma_buf' : t.symRawInputBuf}
            </div>
            <div className="text-[9px] text-slate-500">
              0x{buffer.realText.length.toString(16).toUpperCase().padStart(4, '0')} (
              {buffer.realText.length} {t.charsUnit})
            </div>
          </div>
          <div className="col-span-2 text-mystic">
            {isMaskedByAlt ? '*mut u8' : t.typeUtf8Str}
          </div>

          {/* Interactive Multiline Text Input with Newline Mode & Alt-Encryption */}
          <div className="col-span-7 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[9px]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEnterNewlineMode((prev) => !prev)}
                  className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                    enterNewlineMode
                      ? 'bg-matrix/15 border-matrix/40 text-matrix'
                      : 'bg-cyber/15 border-cyber/40 text-cyber'
                  }`}
                >
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  {enterNewlineMode ? t.peekEnterNewlineModeOn : t.peekEnterNewlineModeOff}
                </button>
                <button
                  type="button"
                  onClick={handleInsertNewline}
                  className="px-1.5 py-0.5 rounded bg-[#0c1522]/80 hover:bg-[#142236] border border-border text-slate-300 hover:text-white"
                >
                  {t.peekInsertNewlineBtn}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRequestSend}
                disabled={
                  !buffer.realText.trim() &&
                  (!buffer.attachments || buffer.attachments.length === 0)
                }
                className="px-2 py-0.5 rounded bg-matrix/20 hover:bg-matrix/30 disabled:opacity-40 border border-matrix/50 text-matrix font-bold flex items-center gap-1"
              >
                <Play className="w-2.5 h-2.5" /> {t.peekSendBtn}
              </button>
            </div>

            <div
              onClick={() => textareaRef.current?.focus()}
              className="relative rounded bg-[#080f18]/75 border border-matrix/25 focus-within:border-matrix/60 p-2 min-h-[84px]"
            >
              <textarea
                ref={textareaRef}
                autoFocus
                value={buffer.realText}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (isHoldKeyMatch(e.nativeEvent, holdPeekKey, 'down')) {
                    e.preventDefault();
                    setIsAltHeld(true);
                    return;
                  }
                  if (e.key === 'Enter') {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      handleRequestSend();
                      return;
                    }
                    if (!enterNewlineMode && !e.shiftKey) {
                      e.preventDefault();
                      handleRequestSend();
                      return;
                    }
                    // When enterNewlineMode is true (default), Enter naturally inserts a newline (\n)!
                  }
                }}
                placeholder={isMaskedByAlt ? '' : t.peekInputPlaceholder}
                rows={4}
                className={`w-full bg-transparent resize-y focus:outline-none font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words ${
                  isMaskedByAlt
                    ? 'text-transparent caret-transparent selection:bg-transparent'
                    : 'text-matrix caret-matrix'
                }`}
              />

              {/* When focused in WATCH_BUF and holding Alt -> Encrypt/Mask text (Opposite of Main UI) */}
              {isMaskedByAlt && (
                <div className="pointer-events-none absolute inset-0 p-2 overflow-y-auto">
                  {buffer.realText.length === 0 ? (
                    <div className="text-slate-500 italic text-[10px]">
                      // ring0_dma_channel: 0x0000_NULL_FRAME
                    </div>
                  ) : (
                    <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all text-amber/90">
                      {disguisedInputCode}
                      <span className="inline-block w-1.5 h-3 bg-amber ml-0.5 animate-pulse align-middle" />
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {buffer.attachments && buffer.attachments.length > 0 && (
          <div className="grid grid-cols-12 items-start text-[10px] py-1 border-b border-border/40">
            <div className="col-span-3 text-matrix font-semibold">{t.symAttachments}</div>
            <div className="col-span-2 text-slate-400">{t.typeDmaList}</div>
            <div className="col-span-7 flex flex-wrap gap-1.5">
              {buffer.attachments.map((att, idx) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b131e]/80 border border-cyber/30 text-cyber"
                >
                  {isMaskedByAlt ? (
                    <span className="text-amber font-mono">
                      [DMA_MMAP_0x{(0x7f00 + idx).toString(16).toUpperCase()} ::{' '}
                      {att.isImage ? 'VK_IMG' : 'RAW_FD'} {att.size}B]
                    </span>
                  ) : (
                    <>
                      {att.isImage && att.previewDataUrl ? (
                        <img
                          src={att.previewDataUrl}
                          alt={att.name}
                          className="w-6 h-6 object-cover rounded border border-matrix/40"
                        />
                      ) : att.isImage ? (
                        <ImageIcon className="w-3.5 h-3.5 text-matrix" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-amber" />
                      )}
                      <span className="truncate max-w-[160px]">{att.name}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decoded Recent Messages Feed (Also masks into disguised code when Alt is held in WATCH_BUF!) */}
        {buffer.recentMessages && buffer.recentMessages.length > 0 && (
          <div className="pt-1.5 border-t border-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-mystic font-bold tracking-wider">
              <span>
                {isMaskedByAlt
                  ? `RING0_TRACE_DUMP :: 0x${hashToHex('recent_msgs', 6)}`
                  : t.peekInspectorAllMsgsLabel}
              </span>
              <span className="text-[9px] text-slate-400 flex items-center gap-1">
                {isMaskedByAlt ? <EyeOff className="w-3 h-3 text-amber" /> : <Eye className="w-3 h-3 text-matrix" />}
              </span>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {buffer.recentMessages.slice(-5).map((m, idx) => {
                const realMsgText = localizeMessageText(m, lang);
                const maskedMsgCode =
                  m.disguisedCodeBlock && m.disguisedCodeBlock.trim().length > 0
                    ? m.disguisedCodeBlock
                    : encodeToDisguisedCode(realMsgText, cipherLanguage, idx + 1);
                return (
                  <div
                    key={m.id}
                    className="p-2 rounded bg-[#091019]/75 border border-border/60 text-[10px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                      <span
                        className={
                          m.role === 'user'
                            ? 'text-cyber font-bold'
                            : m.role === 'assistant'
                            ? 'text-matrix font-bold'
                            : 'text-amber font-bold'
                        }
                      >
                        {isMaskedByAlt
                          ? m.disguisedHeader || `[IRQ_FRAME_0x${hashToHex(m.id, 4)}]`
                          : `[${getRoleLabel(m.role)}]`}
                      </span>
                      <span>
                        {isMaskedByAlt ? `0x${hashToHex(m.engine || 'eng', 4)}` : m.engine}
                      </span>
                    </div>
                    {!isMaskedByAlt && m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 py-0.5">
                        {m.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0d1724] border border-cyber/30 text-[9px] text-cyber"
                          >
                            {att.isImage && att.previewDataUrl ? (
                              <img
                                src={att.previewDataUrl}
                                alt={att.name}
                                className="w-5 h-5 object-cover rounded"
                              />
                            ) : null}
                            <span className="truncate max-w-[140px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className={`whitespace-pre-wrap break-words leading-relaxed font-mono ${
                        isMaskedByAlt ? 'text-amber/90' : 'text-slate-200'
                      }`}
                    >
                      {isMaskedByAlt ? maskedMsgCode : realMsgText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Send Confirmation Dialog before dispatching message */}
      {showSendConfirmModal && (
        <div
          onClick={() => {
            setShowSendConfirmModal(false);
            focusInputTextarea();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#09111c] border border-matrix/60 rounded-md shadow-2xl p-3.5 space-y-2.5 text-xs font-mono"
          >
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <span className="font-bold text-matrix flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber" />
                {t.peekConfirmSendTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSendConfirmModal(false);
                  focusInputTextarea();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-300">{t.peekConfirmSendDesc}</div>

            <div className="max-h-28 overflow-y-auto rounded bg-[#060a10] border border-border/80 p-2 text-[10px] whitespace-pre-wrap break-words text-cyber">
              {isMaskedByAlt ? disguisedInputCode : buffer.realText || '(Attachments only)'}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSendConfirmModal(false);
                  focusInputTextarea();
                }}
                className="px-3 py-1 rounded bg-[#101a28] hover:bg-[#172538] border border-border text-slate-300 text-[11px]"
              >
                {t.peekConfirmCancelBtn}
              </button>
              <button
                ref={confirmSendBtnRef}
                type="button"
                onClick={handleConfirmExecuteSend}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmExecuteSend();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSendConfirmModal(false);
                    focusInputTextarea();
                  }
                }}
                className="px-3.5 py-1 rounded bg-matrix text-black font-bold hover:opacity-90 text-[11px] flex items-center gap-1"
              >
                {t.peekConfirmSendBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer status */}
      <div className="h-6 bg-[#090e16]/75 border-t border-border/70 px-3 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-matrix/80 truncate">
          <ShieldCheck className="w-3 h-3 shrink-0" /> {t.verificationSynced}
        </span>
        <span className="flex items-center gap-1 truncate">
          <Eye className="w-3 h-3 text-mystic shrink-0" />{' '}
          {t.holdAltFooterHint.replace(/\bALT\b/g, holdKeyDisplay)}
        </span>
      </div>
    </div>
  );
};
