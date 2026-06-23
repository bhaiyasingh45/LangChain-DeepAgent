"use client";
import { useState } from "react";
import { Block } from "@/store/chatStore";

export function ThinkingBlock({ block }: { block: Block }) {
  const [collapsed, setCollapsed] = useState(false);
  const content = block.payload?.content ?? "";

  return (
    <div className="mx-4 my-1 border-l-2 border-cc-blue bg-cc-elevated rounded-r px-3 py-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-cc-blue text-xs font-semibold w-full text-left"
      >
        <span>{collapsed ? "▶" : "▼"}</span>
        <span>Thinking{block.streaming ? "..." : ""}</span>
      </button>
      {!collapsed && (
        <div className="mt-2 text-cc-dim text-xs whitespace-pre-wrap break-words leading-relaxed">
          {content}
          {block.streaming && <span className="animate-pulse">▊</span>}
        </div>
      )}
    </div>
  );
}
