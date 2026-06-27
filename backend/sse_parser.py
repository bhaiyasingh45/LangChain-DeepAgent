"""Maps deepagents stream chunks (version='v2') to frontend SSE event types."""
import json
from typing import Any

from .session_permissions import CATEGORY_ICONS


def format_sse(event_type: str, data: Any) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"


def parse_chunk(chunk: dict) -> tuple[str, dict] | None:
    """
    Returns (event_type, data) or None if the chunk should be skipped.

    deepagents v2 chunk shape:
      {"type": "messages" | "updates" | "custom", "ns": tuple, "data": any}
    """
    chunk_type = chunk.get("type")
    data = chunk.get("data")
    ns = chunk.get("ns", ())

    # ── Messages mode: token-level LLM output ────────────────────────────────
    if chunk_type == "messages":
        if isinstance(data, (list, tuple)) and len(data) == 2:
            msg, meta = data
        else:
            return None

        content = getattr(msg, "content", "") or ""
        # Bedrock returns content as a list of dicts: [{"type":"text","text":"..."}]
        if isinstance(content, list):
            content = "".join(
                part.get("text", "") if isinstance(part, dict) else str(part)
                for part in content
            )
        if not content:
            return None

        is_final = not ns or ns == ()
        event_type = "final_answer_chunk" if is_final else "thinking_chunk"
        return event_type, {"content": content, "done": False}

    # ── Updates mode: node state changes ─────────────────────────────────────
    if chunk_type == "updates":
        if not isinstance(data, dict):
            return None

        # deepagents HITL: interrupt fires as {"__interrupt__": (Interrupt(...),)}
        if "__interrupt__" in data:
            interrupt_list = data["__interrupt__"]
            if interrupt_list:
                interrupt_obj = interrupt_list[0]
                # Interrupt objects have a .value attribute; plain dicts are passed through
                interrupt_val = getattr(interrupt_obj, "value", interrupt_obj)
                return "permission_request", build_permission_data(interrupt_val)
            return None

        for node_name, delta in data.items():
            if _is_subagent_node(node_name):
                agent_name = _extract_agent_name(node_name)
                return "agent_selection", {
                    "agent": agent_name,
                    "model": _AGENT_MODEL_LABEL.get(agent_name, ""),
                    "reason": _extract_routing_reason(delta),
                }
            tool_call = _extract_tool_call(delta)
            if tool_call:
                return "tool_call_start", tool_call
            tool_result = _extract_tool_result(delta)
            if tool_result:
                return "tool_call_result", tool_result
        return None

    # ── Custom mode: pass through directly ───────────────────────────────────
    if chunk_type == "custom" and isinstance(data, dict):
        event_type = data.get("type", "custom")
        return event_type, data.get("data", data)

    return None


def build_permission_data(interrupt_value: Any) -> dict:
    """Build the permission_request payload from a deepagents interrupt value.

    deepagents interrupt shape:
      {
        "action_requests": [{"name": "execute", "args": {...}, "description": "..."}],
        "review_configs":  [{"action_name": "execute", "allowed_decisions": [...]}]
      }
    """
    if isinstance(interrupt_value, dict):
        action_requests = interrupt_value.get("action_requests", [])
    else:
        action_requests = []

    tool_name = ""
    command_preview = ""
    if action_requests:
        req = action_requests[0]
        if isinstance(req, dict):
            # deepagents format: {"name": ..., "args": ...}
            tool_name = req.get("name", "") or req.get("action", {}).get("name", "")
            args = req.get("args", {}) or req.get("action", {}).get("args", {})
            command_preview = _format_command_preview(tool_name, args)

    icon, label = CATEGORY_ICONS.get(tool_name, ("⚙", tool_name or "unknown"))

    return {
        "tool_name": tool_name,
        "category": label,
        "icon": icon,
        "command": command_preview,
        "action_requests": action_requests,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────

_SUBAGENT_NAMES = {"file-agent", "shell-agent", "web-agent", "code-agent"}

# Must stay in sync with model assignments in agent_factory.py
_AGENT_MODEL_LABEL: dict[str, str] = {
    "file-agent":  "Haiku 4.5",
    "shell-agent": "Haiku 4.5",
    "web-agent":   "Haiku 4.5",
    "code-agent":  "Sonnet 4.5",
}


def _is_subagent_node(node_name: str) -> bool:
    return any(name in node_name for name in _SUBAGENT_NAMES)


def _extract_agent_name(node_name: str) -> str:
    for name in _SUBAGENT_NAMES:
        if name in node_name:
            return name
    return node_name


def _extract_routing_reason(delta: Any) -> str:
    if isinstance(delta, dict):
        msgs = delta.get("messages", [])
        if msgs:
            last = msgs[-1]
            content = getattr(last, "content", "") or (last.get("content", "") if isinstance(last, dict) else "")
            if isinstance(content, list):
                content = "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in content)
            return str(content)[:300]
    return ""


def _extract_tool_call(delta: Any) -> dict | None:
    if not isinstance(delta, dict):
        return None
    msgs = delta.get("messages", [])
    for msg in msgs:
        tool_calls = getattr(msg, "tool_calls", None) or (msg.get("tool_calls") if isinstance(msg, dict) else None)
        if tool_calls:
            tc = tool_calls[0]
            name = getattr(tc, "name", None) or (tc.get("name") if isinstance(tc, dict) else None)
            args = getattr(tc, "args", {}) or (tc.get("args", {}) if isinstance(tc, dict) else {})
            tc_id = getattr(tc, "id", None) or (tc.get("id") if isinstance(tc, dict) else None)
            if name:
                return {"tool": name, "args": args, "id": tc_id, "status": "running"}
    return None


def _extract_tool_result(delta: Any) -> dict | None:
    if not isinstance(delta, dict):
        return None
    msgs = delta.get("messages", [])
    for msg in msgs:
        msg_type = getattr(msg, "type", None) or (msg.get("type") if isinstance(msg, dict) else None)
        if msg_type == "tool":
            name = getattr(msg, "name", None) or (msg.get("name") if isinstance(msg, dict) else "tool")
            content = getattr(msg, "content", "") or (msg.get("content", "") if isinstance(msg, dict) else "")
            tool_call_id = getattr(msg, "tool_call_id", None) or (msg.get("tool_call_id") if isinstance(msg, dict) else None)
            status = "error" if "error" in str(content).lower() else "done"
            return {"tool": name, "output": str(content)[:2000], "id": tool_call_id, "status": status}
    return None


def _format_command_preview(tool_name: str, args: dict) -> str:
    if tool_name == "execute":
        return args.get("command", "")
    if tool_name in ("write_file", "edit_file", "delete_file"):
        return args.get("file_path", "")
    if tool_name == "internet_search":
        return f"Search: {args.get('query', '')}"
    if tool_name == "fetch_url":
        return args.get("url", "")
    return str(args)
