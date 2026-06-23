"use client";
import { Block } from "@/store/chatStore";

const AGENT_ICONS: Record<string, string> = {
  "file-agent":  "📁",
  "shell-agent": "🖥",
  "web-agent":   "🌐",
  "code-agent":  "⚡",
};

export function AgentSelectionBlock({ block }: { block: Block }) {
  const { agent, reason } = block.payload ?? {};
  const icon = AGENT_ICONS[agent] ?? "🤖";

  return (
    <div className="flex items-start gap-2 px-4 py-2 text-xs">
      <span className="text-cc-dim mt-0.5">🔀</span>
      <div>
        <span className="text-cc-dim">Routing to: </span>
        <span className="text-cc-amber font-semibold">{icon} {agent}</span>
        {reason && (
          <span className="text-cc-dim"> — {String(reason).slice(0, 120)}</span>
        )}
      </div>
    </div>
  );
}
