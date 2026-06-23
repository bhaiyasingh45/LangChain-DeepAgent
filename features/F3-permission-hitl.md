# F3 — User Permission / Approval System with Memory

**Status:** `implemented`
**Feature ID:** F3
**Owner:** —

---

## Objective

When the agent wants to perform a sensitive action (bash, file write, web search, package install, git), it must pause and ask the user for explicit permission before executing. This uses deepagents' native `interrupt_on` mechanism — not a frontend-only dialog. The agent actually pauses at the LangGraph level.

---

## Scope

### Sensitive Action Categories

| Category | Icon | Tools | Always requires approval |
|---|---|---|---|
| Bash / Shell | 🖥 | `execute` | Yes |
| File Write | 📁 | `write_file`, `edit_file`, `delete_file` | Yes |
| Web / Internet | 🌐 | `internet_search`, `fetch_url` | Yes |
| Package Install | 📦 | `execute` with pip/npm/brew | Subset of bash |
| Git Operations | 🔀 | `execute` with git | Subset of bash |

### Permission Decision Types (deepagents API)

| User Action | Decision sent to backend | Effect |
|---|---|---|
| [Allow] (no checkbox) | `{"type": "approve"}` | Execute once; ask again next time |
| [Allow] + checkbox | `{"type": "approve"}` + session_permissions updated | Never ask for this category again this session |
| [Deny] | `{"type": "reject", "message": "User denied"}` | Agent skips action, acknowledges gracefully |

---

## Backend Implementation

### `interrupt_on` in `agent_factory.py`

```python
interrupt_on={
    "execute":         True,
    "write_file":      True,
    "edit_file":       True,
    "delete_file":     True,
    "internet_search": True,
    "fetch_url":       True,
}
```

### Session Permissions (`backend/session_permissions.py`)

```python
# In-memory store: session_id → set of approved tool names
_session_permissions: dict[str, set[str]] = {}

def is_allowed(session_id: str, tool: str) -> bool: ...
def allow(session_id: str, tool: str) -> None: ...
def revoke(session_id: str, tool: str) -> None: ...
def get_all(session_id: str) -> list[str]: ...
def clear(session_id: str) -> None: ...
```

Before starting a stream, compute effective `interrupt_on` by removing tools in `session_permissions[session_id]`.

### GraphInterrupt Handling

```python
try:
    async for chunk in agent.astream(...):
        yield format_sse(chunk)
except GraphInterrupt as e:
    action_requests = e.value.get("action_requests", [])
    yield format_sse({
        "type": "permission_request",
        "data": {
            "category": derive_category(action_requests[0]),
            "icon": category_icon(action_requests[0]),
            "command": extract_command(action_requests[0]),
            "action_requests": action_requests,
        }
    })
```

### Resume Endpoint (`POST /api/chat/resume`)

```python
from langgraph.types import Command

decision_type = "approve" if body.decision in ("allow", "allow_session") else "reject"
if body.decision == "allow_session":
    session_permissions.allow(body.session_id, body.tool_name)

async for chunk in agent.astream(
    Command(resume={"decisions": [{"type": decision_type}]}),
    config={"configurable": {"thread_id": body.session_id}},
    stream_mode=["messages", "updates", "custom"],
    version="v2",
):
    yield format_sse(chunk)
```

---

## Frontend Implementation — `PermissionBlock`

```tsx
// Rendered when SSE event type === "permission_request"
<div class="border border-cc-yellow bg-cc-elevated rounded p-3 my-2">
  <div class="flex items-center gap-2 mb-2">
    <span>{icon}</span>
    <span class="text-cc-yellow font-semibold">Approval Required</span>
  </div>
  <pre class="text-cc-dim text-sm mb-3">{command}</pre>
  <label class="flex items-center gap-2 text-cc-dim text-xs mb-3">
    <input type="checkbox" /> Always allow this type of action in this session
  </label>
  <div class="flex gap-2">
    <button class="bg-cc-green text-black px-3 py-1 rounded">Allow</button>
    <button class="bg-cc-red text-white px-3 py-1 rounded">Deny</button>
  </div>
</div>
```

On click: POST to `/api/chat/resume` → new SSE stream opens → continues rendering blocks.

### Permissions Panel (`/permissions` slash command)

- Lists all `session_permissions` for current session
- Each row: tool category icon + name + [Revoke] button
- Revoke calls `DELETE /api/sessions/{id}/permissions/{tool}`

---

## Files Created / Modified

- `backend/session_permissions.py`
- `backend/routes/chat.py` (GraphInterrupt handling, resume endpoint)
- `backend/agent_factory.py` (effective interrupt_on computation)
- `frontend/components/chat/blocks/PermissionBlock.tsx`
- `frontend/components/permissions/PermissionsPanel.tsx`

---

## Test Checklist

- [ ] Sending "run ls -la" triggers `PermissionBlock` in chat — agent paused
- [ ] Clicking [Allow] resumes stream — tool executes, result appears
- [ ] Clicking [Deny] — agent responds with graceful denial, no tool execution
- [ ] Checking "Always allow" + Allow → same tool never prompts again in session
- [ ] `/permissions` command shows the always-allowed list
- [ ] Revoking a permission from the panel → next use prompts again
- [ ] Agent gracefully handles multi-turn after denial (does not retry denied action)
- [ ] MemorySaver checkpointer correctly resumes from the same thread_id
