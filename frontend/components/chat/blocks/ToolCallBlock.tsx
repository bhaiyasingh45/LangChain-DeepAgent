"use client";
import { useState } from "react";
import { Block } from "@/store/chatStore";

const STATUS_CONFIG: Record<string, { border: string; badge: string; dot: string; label: string }> = {
  running: {
    border: "border-cc-yellow/40",
    badge: "text-cc-yellow bg-cc-yellow/10 border-cc-yellow/30",
    dot: "bg-cc-yellow animate-pulse",
    label: "running",
  },
  done: {
    border: "border-cc-green/30",
    badge: "text-cc-green bg-cc-green/10 border-cc-green/30",
    dot: "bg-cc-green",
    label: "done",
  },
  error: {
    border: "border-cc-red/30",
    badge: "text-cc-red bg-cc-red/10 border-cc-red/30",
    dot: "bg-cc-red",
    label: "error",
  },
};

export function ToolCallBlock({ block }: { block: Block }) {
  const [collapsed, setCollapsed] = useState(false);
  const { tool, args, status, output } = block.payload ?? {};
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.running;

  return (
    <div className={`mx-4 my-1.5 bg-cc-elevated border rounded-lg text-xs overflow-hidden transition-colors ${cfg.border}`}>
      {/* Header row */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left px-3 py-2.5 hover:bg-cc-muted/10 transition-colors"
      >
        {/* Collapse chevron */}
        <svg
          className={`text-cc-dim flex-shrink-0 transition-transform duration-150 ${collapsed ? "" : "rotate-90"}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <polyline points="3,2 7,5 3,8" />
        </svg>

        {/* Tool name */}
        <span className="text-cc-purple font-semibold font-mono tracking-tight flex-1 truncate">
          {tool ?? "tool"}
        </span>

        {/* Status dot */}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

        {/* Status badge */}
        <span className={`border rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${cfg.badge}`}>
          {cfg.label}
        </span>
      </button>

      {/* Expanded body */}
      {!collapsed && (
        <div className="border-t border-cc-border/60">
          {/* Args */}
          <div className="px-3 py-2.5">
            <div className="text-cc-dim mb-1.5 text-[10px] uppercase tracking-widest font-semibold">Input</div>
            <pre
              className="text-cc-text overflow-x-auto text-[11px] leading-relaxed rounded bg-cc-surface border border-cc-border px-2.5 py-2"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#3d3d3d transparent" }}
            >
              {JSON.stringify(args ?? {}, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {output !== null && output !== undefined && (
            <div className="px-3 py-2.5 border-t border-cc-border/60">
              <div className="text-cc-dim mb-1.5 text-[10px] uppercase tracking-widest font-semibold">Output</div>
              <pre
                className={`overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-words rounded border px-2.5 py-2 ${
                  status === "error"
                    ? "text-cc-red bg-cc-red/5 border-cc-red/20"
                    : "text-cc-text bg-cc-surface border-cc-border"
                }`}
                style={{ scrollbarWidth: "thin", scrollbarColor: "#3d3d3d transparent" }}
              >
                {String(output)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
