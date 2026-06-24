import json
import logging
from uuid import uuid4
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from langgraph.types import Command

log = logging.getLogger(__name__)

from ..agent_factory import get_agent_async, get_base_interrupt_on
from ..session_permissions import (
    compute_interrupt_on,
    allow_session,
    get_all as get_permissions,
    clear_session,
    revoke,
)
from ..sse_parser import format_sse, parse_chunk, build_permission_data

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Try to import GraphInterrupt — name may vary by langgraph version
try:
    from langgraph.errors import GraphInterrupt
except ImportError:
    GraphInterrupt = Exception


class StreamRequest(BaseModel):
    message: str
    session_id: str
    project_dir: str = "."


class ResumeRequest(BaseModel):
    session_id: str
    decision: str          # "allow" | "deny" | "allow_session"
    tool_name: str = ""    # used for allow_session to know what to remember


class CommandRequest(BaseModel):
    command: str
    session_id: str
    project_dir: str = "."


@router.post("/stream")
async def stream_chat(body: StreamRequest):
    try:
        agent = await get_agent_async()
    except Exception as e:
        log.exception("Agent init failed")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Agent initialization failed: {e}"},
        )

    config = {"configurable": {"thread_id": body.session_id}}

    async def event_generator():
        try:
            async for chunk in agent.astream(
                {"messages": [{"role": "user", "content": body.message}]},
                config=config,
                stream_mode=["messages", "updates", "custom"],
                version="v2",
            ):
                parsed = parse_chunk(chunk)
                if parsed:
                    event_type, data = parsed
                    yield format_sse(event_type, data)

        except GraphInterrupt as e:
            interrupt_val = e.args[0] if e.args else {}
            perm_data = build_permission_data(interrupt_val)
            yield format_sse("permission_request", perm_data)

        except Exception as e:
            yield format_sse("error", {"type": type(e).__name__, "message": str(e), "agent": "", "tool": ""})

        finally:
            # Emit done signal
            yield format_sse("stream_end", {"done": True})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/resume")
async def resume_chat(body: ResumeRequest):
    try:
        agent = await get_agent_async()
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

    config = {"configurable": {"thread_id": body.session_id}}

    if body.decision == "allow_session" and body.tool_name:
        allow_session(body.session_id, body.tool_name)

    decision_type = "reject" if body.decision == "deny" else "approve"
    reject_msg = "User denied this action." if decision_type == "reject" else ""

    resume_payload = {"decisions": [{"type": decision_type}]}
    if decision_type == "reject":
        resume_payload["decisions"][0]["message"] = reject_msg

    async def event_generator():
        try:
            async for chunk in agent.astream(
                Command(resume=resume_payload),
                config=config,
                stream_mode=["messages", "updates", "custom"],
                version="v2",
            ):
                parsed = parse_chunk(chunk)
                if parsed:
                    event_type, data = parsed
                    yield format_sse(event_type, data)

        except GraphInterrupt as e:
            interrupt_val = e.args[0] if e.args else {}
            perm_data = build_permission_data(interrupt_val)
            yield format_sse("permission_request", perm_data)

        except Exception as e:
            yield format_sse("error", {"type": type(e).__name__, "message": str(e), "agent": "", "tool": ""})

        finally:
            yield format_sse("stream_end", {"done": True})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/command")
async def handle_command(body: CommandRequest):
    agent = await get_agent_async()
    config = {"configurable": {"thread_id": body.session_id}}

    match body.command:
        case "/clear":
            clear_session(body.session_id)
            new_session_id = str(uuid4())
            return {"result": "cleared", "new_session_id": new_session_id}

        case "/compact":
            try:
                state = await agent.aget_state(config)
                messages = state.values.get("messages", []) if state else []
                history_text = "\n".join(
                    f"{m.get('role', getattr(m, 'type', ''))}: {m.get('content', getattr(m, 'content', ''))}"
                    if isinstance(m, dict) else f"{getattr(m, 'type', 'msg')}: {getattr(m, 'content', '')}"
                    for m in messages[-20:]
                )
                summary = f"[Compacted — {len(messages)} messages summarized]\n\nConversation summary: {history_text[:500]}..."
                return {"result": "compacted", "summary": summary, "original_count": len(messages)}
            except Exception as e:
                return {"result": "error", "message": str(e)}

        case "/cost":
            try:
                state = await agent.aget_state(config)
                messages = state.values.get("messages", []) if state else []
                input_tokens = 0
                output_tokens = 0
                for msg in messages:
                    um = getattr(msg, "usage_metadata", None)
                    if um and isinstance(um, dict):
                        input_tokens += um.get("input_tokens", 0)
                        output_tokens += um.get("output_tokens", 0)
                # Claude Sonnet 4.5 on Bedrock: $3/MTok in, $15/MTok out
                cost_usd = (input_tokens * 3.0 + output_tokens * 15.0) / 1_000_000
                return {
                    "result": "cost",
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "cost_usd": cost_usd,
                }
            except Exception:
                return {"result": "cost", "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0}

        case "/agent":
            return {
                "result": "agents",
                "agents": [
                    {"name": "file-agent",  "role": "File read/write/edit/search"},
                    {"name": "shell-agent", "role": "Bash/shell/git/packages (requires approval)"},
                    {"name": "web-agent",   "role": "Web search/URL fetch (requires approval)"},
                    {"name": "code-agent",  "role": "Code generation/review/refactor"},
                ],
            }

        case "/tools":
            return {
                "result": "tools",
                "tools": {
                    "orchestrator":  ["write_todos", "task"],
                    "file-agent":    ["ls", "read_file", "write_file", "edit_file", "glob", "grep", "delete_file"],
                    "shell-agent":   ["execute"],
                    "web-agent":     ["internet_search", "fetch_url"],
                    "code-agent":    ["read_file"],
                },
            }

        case "/permissions":
            return {
                "result": "permissions",
                "permissions": get_permissions(body.session_id),
            }

        case "/help":
            return {
                "result": "help",
                "commands": [
                    {"command": "/clear",       "description": "Clear chat history and start a new session"},
                    {"command": "/compact",     "description": "Summarize conversation to reduce context length"},
                    {"command": "/cost",        "description": "Show total tokens used and estimated cost"},
                    {"command": "/help",        "description": "Show this help message"},
                    {"command": "/permissions", "description": "View and revoke session-level permissions"},
                    {"command": "/agent",       "description": "List active agents in the current graph"},
                    {"command": "/tools",       "description": "List all tools available to the agent"},
                ],
            }

        case _:
            return {"result": "error", "message": f"Unknown command: {body.command}"}


@router.delete("/sessions/{session_id}/permissions/{tool_name}")
async def revoke_permission(session_id: str, tool_name: str):
    revoke(session_id, tool_name)
    return {"result": "revoked", "tool": tool_name}
