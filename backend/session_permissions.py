from threading import Lock

_lock = Lock()
_permissions: dict[str, set[str]] = {}

CATEGORY_ICONS = {
    "execute":         ("🖥", "Bash / Shell"),
    "write_file":      ("📁", "File Write"),
    "edit_file":       ("📁", "File Edit"),
    "delete_file":     ("📁", "File Delete"),
    "internet_search": ("🌐", "Web Search"),
    "fetch_url":       ("🌐", "URL Fetch"),
}


def is_allowed(session_id: str, tool: str) -> bool:
    with _lock:
        return tool in _permissions.get(session_id, set())


def allow_session(session_id: str, tool: str) -> None:
    with _lock:
        _permissions.setdefault(session_id, set()).add(tool)


def revoke(session_id: str, tool: str) -> None:
    with _lock:
        _permissions.get(session_id, set()).discard(tool)


def get_all(session_id: str) -> list[dict]:
    with _lock:
        tools = _permissions.get(session_id, set())
        return [
            {
                "tool": t,
                "icon": CATEGORY_ICONS.get(t, ("⚙", t))[0],
                "label": CATEGORY_ICONS.get(t, ("⚙", t))[1],
            }
            for t in sorted(tools)
        ]


def clear_session(session_id: str) -> None:
    with _lock:
        _permissions.pop(session_id, None)


def compute_interrupt_on(session_id: str, base_interrupt_on: dict) -> dict:
    """Remove tools that the user has already approved session-wide."""
    with _lock:
        allowed = _permissions.get(session_id, set())
    return {tool: val for tool, val in base_interrupt_on.items() if tool not in allowed}
