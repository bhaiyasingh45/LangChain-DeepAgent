"use client";
import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";

export function StatusBar() {
  const { streaming, sessionId } = useChatStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="h-7 bg-cc-surface border-t border-cc-border flex items-center px-4 gap-4 text-xs text-cc-dim flex-shrink-0">
      {/* CWD */}
      <span className="flex items-center gap-1">
        <span>📁</span>
        <span className="text-cc-text">~/LangChain-DeepAgent</span>
      </span>

      <div className="w-px h-3.5 bg-cc-border" />

      {/* Active agent */}
      <span className="flex items-center gap-1">
        <span>🤖</span>
        <span>DeepAgent</span>
      </span>

      <div className="w-px h-3.5 bg-cc-border" />

      {/* Model */}
      <span>azure_openai:gpt-4o-mini</span>

      <div className="flex-1" />

      {/* Session ID (truncated) — client-only to avoid hydration mismatch */}
      <span className="text-cc-muted text-[10px]">
        {mounted ? `session: ${sessionId.slice(0, 8)}` : "session: --------"}
      </span>

      <div className="w-px h-3.5 bg-cc-border" />

      {/* Streaming indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            streaming ? "bg-cc-green animate-pulse" : "bg-cc-muted"
          }`}
        />
        <span>{streaming ? "streaming" : "ready"}</span>
      </div>
    </div>
  );
}
