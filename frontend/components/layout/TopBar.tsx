"use client";
import { useChatStore } from "@/store/chatStore";

const MODELS = [
  { value: "azure_openai:gpt-4o-mini", label: "GPT-4o-mini" },
  { value: "anthropic:claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "azure_openai:gpt-4o", label: "GPT-4o" },
];

export function TopBar() {
  const { sessionInfo, setShowPermissionsPanel } = useChatStore();
  const { inputTokens, outputTokens, costUsd } = sessionInfo;

  return (
    <div
      className="h-11 bg-cc-surface flex items-center px-4 gap-3 flex-shrink-0 border-b border-cc-border"
      style={{ boxShadow: "inset 0 -1px 0 0 rgba(212,168,83,0.12)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
        <span
          className="w-6 h-6 rounded-sm flex items-center justify-center text-black text-xs font-bold leading-none"
          style={{ background: "#D4A853" }}
        >
          ⚡
        </span>
        <span className="text-cc-text font-semibold text-sm tracking-tight">ClaudeCode</span>
        <span className="text-cc-dim text-xs">/</span>
        <span className="text-cc-dim text-xs tracking-wide">DeepAgent</span>
      </div>

      <div className="w-px h-4 bg-cc-border flex-shrink-0" />

      {/* Model select */}
      <div className="relative flex-shrink-0">
        <select
          className="appearance-none bg-cc-elevated border border-cc-border text-cc-text text-xs rounded-md pl-2.5 pr-6 py-1 outline-none cursor-pointer hover:border-cc-muted focus:border-cc-amber/60 transition-colors"
          defaultValue={MODELS[0].value}
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-cc-dim"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <polyline points="2,3.5 5,6.5 8,3.5" />
        </svg>
      </div>

      <div className="flex-1" />

      {/* Token pill */}
      {(inputTokens > 0 || outputTokens > 0) && (
        <div className="flex items-center gap-2 bg-cc-elevated border border-cc-border rounded-full px-3 py-0.5 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="text-cc-muted text-[9px] uppercase tracking-wide">in</span>
            <span className="text-cc-text font-mono">{inputTokens.toLocaleString()}</span>
          </span>
          <span className="w-px h-3 bg-cc-border" />
          <span className="flex items-center gap-1">
            <span className="text-cc-muted text-[9px] uppercase tracking-wide">out</span>
            <span className="text-cc-text font-mono">{outputTokens.toLocaleString()}</span>
          </span>
          {costUsd > 0 && (
            <>
              <span className="w-px h-3 bg-cc-border" />
              <span className="text-cc-amber font-mono">${costUsd.toFixed(4)}</span>
            </>
          )}
        </div>
      )}

      {/* Settings button */}
      <button
        onClick={() => setShowPermissionsPanel(true)}
        className="w-7 h-7 rounded-md flex items-center justify-center text-cc-dim hover:text-cc-text hover:bg-cc-elevated transition-colors"
        title="Permissions & Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}
