"use client";
import { useState } from "react";
import { Block } from "@/store/chatStore";

const STATUS_COLORS: Record<string, string> = {
  running: "text-cc-yellow border-cc-yellow",
  done:    "text-cc-green border-cc-green",
  error:   "text-cc-red border-cc-red",
};

const STATUS_LABELS: Record<string, string> = {
  running: "running",
  done:    "done",
  error:   "error",
};

export function ToolCallBlock({ block }: { block: Block }) {
  const [collapsed, setCollapsed] = useState(false);
  const { tool, args, status, output } = block.payload ?? {};
  const statusClass = STATUS_COLORS[status] ?? STATUS_COLORS.running;

  return (
    <div className="mx-4 my-1 bg-cc-elevated border border-cc-border rounded text-xs">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left px-3 py-2"
      >
        <span className="text-cc-dim">{collapsed ? "▶" : "▼"}</span>
        <span className="text-cc-purple font-semibold">{tool}</span>
        <span className={`ml-auto border rounded px-1.5 py-0.5 text-[10px] ${statusClass}`}>
          {STATUS_LABELS[status] ?? "pending"}
        </span>
        {status === "running" && (
          <span className="w-2 h-2 rounded-full bg-cc-yellow animate-pulse" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-cc-border">
          {/* Args */}
          <div className="px-3 py-2">
            <div className="text-cc-dim mb-1">Input:</div>
            <pre className="text-cc-text overflow-x-auto text-[11px] leading-relaxed">
              {JSON.stringify(args ?? {}, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {output !== null && output !== undefined && (
            <div className="px-3 py-2 border-t border-cc-border">
              <div className="text-cc-dim mb-1">Output:</div>
              <pre className={`overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-words ${status === "error" ? "text-cc-red" : "text-cc-text"}`}>
                {String(output)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
