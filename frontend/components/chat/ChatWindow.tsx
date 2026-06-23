"use client";
import { useEffect, useRef } from "react";
import { useChatStore, Block } from "@/store/chatStore";
import { UserMessageBlock } from "./blocks/UserMessageBlock";
import { ThinkingBlock } from "./blocks/ThinkingBlock";
import { AgentSelectionBlock } from "./blocks/AgentSelectionBlock";
import { ToolCallBlock } from "./blocks/ToolCallBlock";
import { PermissionBlock } from "./blocks/PermissionBlock";
import { FinalAnswerBlock } from "./blocks/FinalAnswerBlock";
import { ErrorBlock } from "./blocks/ErrorBlock";

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "user":             return <UserMessageBlock block={block} />;
    case "thinking":         return <ThinkingBlock block={block} />;
    case "agent_selection":  return <AgentSelectionBlock block={block} />;
    case "tool_call":        return <ToolCallBlock block={block} />;
    case "permission":       return <PermissionBlock block={block} />;
    case "final_answer":     return <FinalAnswerBlock block={block} />;
    case "error":            return <ErrorBlock block={block} />;
    default:                 return null;
  }
}

export function ChatWindow() {
  const { blocks } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  const lastPayload = blocks.at(-1)?.payload;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.length, lastPayload]);

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-cc-dim text-sm gap-3">
          <div className="text-4xl">⚡</div>
          <div className="text-cc-amber font-semibold text-base">ClaudeCode DeepAgent</div>
          <div className="text-xs text-center max-w-xs">
            Ask anything. Type <code className="text-cc-amber">/help</code> to see available commands.
          </div>
        </div>
      )}
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
