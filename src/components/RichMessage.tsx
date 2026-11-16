import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { ThoughtEntry, ToolActivity } from '../types';

/* ---------- Lightweight markdown renderer (no external dependency) ---------- */

const INLINE_RE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

const renderInline = (text: string, keyPrefix: string): React.ReactNode[] =>
  text.split(INLINE_RE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="px-1 py-px rounded bg-[#10192a] border border-border/70 text-cyber">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="text-amber font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <span key={key} className="text-cyber underline decoration-dotted" title={link[2]}>
          {link[1]}
        </span>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });

const splitTableRow = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

export const MarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = /^```\s*([\w+-]*)\s*$/.exec(line.trim());
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        <div key={k++} className="rounded border border-border/80 bg-[#060a10] overflow-hidden">
          {fence[1] && (
            <div className="px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-500 bg-[#0b121c] border-b border-border/60">
              {fence[1]}
            </div>
          )}
          <pre className="p-2 text-[11px] text-matrix/90 whitespace-pre overflow-x-auto leading-relaxed">
            {code.join('\n')}
          </pre>
        </div>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push(<hr key={k++} className="border-border/60" />);
      i++;
      continue;
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? 'text-[13px] text-matrix border-b border-matrix/30 pb-0.5'
          : level === 2
          ? 'text-[12px] text-cyber border-b border-border/60 pb-0.5'
          : 'text-[11px] text-mystic';
      out.push(
        <div key={k++} className={`font-bold pt-1 ${cls}`}>
          {renderInline(heading[2], `h${k}`)}
        </div>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      out.push(
        <div key={k++} className="overflow-x-auto">
          <table className="w-full text-[10.5px] border border-border/70">
            <thead className="bg-[#0d1624] text-cyber">
              <tr>
                {header.map((h, hi) => (
                  <th key={hi} className="px-2 py-1 text-left border-b border-border/70 font-semibold">
                    {renderInline(h, `th${k}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-[#0a111b]' : ''}>
                  {r.map((c, ci) => (
                    <td key={ci} className="px-2 py-1 border-t border-border/40 align-top">
                      {renderInline(c, `td${k}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push(
        <div key={k++} className="border-l-2 border-mystic/60 pl-2 text-slate-400 italic">
          {renderInline(quote.join(' '), `q${k}`)}
        </div>
      );
      continue;
    }

    // Lists (bullet / numbered, one nesting level via indentation)
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const items: { indent: number; ordered: boolean; num: string; text: string }[] = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push({
          indent: m[1].replace(/\t/g, '  ').length,
          ordered: /\d/.test(m[2]),
          num: m[2],
          text: m[3],
        });
        i++;
      }
      out.push(
        <div key={k++} className="space-y-0.5">
          {items.map((it, ii) => (
            <div
              key={ii}
              className="flex gap-1.5"
              style={{ paddingLeft: `${Math.min(it.indent, 8) * 6}px` }}
            >
              <span className="text-matrix shrink-0 w-4 text-right">{it.ordered ? it.num : '▸'}</span>
              <span className="min-w-0 break-words">{renderInline(it.text, `li${k}-${ii}`)}</span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Paragraph: gather consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={k++} className="break-words">
        {renderInline(para.join(' '), `p${k}`)}
      </p>
    );
  }

  return <div className="space-y-2 text-[11.5px] leading-relaxed text-slate-200">{out}</div>;
};

/* ---------- Collapsible sections ---------- */

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, accent, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded border bg-[#070c13] ${accent}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-left"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {icon}
        <span>{title}</span>
      </button>
      {open && <div className="px-2.5 pb-2 pt-0.5">{children}</div>}
    </div>
  );
};

export const ThoughtsList: React.FC<{ thoughts: ThoughtEntry[]; compact?: boolean }> = ({
  thoughts,
  compact,
}) => (
  <div className="space-y-1.5">
    {thoughts.map((th, idx) => (
      <div key={th.id} className="flex gap-2 text-[10.5px] text-slate-300/90 leading-relaxed">
        <span className="text-mystic shrink-0 select-none">#{idx + 1}</span>
        <div className={`min-w-0 whitespace-pre-wrap break-words ${compact ? 'line-clamp-4' : ''}`}>
          {th.text}
        </div>
      </div>
    ))}
  </div>
);

/** Structured, styled view of a finished assistant message (shown when revealed with Alt). */
export const StructuredMessage: React.FC<{
  content: string;
  thoughts?: ThoughtEntry[];
  tools?: ToolActivity[];
  labels: { thinking: string; tools: string };
}> = ({ content, thoughts, tools, labels }) => (
  <div className="space-y-2">
    {thoughts && thoughts.length > 0 && (
      <Section
        icon={<Brain className="w-3 h-3" />}
        title={`${labels.thinking} (${thoughts.length})`}
        accent="border-mystic/30 text-mystic"
      >
        <ThoughtsList thoughts={thoughts} />
      </Section>
    )}
    {tools && tools.length > 0 && (
      <Section
        icon={<Wrench className="w-3 h-3" />}
        title={`${labels.tools} (${tools.length})`}
        accent="border-cyber/30 text-cyber"
      >
        <div className="space-y-0.5 text-[10.5px] font-mono text-slate-300">
          {tools.map((tl) => (
            <div key={tl.id} className="flex gap-2">
              <span className="text-cyber shrink-0">{tl.toolName}</span>
              <span className="truncate text-slate-400" title={tl.target}>
                {tl.target}
              </span>
            </div>
          ))}
        </div>
      </Section>
    )}
    <MarkdownBlock text={content} />
  </div>
);
