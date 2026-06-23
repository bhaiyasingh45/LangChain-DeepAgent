# F4 — Multi-Agent Architecture with Visible Routing

**Status:** `implemented`
**Feature ID:** F4
**Owner:** —

---

## Objective

The backend uses `create_deep_agent()` with 4 specialized subagents. The orchestrator agent routes tasks to the correct subagent and logs its routing decision visibly in the chat as an `AgentSelectionBlock`. Each subagent runs in an isolated context window.

---

## Scope — Agent Roster

| Agent | Role | Tools | Requires Approval |
|---|---|---|---|
| Orchestrator | Main agent — receives user message, plans, delegates | write_todos, task (spawn subagent) | No |
| `file-agent` | File read/write/edit/search operations | ls, read_file, write_file, edit_file, glob, grep | write/edit/delete |
| `shell-agent` | Bash commands, git, package installs | execute | Always |
| `web-agent` | Internet search, URL fetch | internet_search, fetch_url | Always |
| `code-agent` | Code generation, review, refactoring, explanation | read_file (context), returns text | No |

---

## deepagents API Used

### Subagent dict format (exact API):
```python
SUBAGENT = {
    "name": str,               # unique identifier, shown in AgentSelectionBlock
    "description": str,        # action-oriented; determines when orchestrator delegates here
    "system_prompt": str,      # specialized instructions
    "tools": list[Callable],   # optional; overrides inherited tools
    "interrupt_on": dict,      # optional; per-subagent HITL config
}
```

### Orchestrator routing is automatic:
The orchestrator reads all subagent `description` fields and decides which to invoke via the built-in `task` tool. We surface the routing decision by parsing `agent_selection` events from the stream.

---

## AGENTS.md (Behavioral Guidelines)

Loaded at startup via `memory=["./AGENTS.md"]`. Defines:
- Identity and routing rules
- Response style (always show reasoning before delegating)
- HITL acknowledgment rules (gracefully handle denial)

---

## Skills (on-demand knowledge modules)

4 SKILL.md files in `skills/`. Only `name` + `description` in system prompt at startup; full body loads on activation.

| Skill | Activates when... |
|---|---|
| `file-operations` | User mentions reading/writing/searching files |
| `shell-execution` | User asks for terminal commands or git ops |
| `web-research` | User asks to search the web or fetch a URL |
| `code-generation` | User asks for code writing, review, or explanation |

---

## Visible Routing in Chat

When the orchestrator delegates to a subagent, the stream emits an `agent_selection` SSE event. The frontend renders it as:

```
🔀  Routing to: shell-agent
    Reason: Task involves running a bash command
```

This is parsed from `type="updates"` chunks where the update node name contains the subagent name.

---

## Implementation Plan

1. Create `backend/subagents/file_agent.py` — `FILE_AGENT` dict
2. Create `backend/subagents/shell_agent.py` — `SHELL_AGENT` dict
3. Create `backend/subagents/web_agent.py` — `WEB_AGENT` dict + import tools
4. Create `backend/subagents/code_agent.py` — `CODE_AGENT` dict
5. Create `AGENTS.md` at repo root with routing guidelines
6. Create `skills/` with 4 SKILL.md files (YAML frontmatter + body)
7. Wire all into `agent_factory.py` via `create_deep_agent(subagents=[...], memory=["./AGENTS.md"], skills=["./skills/"])`
8. In SSE event parser: detect `updates` chunk with subagent node name → emit `agent_selection` event

---

## Files Created / Modified

- `AGENTS.md` (repo root)
- `skills/file-operations/SKILL.md`
- `skills/shell-execution/SKILL.md`
- `skills/web-research/SKILL.md`
- `skills/code-generation/SKILL.md`
- `backend/subagents/file_agent.py`
- `backend/subagents/shell_agent.py`
- `backend/subagents/web_agent.py`
- `backend/subagents/code_agent.py`
- `backend/agent_factory.py`
- `frontend/components/chat/blocks/AgentSelectionBlock.tsx`

---

## Test Checklist

- [ ] "List the files in the current directory" → routes to `file-agent`, `AgentSelectionBlock` appears
- [ ] "Run git status" → routes to `shell-agent`, `PermissionBlock` appears before execution
- [ ] "Search the web for Python 3.13 release notes" → routes to `web-agent`, `PermissionBlock` appears
- [ ] "Write a Python class for a linked list" → routes to `code-agent`, no permission block
- [ ] AGENTS.md guidelines are reflected in agent behavior (check routing follows rules)
- [ ] `shell-execution` skill full body is loaded when a shell task is active
- [ ] `web-research` skill cites sources in final answer
- [ ] Subagent result is visible in chat (tool_call_result block shows output)
