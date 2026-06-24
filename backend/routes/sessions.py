from uuid import uuid4
from fastapi import APIRouter, Query
from ..agent_factory import get_agent

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("")
async def create_session(project_dir: str = "."):
    session_id = str(uuid4())
    return {"session_id": session_id, "project_dir": project_dir}


@router.get("/")
async def list_sessions(project_dir: str = Query(default=".")):
    agent = get_agent()
    sessions = []
    try:
        # MemorySaver exposes storage dict; iterate known thread IDs
        checkpointer = agent.checkpointer if hasattr(agent, "checkpointer") else None
        if checkpointer and hasattr(checkpointer, "storage"):
            for thread_id in list(checkpointer.storage.keys())[:20]:
                try:
                    state = agent.get_state({"configurable": {"thread_id": thread_id}})
                    if state and state.values:
                        msgs = state.values.get("messages", [])
                        user_msgs = [
                            m for m in msgs
                            if (isinstance(m, dict) and m.get("role") == "user")
                            or getattr(m, "type", "") == "human"
                        ]
                        last_msg = ""
                        if user_msgs:
                            last = user_msgs[-1]
                            last_msg = (
                                last.get("content", "") if isinstance(last, dict)
                                else getattr(last, "content", "")
                            )
                        sessions.append({
                            "session_id": thread_id,
                            "turn_count": len(user_msgs),
                            "last_message": str(last_msg)[:80],
                        })
                except Exception:
                    continue
    except Exception:
        pass
    return {"sessions": sessions}


@router.get("/{session_id}/messages")
async def get_session_messages(session_id: str):
    agent = get_agent()
    try:
        state = agent.get_state({"configurable": {"thread_id": session_id}})
        messages = state.values.get("messages", []) if state and state.values else []
        serialized = []
        for m in messages:
            if isinstance(m, dict):
                serialized.append(m)
            else:
                serialized.append({
                    "role": getattr(m, "type", "unknown"),
                    "content": str(getattr(m, "content", "")),
                })
        return {"messages": serialized}
    except Exception as e:
        return {"messages": [], "error": str(e)}
