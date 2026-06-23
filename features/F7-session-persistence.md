# F7 — Session and State Persistence

**Status:** `implemented`
**Feature ID:** F7
**Owner:** —

---

## Objective

Use LangGraph's checkpointer to persist full conversation and agent state across sessions. Each session gets a unique `thread_id`. On reopening, the last conversation is restored. Users can see a list of past sessions and switch between them.

---

## Scope

- **Checkpointer**: `MemorySaver` for dev (in-process), upgradeable to `AsyncSqliteSaver` for disk persistence
- **Thread ID convention**: `uuid4()` per session, stored in frontend `localStorage` keyed by project dir
- **Session list**: `GET /api/sessions` returns metadata for all threads in the checkpointer
- **Session restore**: On load, frontend fetches last session's messages and renders them
- **Permission memory**: Lives in `backend/session_permissions.py` (in-memory per session)

---

## Checkpointer Setup

```python
# Development — MemorySaver (in-process, lost on restart)
from langgraph.checkpoint.memory import MemorySaver
checkpointer = MemorySaver()

# Production — AsyncSqliteSaver (disk-persisted, survives restarts)
# from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
# checkpointer = AsyncSqliteSaver.from_conn_string("./data/checkpoints.sqlite")

agent = create_deep_agent(
    ...,
    checkpointer=checkpointer,
)
```

### Thread ID per Session

```python
# Backend creates new session
@router.post("/api/sessions")
async def create_session(body: CreateSessionRequest):
    session_id = str(uuid4())
    return {"session_id": session_id, "project_dir": body.project_dir}

# Frontend stores in localStorage:
# { "/path/to/project": ["session-uuid-1", "session-uuid-2"] }
```

---

## Session List API

```python
# GET /api/sessions?project_dir=...
@router.get("/api/sessions")
async def list_sessions(project_dir: str = Query(...)):
    # Enumerate all thread_ids from checkpointer
    # MemorySaver: iterate checkpointer.storage.keys()
    # AsyncSqliteSaver: query sqlite threads table
    sessions = []
    for thread_id in get_thread_ids():
        state = agent.get_state({"configurable": {"thread_id": thread_id}})
        msgs = state.values.get("messages", [])
        sessions.append({
            "session_id": thread_id,
            "turn_count": len([m for m in msgs if m.get("role") == "user"]),
            "last_message": get_last_user_message(msgs),
            "created_at": state.created_at if hasattr(state, "created_at") else None,
        })
    return {"sessions": sessions}
```

---

## Session Restore

On frontend load:
1. Read `localStorage` for the project dir → get last `session_id`
2. `GET /api/sessions/{session_id}/messages` → receive message history
3. Reconstruct `Block[]` from message history and render in `ChatWindow`

```python
# GET /api/sessions/{session_id}/messages
@router.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    state = agent.get_state({"configurable": {"thread_id": session_id}})
    return {"messages": serialize_messages(state.values.get("messages", []))}
```

---

## Session Switcher UI

- `Sidebar` bottom section: "Past Sessions" collapsible panel
- Each session shown as: truncated last message + turn count + relative time
- Click to switch: clears current blocks, loads selected session's messages
- "New Session" button creates a fresh `session_id`

---

## Files Created / Modified

- `backend/agent_factory.py` (checkpointer wiring)
- `backend/routes/sessions.py` (create, list, get messages endpoints)
- `frontend/store/chatStore.ts` (current session_id, session list)
- `frontend/components/layout/Sidebar.tsx` (session switcher panel)
- `frontend/app/page.tsx` (session restore on load)

---

## Upgrade Path: MemorySaver → AsyncSqliteSaver

To enable persistence across backend restarts, swap the checkpointer in `agent_factory.py`:

```python
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
import os

os.makedirs("./data", exist_ok=True)
checkpointer = AsyncSqliteSaver.from_conn_string("./data/checkpoints.sqlite")
```

No other code changes needed — the `thread_id` convention is the same.

---

## Test Checklist

- [ ] New session: `POST /api/sessions` returns a `session_id`
- [ ] `GET /api/sessions` lists sessions with last message and turn count
- [ ] Restart backend (MemorySaver): chat history is gone (expected — dev mode)
- [ ] Swap to AsyncSqliteSaver: restart backend → chat history persists
- [ ] Switch session in sidebar: chat window shows correct history for that session
- [ ] "New Session" button creates fresh session, no history shown
- [ ] Session with pending HITL interrupt: switching away and back preserves interrupt state
