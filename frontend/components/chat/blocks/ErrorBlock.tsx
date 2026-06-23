"use client";
import { useState } from "react";
import { Block } from "@/store/chatStore";

export function ErrorBlock({ block }: { block: Block }) {
  const [expanded, setExpanded] = useState(false);
  const { type, message, agent, tool } = block.payload ?? {};

  return (
    <div className="mx-4 my-1 border-l-2 border-cc-red bg-cc-elevated rounded-r px-3 py-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-cc-red font-semibold w-full text-left"
      >
        <span>⚠</span>
        <span>{type ?? "Error"}</span>
        {(agent || tool) && (
          <span className="text-cc-dim font-normal ml-1">
            {agent && `agent: ${agent}`}{agent && tool && " · "}{tool && `tool: ${tool}`}
          </span>
        )}
        <span className="ml-auto text-cc-dim">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-2 text-cc-dim whitespace-pre-wrap break-words">{message}</div>
      )}
      {!expanded && (
        <div className="mt-1 text-cc-dim truncate">{String(message ?? "").slice(0, 80)}</div>
      )}
    </div>
  );
}
