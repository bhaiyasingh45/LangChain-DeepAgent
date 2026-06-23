"use client";
import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "deepagent_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4(); // SSR
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = uuidv4();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export type BlockType =
  | "user"
  | "thinking"
  | "agent_selection"
  | "tool_call"
  | "permission"
  | "final_answer"
  | "error";

export interface Block {
  id: string;
  type: BlockType;
  payload: any;
  streaming: boolean;
  collapsed: boolean;
  timestamp: string;
}

interface SessionInfo {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface ChatStore {
  blocks: Block[];
  streaming: boolean;
  sessionId: string;
  sessionInfo: SessionInfo;
  permissions: Array<{ tool: string; icon: string; label: string }>;
  showPermissionsPanel: boolean;

  setSessionId: (id: string) => void;
  appendBlock: (type: BlockType, payload: any) => string;
  updateBlock: (id: string, updates: Partial<Block["payload"]>) => void;
  finalizeBlock: (id: string) => void;
  clearBlocks: () => void;
  setStreaming: (v: boolean) => void;
  updateSessionInfo: (info: Partial<SessionInfo>) => void;
  setPermissions: (p: ChatStore["permissions"]) => void;
  setShowPermissionsPanel: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  blocks: [],
  streaming: false,
  sessionId: getOrCreateSessionId(),
  sessionInfo: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
  permissions: [],
  showPermissionsPanel: false,

  setSessionId: (id) => set({ sessionId: id }),

  appendBlock: (type, payload) => {
    const id = uuidv4();
    const block: Block = {
      id,
      type,
      payload,
      streaming: true,
      collapsed: false,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ blocks: [...s.blocks, block] }));
    return id;
  },

  updateBlock: (id, updates) => {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === id
          ? {
              ...b,
              payload:
                typeof b.payload === "object" && b.payload !== null
                  ? { ...b.payload, ...updates }
                  : updates,
            }
          : b
      ),
    }));
  },

  finalizeBlock: (id) => {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, streaming: false } : b)),
    }));
  },

  clearBlocks: () => {
    const id = uuidv4();
    if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, id);
    set({ blocks: [], sessionId: id });
  },

  setStreaming: (v) => set({ streaming: v }),

  updateSessionInfo: (info) =>
    set((s) => ({ sessionInfo: { ...s.sessionInfo, ...info } })),

  setPermissions: (p) => set({ permissions: p }),

  setShowPermissionsPanel: (v) => set({ showPermissionsPanel: v }),
}));
