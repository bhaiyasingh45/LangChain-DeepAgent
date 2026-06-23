"use client";
import { useState } from "react";
import { Block, useChatStore } from "@/store/chatStore";
import { useSSEStream } from "@/hooks/useSSEStream";

export function PermissionBlock({ block }: { block: Block }) {
  const [alwaysAllow, setAlwaysAllow] = useState(false);
  const [decided, setDecided] = useState(false);
  const [decisionLabel, setDecisionLabel] = useState("");
  const { sessionId } = useChatStore();
  const { resumeStream } = useSSEStream();

  const { icon, category, command, tool_name } = block.payload ?? {};

  const handleDecision = async (decision: "allow" | "deny") => {
    setDecided(true);
    const finalDecision = decision === "allow" && alwaysAllow ? "allow_session" : decision;
    setDecisionLabel(decision === "allow" ? (alwaysAllow ? "Allowed (always)" : "Allowed") : "Denied");
    await resumeStream(sessionId, finalDecision, tool_name ?? "");
  };

  return (
    <div className="mx-4 my-2 border border-cc-yellow rounded bg-cc-elevated text-xs">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cc-border">
        <span className="text-base">{icon ?? "⚠"}</span>
        <span className="text-cc-yellow font-semibold">Approval Required</span>
        <span className="text-cc-dim ml-1">— {category}</span>
      </div>

      <div className="px-3 py-2 border-b border-cc-border">
        <div className="text-cc-dim mb-1">Command:</div>
        <code className="text-cc-text bg-cc-bg px-2 py-1 rounded block whitespace-pre-wrap break-all">
          {command || "—"}
        </code>
      </div>

      {!decided ? (
        <div className="px-3 py-2 space-y-2">
          <label className="flex items-center gap-2 text-cc-dim cursor-pointer">
            <input
              type="checkbox"
              checked={alwaysAllow}
              onChange={(e) => setAlwaysAllow(e.target.checked)}
              className="accent-cc-amber"
            />
            Always allow <span className="text-cc-text">{category}</span> in this session
          </label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleDecision("allow")}
              className="px-3 py-1 bg-cc-green text-black rounded font-semibold hover:opacity-90 transition-opacity"
            >
              Allow
            </button>
            <button
              onClick={() => handleDecision("deny")}
              className="px-3 py-1 bg-cc-red text-white rounded font-semibold hover:opacity-90 transition-opacity"
            >
              Deny
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-2 text-cc-dim">
          Decision: <span className={decisionLabel.startsWith("Allow") ? "text-cc-green" : "text-cc-red"}>{decisionLabel}</span>
        </div>
      )}
    </div>
  );
}
