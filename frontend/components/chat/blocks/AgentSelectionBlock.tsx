"use client";
import { Block } from "@/store/chatStore";

const AGENT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  "file-agent":  { icon: "F", color: "text-cc-green",  bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)"  },
  "shell-agent": { icon: "S", color: "text-cc-yellow", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)"  },
  "web-agent":   { icon: "W", color: "text-cc-blue",   bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)"  },
  "code-agent":  { icon: "C", color: "text-cc-purple", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.25)" },
};

const DEFAULT_CFG = { icon: "A", color: "text-cc-amber", bg: "rgba(212,168,83,0.08)", border: "rgba(212,168,83,0.25)" };

export function AgentSelectionBlock({ block }: { block: Block }) {
  const { agent, model, reason } = block.payload ?? {};
  const cfg = AGENT_CONFIG[agent] ?? DEFAULT_CFG;

  // Strip verbose task wrapper text deepagents may prepend
  const task = reason
    ? String(reason).replace(/^.*?task[:\s]*/i, "").replace(/^["']|["']$/g, "").trim()
    : "";

  return (
    <div className="mx-4 my-2">
      <div
        className="flex items-center gap-3 rounded-lg border px-3.5 py-2.5 flex-wrap"
        style={{ background: cfg.bg, borderColor: cfg.border }}
      >
        {/* Arrow + label */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-cc-dim">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-cc-dim text-[10px] uppercase tracking-widest font-semibold">delegating</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-cc-border/60 flex-shrink-0" />

        {/* Agent badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${cfg.color}`}
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.icon}
          </div>
          <span className={`text-xs font-semibold font-mono ${cfg.color}`}>{agent}</span>
        </div>

        {/* Model pill */}
        {model && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cc-elevated border border-cc-border text-cc-dim font-mono flex-shrink-0">
            {model}
          </span>
        )}

        {/* Task preview */}
        {task && (
          <p className="text-cc-dim text-[11px] leading-relaxed truncate flex-1 min-w-0">
            {task.slice(0, 200)}
          </p>
        )}

        {/* Running dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-cc-amber animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}
