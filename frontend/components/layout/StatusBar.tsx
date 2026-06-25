"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";

export function StatusBar() {
  const { streaming, sessionId } = useChatStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="h-7 flex items-center px-4 gap-3 text-xs flex-shrink-0 border-t border-cc-border transition-colors duration-300"
      style={{
        background: streaming
          ? "rgba(212,168,83,0.06)"
          : "var(--cc-surface, #161616)",
        color: "var(--cc-dim, #888888)",
      }}
    >
      {/* CWD */}
      <span className="flex items-center gap-1.5 text-cc-dim">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 3.5A1.5 1.5 0 012.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
        </svg>
        <span className="text-cc-text">~/LangChain-DeepAgent</span>
      </span>

      <span className="w-px h-3.5 bg-cc-border" />

      {/* Active agent */}
      <span className="flex items-center gap-1.5 text-cc-dim">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 10-16 0" />
        </svg>
        <span>DeepAgent</span>
      </span>

      <span className="w-px h-3.5 bg-cc-border" />

      {/* Model */}
      <span className="text-cc-dim">azure_openai:gpt-4o-mini</span>

      <div className="flex-1" />

      {/* Session ID — monospace, client-only */}
      <span className="font-mono text-cc-muted text-[10px] tracking-wider">
        {mounted ? sessionId.slice(0, 8) : "--------"}
      </span>

      <span className="w-px h-3.5 bg-cc-border" />

      {/* Streaming indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
            streaming ? "bg-cc-green animate-pulse" : "bg-cc-muted"
          }`}
        />
        <span className={streaming ? "text-cc-green" : "text-cc-dim"}>
          {streaming ? "streaming" : "ready"}
        </span>
      </div>
    </div>
  );
}
