# F6 — Slash Commands

**Status:** `implemented`
**Feature ID:** F6
**Owner:** —

---

## Objective

Support 7 slash commands in the input bar, identical to Claude Code's behavior. Detected when `/` is the first character. Show an autocomplete dropdown while typing.

---

## Command Reference

| Command | Handler | Implementation |
|---|---|---|
| `/clear` | Frontend + Backend | Clear Zustand blocks; `POST /api/chat/command {command: "/clear"}` creates new thread_id |
| `/compact` | Backend | LLM call to summarize messages; checkpointer stores summary; new turns see summary instead of full history |
| `/cost` | Backend | Read `total_input_tokens`, `total_output_tokens`, cost_usd from agent state via `agent.get_state(config)` |
| `/help` | Frontend | Render a static `FinalAnswerBlock` locally listing all commands and tools |
| `/permissions` | Frontend | Open `PermissionsPanel` modal — lists session-allowed tool categories with revoke buttons |
| `/agent` | Backend | Return list of active subagent names from agent config |
| `/tools` | Backend | Enumerate all tools from each subagent dict |

---

## Slash Command Detection

```ts
// hooks/useSlashCommands.ts
const SLASH_COMMANDS = [
  { command: '/clear',       description: 'Clear chat history and reset session' },
  { command: '/compact',     description: 'Summarize conversation to reduce context' },
  { command: '/cost',        description: 'Show total tokens and cost for this session' },
  { command: '/help',        description: 'List all commands and available tools' },
  { command: '/permissions', description: 'View and revoke session-level permissions' },
  { command: '/agent',       description: 'Show active agents in the current graph' },
  { command: '/tools',       description: 'List all tools available to the agent' },
]

export function useSlashCommands(inputValue: string) {
  const isSlash = inputValue.startsWith('/')
  const suggestions = isSlash
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(inputValue))
    : []
  return { isSlash, suggestions }
}
```

**Autocomplete UI**: Appears above the input bar when typing `/`. Arrow keys to navigate, Enter to select.

---

## Backend Command Handler

```python
# POST /api/chat/command
@router.post("/api/chat/command")
async def handle_command(body: CommandRequest):
    match body.command:
        case "/clear":
            # Invalidate thread — frontend creates new session_id
            return {"result": "cleared", "new_session_id": str(uuid4())}
        
        case "/compact":
            # Summarize via agent, store in state
            summary = await summarize_conversation(body.session_id)
            return {"result": "compacted", "summary": summary}
        
        case "/cost":
            state = agent.get_state({"configurable": {"thread_id": body.session_id}})
            values = state.values
            return {
                "input_tokens": values.get("total_input_tokens", 0),
                "output_tokens": values.get("total_output_tokens", 0),
                "cost_usd": values.get("total_cost_usd", 0.0),
            }
        
        case "/agent":
            return {"agents": [s["name"] for s in [FILE_AGENT, SHELL_AGENT, WEB_AGENT, CODE_AGENT]]}
        
        case "/tools":
            return {"tools": get_all_tool_names()}
```

---

## /compact Implementation

```python
async def summarize_conversation(session_id: str) -> str:
    state = agent.get_state({"configurable": {"thread_id": session_id}})
    messages = state.values.get("messages", [])
    
    summary_agent = create_deep_agent(
        model="azure_openai:gpt-4o-mini",
        system_prompt="Summarize this conversation concisely for an AI coding assistant.",
    )
    result = summary_agent.invoke({
        "messages": [
            *messages,
            {"role": "user", "content": "Summarize the above conversation in 3-5 bullet points."}
        ]
    })
    summary = result["messages"][-1].content
    
    # Reset thread with only the summary
    agent.update_state(
        {"configurable": {"thread_id": session_id}},
        {"messages": [{"role": "assistant", "content": f"[Session Summary]\n{summary}"}]}
    )
    return summary
```

---

## Files Created / Modified

- `backend/routes/chat.py` (`/api/chat/command` endpoint)
- `frontend/hooks/useSlashCommands.ts`
- `frontend/components/chat/InputBar.tsx` (autocomplete dropdown)
- `frontend/components/permissions/PermissionsPanel.tsx` (`/permissions`)

---

## Test Checklist

- [ ] Typing `/` in InputBar shows autocomplete dropdown with all 7 commands
- [ ] Arrow keys + Enter selects a command from dropdown
- [ ] `/clear` — all blocks removed, new `session_id` assigned
- [ ] `/compact` — summary message appears as `FinalAnswerBlock`, turn count shows reset
- [ ] `/cost` — token count and USD cost shown accurately
- [ ] `/help` — static block rendered with full command list and tool list
- [ ] `/permissions` — PermissionsPanel modal opens with current session permissions
- [ ] `/agent` — lists 4 subagent names in chat
- [ ] `/tools` — lists all tool names grouped by agent
