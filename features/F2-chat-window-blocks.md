# F2 — Chat Window with Full Agent Transparency

**Status:** `implemented`
**Feature ID:** F2
**Owner:** —

---

## Objective

The chat window renders every internal agent event as a distinct, typed block. Each block streams progressively — no waiting for full response. The user can see exactly what the agent is thinking, which sub-agent it chose, which tools it called, and what the results were.

---

## Scope — 7 Block Types

| Block | Label | Key Content |
|---|---|---|
| `UserMessageBlock` | User | Message text, timestamp |
| `ThinkingBlock` | Thinking... | Collapsible, streamed reasoning text, blue left border |
| `AgentSelectionBlock` | Routing to: X | Agent name (amber), reason text |
| `ToolCallBlock` | Tool: X | Tool name (purple), JSON args, status badge, collapsible output |
| `PermissionBlock` | ⚠ Approval Required | Category icon + command, Allow/Deny buttons, Always-allow checkbox |
| `FinalAnswerBlock` | — | Markdown-rendered response with syntax highlighting |
| `ErrorBlock` | Error | Error type (red), message, agent/tool that caused it |

---

## Implementation Plan

1. Define Zustand `chatStore.ts` with `Block[]` state, `appendBlock`, `updateBlock`, `clearBlocks`
2. Build `ChatWindow.tsx` — maps blocks array to block components, auto-scrolls to bottom
3. Build each block component in `components/chat/blocks/`:
   - `UserMessageBlock`: timestamp in `cc-dim`, text in `cc-text`
   - `ThinkingBlock`: `border-l-2 border-cc-blue bg-cc-elevated`, chevron toggle for collapse, streams content
   - `AgentSelectionBlock`: `🔀` icon, agent name in `cc-amber`, reason in `cc-dim`
   - `ToolCallBlock`: tool name in `cc-purple`, JSON code block for args, status badge (`cc-yellow` → `cc-green`/`cc-red`), collapsible output
   - `PermissionBlock`: see F3 for full spec
   - `FinalAnswerBlock`: `react-markdown` with `remark-gfm` + `rehype-highlight` for code blocks
   - `ErrorBlock`: `border-l-2 border-cc-red`, error type bold, stack trace collapsible

4. Wire `useSSEStream` hook (F5) to dispatch correct block type per SSE event

---

## Zustand Store Shape

```ts
interface Block {
  id: string                  // uuid
  type: BlockType
  payload: any                // type-specific data
  streaming: boolean          // true while receiving chunks
  collapsed: boolean          // for collapsible blocks
  timestamp: string           // ISO string
}

type BlockType =
  | 'user'
  | 'thinking'
  | 'agent_selection'
  | 'tool_call'
  | 'permission'
  | 'final_answer'
  | 'error'
```

---

## SSE Event → Block Mapping

| SSE Event | Block Action |
|---|---|
| `thinking_chunk` | `appendBlock(thinking)` on first chunk, `updateBlock` on subsequent |
| `agent_selection` | `appendBlock(agent_selection)` |
| `tool_call_start` | `appendBlock(tool_call, {status: "running"})` |
| `tool_call_result` | `updateBlock(tool_call, {output, status: "done"/"error"})` |
| `permission_request` | `appendBlock(permission)` |
| `final_answer_chunk` | `appendBlock(final_answer)` on first, `updateBlock` on subsequent |
| `error` | `appendBlock(error)` |
| `session_info` | update token counter in top bar (not a block) |

---

## Files Created / Modified

- `frontend/store/chatStore.ts`
- `frontend/components/chat/ChatWindow.tsx`
- `frontend/components/chat/blocks/UserMessageBlock.tsx`
- `frontend/components/chat/blocks/ThinkingBlock.tsx`
- `frontend/components/chat/blocks/AgentSelectionBlock.tsx`
- `frontend/components/chat/blocks/ToolCallBlock.tsx`
- `frontend/components/chat/blocks/PermissionBlock.tsx`
- `frontend/components/chat/blocks/FinalAnswerBlock.tsx`
- `frontend/components/chat/blocks/ErrorBlock.tsx`

---

## Test Checklist

- [ ] Sending a message adds a `UserMessageBlock` immediately
- [ ] Thinking text streams token by token into `ThinkingBlock`
- [ ] `ThinkingBlock` can be collapsed/expanded with chevron
- [ ] `AgentSelectionBlock` shows correct agent name in amber
- [ ] `ToolCallBlock` starts with yellow "running" badge, turns green/red on result
- [ ] `ToolCallBlock` JSON args are syntax-highlighted
- [ ] `FinalAnswerBlock` renders markdown — headers, code blocks, bullet lists
- [ ] `ErrorBlock` shows red border and error message
- [ ] Chat auto-scrolls to latest block
- [ ] All blocks render without layout shift during streaming
