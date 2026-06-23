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
    <div className="h-12 bg-cc-surface border-b border-cc-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo + project name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-cc-amber font-bold text-sm">⚡</span>
        <span className="text-cc-amber font-semibold text-sm tracking-tight">ClaudeCode</span>
        <span className="text-cc-dim text-xs">/ DeepAgent</span>
      </div>

      <div className="w-px h-5 bg-cc-border" />

      {/* Model selector */}
      <select
        className="bg-cc-elevated border border-cc-border text-cc-text text-xs rounded px-2 py-1 outline-none cursor-pointer hover:border-cc-muted transition-colors"
        defaultValue={MODELS[0].value}
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Token counter */}
      {(inputTokens > 0 || outputTokens > 0) && (
        <div className="text-cc-dim text-xs flex items-center gap-2">
          <span>↑{inputTokens.toLocaleString()}</span>
          <span>↓{outputTokens.toLocaleString()}</span>
          {costUsd > 0 && <span className="text-cc-amber">${costUsd.toFixed(4)}</span>}
        </div>
      )}

      {/* Settings / Permissions icon */}
      <button
        onClick={() => setShowPermissionsPanel(true)}
        className="text-cc-dim hover:text-cc-text transition-colors"
        title="Permissions & Settings"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </div>
  );
}
