import React from 'react';
import { AgentStatus, AppLanguage } from '../types';
import { TRANSLATIONS } from '../utils/i18n';

interface Props {
  status: AgentStatus;
  language?: AppLanguage;
  onExpand: () => void;
  unreadCount?: number;
}

export const FloatingCornerWidget: React.FC<Props> = ({ status, language = 'vi', onExpand }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.vi;
  const statusRingColor =
    status === 'idle'
      ? 'border-matrix/70 shadow-[0_0_15px_rgba(0,255,156,0.35)]'
      : status === 'error'
      ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.6)]'
      : 'border-mystic shadow-[0_0_20px_rgba(183,126,255,0.75)] animate-pulse';

  return (
    <div
      onClick={onExpand}
      onDoubleClick={onExpand}
      className="w-screen h-screen flex items-center justify-center bg-transparent select-none cursor-pointer"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        title={t.widgetTooltip}
        className={`group relative w-14 h-14 rounded-2xl bg-[#070b11]/95 border-2 ${statusRingColor} flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer`}
      >
        <svg
          viewBox="0 0 64 64"
          className="w-9 h-9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="32,4 56,18 56,46 32,60 8,46 8,18"
            stroke="#b77eff"
            strokeWidth="2"
            strokeDasharray="4 2"
            fill="rgba(183, 126, 255, 0.08)"
          />
          <path
            d="M32 10 L48 24 L44 48 L20 48 L16 24 Z"
            fill="#0b131e"
            stroke="#00ff9c"
            strokeWidth="1.8"
          />
          <path d="M22 29 L29 32 L22 34 Z" fill="#00ff9c" />
          <path d="M42 29 L35 32 L42 34 Z" fill="#00ff9c" />
          <text
            x="26"
            y="23"
            fill="#00e5ff"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            &gt;_
          </text>
        </svg>

        <span
          className={`absolute -bottom-1 px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wider uppercase bg-[#06090e] border border-border ${
            status === 'idle' ? 'text-matrix' : 'text-mystic'
          }`}
        >
          {status === 'idle' ? 'R0' : status.slice(0, 4)}
        </span>
      </button>
    </div>
  );
};
