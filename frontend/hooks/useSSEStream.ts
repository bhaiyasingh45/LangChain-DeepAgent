"use client";
import { useCallback, useRef } from "react";
import { useChatStore, BlockType } from "@/store/chatStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useSSEStream() {
  const {
    appendBlock,
    updateBlock,
    finalizeBlock,
    setStreaming,
    updateSessionInfo,
    clearBlocks,
    setSessionId,
    setPermissions,
  } = useChatStore();

  // Track streaming block IDs so chunks append correctly
  const thinkingBlockId = useRef<string | null>(null);
  const finalAnswerBlockId = useRef<string | null>(null);
  const activeToolCallId = useRef<Record<string, string>>({});

  const resetRefs = () => {
    thinkingBlockId.current = null;
    finalAnswerBlockId.current = null;
    activeToolCallId.current = {};
  };

  const dispatch = useCallback(
    (eventType: string, data: any) => {
      switch (eventType) {
        case "thinking_chunk": {
          if (!thinkingBlockId.current) {
            thinkingBlockId.current = appendBlock("thinking", { content: data.content });
          } else {
            updateBlock(thinkingBlockId.current, {
              content: (useChatStore.getState().blocks.find(b => b.id === thinkingBlockId.current)?.payload?.content ?? "") + data.content,
            });
          }
          if (data.done) finalizeBlock(thinkingBlockId.current!);
          break;
        }

        case "agent_selection": {
          appendBlock("agent_selection", { agent: data.agent, reason: data.reason });
          // Reset thinking block — next thinking is for the subagent
          thinkingBlockId.current = null;
          break;
        }

        case "tool_call_start": {
          const id = appendBlock("tool_call", {
            tool: data.tool,
            args: data.args,
            status: "running",
            output: null,
          });
          if (data.id) activeToolCallId.current[data.id] = id;
          break;
        }

        case "tool_call_result": {
          const blockId = data.id ? activeToolCallId.current[data.id] : null;
          if (blockId) {
            updateBlock(blockId, { output: data.output, status: data.status });
            finalizeBlock(blockId);
          }
          break;
        }

        case "permission_request": {
          appendBlock("permission", data);
          setStreaming(false);
          break;
        }

        case "final_answer_chunk": {
          if (!finalAnswerBlockId.current) {
            finalAnswerBlockId.current = appendBlock("final_answer", { content: data.content });
          } else {
            updateBlock(finalAnswerBlockId.current, {
              content: (useChatStore.getState().blocks.find(b => b.id === finalAnswerBlockId.current)?.payload?.content ?? "") + data.content,
            });
          }
          if (data.done) finalizeBlock(finalAnswerBlockId.current!);
          break;
        }

        case "error": {
          appendBlock("error", { type: data.type, message: data.message, agent: data.agent, tool: data.tool });
          break;
        }

        case "session_info": {
          updateSessionInfo({
            inputTokens: data.input_tokens ?? 0,
            outputTokens: data.output_tokens ?? 0,
            costUsd: data.cost_usd ?? 0,
          });
          break;
        }

        case "stream_end": {
          // Finalize any still-streaming blocks before unlocking input
          if (finalAnswerBlockId.current) {
            finalizeBlock(finalAnswerBlockId.current);
            finalAnswerBlockId.current = null;
          }
          if (thinkingBlockId.current) {
            finalizeBlock(thinkingBlockId.current);
            thinkingBlockId.current = null;
          }
          setStreaming(false);
          break;
        }
      }
    },
    [appendBlock, updateBlock, finalizeBlock, setStreaming, updateSessionInfo]
  );

  const consumeStream = useCallback(
    async (response: Response) => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (eventType) dispatch(eventType, data);
            } catch {
              // malformed JSON chunk — skip
            }
            eventType = "";
          }
        }
      }
      // Fallback: finalize any open blocks if stream closed without stream_end
      if (finalAnswerBlockId.current) {
        finalizeBlock(finalAnswerBlockId.current);
        finalAnswerBlockId.current = null;
      }
      if (thinkingBlockId.current) {
        finalizeBlock(thinkingBlockId.current);
        thinkingBlockId.current = null;
      }
      setStreaming(false);
    },
    [dispatch, setStreaming, finalizeBlock]
  );

  const startStream = useCallback(
    async (message: string, sessionId: string) => {
      resetRefs();
      setStreaming(true);

      try {
        const response = await fetch(`${API_BASE}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, session_id: sessionId, project_dir: "." }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await consumeStream(response);
      } catch (err: any) {
        appendBlock("error", { type: "NetworkError", message: err.message, agent: "", tool: "" });
        setStreaming(false);
      }
    },
    [consumeStream, appendBlock, setStreaming]
  );

  const resumeStream = useCallback(
    async (sessionId: string, decision: string, toolName: string) => {
      resetRefs();
      setStreaming(true);

      try {
        const response = await fetch(`${API_BASE}/api/chat/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, decision, tool_name: toolName }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await consumeStream(response);
      } catch (err: any) {
        appendBlock("error", { type: "NetworkError", message: err.message, agent: "", tool: "" });
        setStreaming(false);
      }
    },
    [consumeStream, appendBlock, setStreaming]
  );

  const sendCommand = useCallback(
    async (command: string, sessionId: string): Promise<any> => {
      if (command === "/clear") {
        clearBlocks();
        const newId = useChatStore.getState().sessionId;
        return { result: "cleared" };
      }
      if (command === "/help") {
        appendBlock("final_answer", {
          content: `## Available Commands\n\n| Command | Description |\n|---|---|\n| \`/clear\` | Clear chat history |\n| \`/compact\` | Summarize conversation |\n| \`/cost\` | Show token usage and cost |\n| \`/help\` | Show this help |\n| \`/permissions\` | View session permissions |\n| \`/agent\` | List active agents |\n| \`/tools\` | List available tools |`,
        });
        finalizeBlock(useChatStore.getState().blocks.at(-1)!.id);
        return { result: "help" };
      }
      if (command === "/permissions") {
        const result = await fetch(`${API_BASE}/api/chat/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, session_id: sessionId, project_dir: "." }),
        }).then(r => r.json());
        setPermissions(result.permissions ?? []);
        useChatStore.getState().setShowPermissionsPanel(true);
        return result;
      }

      const result = await fetch(`${API_BASE}/api/chat/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, session_id: sessionId, project_dir: "." }),
      }).then(r => r.json());

      if (result.result === "cleared" && result.new_session_id) {
        clearBlocks();
        setSessionId(result.new_session_id);
      } else if (result.result === "agents") {
        const content = `## Active Agents\n\n${result.agents?.map((a: any) => `- **${a.name}** — ${a.role}`).join("\n") ?? ""}`;
        appendBlock("final_answer", { content });
        finalizeBlock(useChatStore.getState().blocks.at(-1)!.id);
      } else if (result.result === "tools") {
        const lines = Object.entries(result.tools ?? {}).map(([agent, tools]) =>
          `**${agent}:** ${(tools as string[]).join(", ")}`
        );
        appendBlock("final_answer", { content: `## Available Tools\n\n${lines.join("\n\n")}` });
        finalizeBlock(useChatStore.getState().blocks.at(-1)!.id);
      } else if (result.result === "cost") {
        appendBlock("final_answer", {
          content: `## Session Cost\n\n- **Input tokens:** ${result.input_tokens ?? 0}\n- **Output tokens:** ${result.output_tokens ?? 0}\n- **Estimated cost:** $${(result.cost_usd ?? 0).toFixed(4)}`,
        });
        finalizeBlock(useChatStore.getState().blocks.at(-1)!.id);
      } else if (result.result === "compacted") {
        appendBlock("final_answer", { content: `## Conversation Compacted\n\n${result.summary ?? ""}` });
        finalizeBlock(useChatStore.getState().blocks.at(-1)!.id);
      }

      return result;
    },
    [appendBlock, finalizeBlock, clearBlocks, setSessionId, setPermissions]
  );

  return { startStream, resumeStream, sendCommand };
}
