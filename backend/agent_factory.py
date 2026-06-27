import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env", override=False)

from langchain_aws import ChatBedrock
from deepagents import create_deep_agent
from deepagents.backends import LocalShellBackend
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from .config import settings
from .subagents.file_agent import FILE_AGENT
from .subagents.shell_agent import SHELL_AGENT
from .subagents.web_agent import WEB_AGENT
from .subagents.code_agent import CODE_AGENT

BASE_INTERRUPT_ON = {
    "execute":         True,
    "write_file":      True,
    "edit_file":       True,
    "delete_file":     True,
    "internet_search": True,
    "fetch_url":       True,
}

_agent = None
_checkpointer = None
_checkpointer_cm = None  # context manager that owns the db connection


async def _build_agent_async():
    global _agent, _checkpointer, _checkpointer_cm

    os.makedirs(settings.workspace_dir, exist_ok=True)
    os.makedirs(settings.data_dir, exist_ok=True)

    db_path = str(Path(settings.data_dir) / "checkpoints.db")

    # AsyncSqliteSaver persists chat history across server restarts
    _checkpointer_cm = AsyncSqliteSaver.from_conn_string(db_path)
    _checkpointer = await _checkpointer_cm.__aenter__()

    model = ChatBedrock(
        model_id=settings.bedrock_model_id,
        region_name=settings.aws_default_region,
        model_kwargs={"temperature": 0, "max_tokens": 4096},
    )

    # Haiku for file/shell/web — faster and cheaper; Sonnet stays for code reasoning
    haiku_model = ChatBedrock(
        model_id=settings.bedrock_haiku_model_id,
        region_name=settings.aws_default_region,
        model_kwargs={"temperature": 0, "max_tokens": 2048},
    )

    backend = LocalShellBackend(
        root_dir=settings.workspace_dir,
        virtual_mode=True,
        timeout=30,
    )

    memory_files = []
    if Path(settings.agents_md_path).exists():
        memory_files.append(settings.agents_md_path)

    skills_dirs = []
    if Path(settings.skills_dir).exists():
        skills_dirs.append(settings.skills_dir)

    # Build subagent dicts with per-agent model overrides
    file_agent  = {**FILE_AGENT,  "model": haiku_model}
    shell_agent = {**SHELL_AGENT, "model": haiku_model}
    web_agent   = {**WEB_AGENT,   "model": haiku_model}
    code_agent  = {**CODE_AGENT,  "model": model}   # Sonnet — needs reasoning

    _agent = create_deep_agent(
        model=model,
        system_prompt=(
            "You are ClaudeCode DeepAgent, a powerful full-stack coding assistant. "
            "You operate inside a virtual filesystem where '/' is your workspace root. "
            "IMPORTANT PATH RULES:\n"
            "- To list files use: ls / or ls /test (NOT any absolute host path)\n"
            "- To create a folder: mkdir test (relative) or mkdir /test (virtual root)\n"
            "- To write a file use path='test/add_numbers.py' or path='/test/add_numbers.py'\n"
            "- NEVER use full host paths like '/Users/...' or '/home/...'\n"
            "- All paths are relative to your virtual workspace root '/'\n"
            "Follow the guidelines in AGENTS.md. "
            "Always show your reasoning before delegating to a subagent."
        ),
        subagents=[file_agent, shell_agent, web_agent, code_agent],
        memory=memory_files if memory_files else None,
        skills=skills_dirs if skills_dirs else None,
        interrupt_on=BASE_INTERRUPT_ON,
        backend=backend,
        checkpointer=_checkpointer,
    )


def _build_agent():
    """Sync wrapper — runs the async build in the current event loop or a new one."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context (FastAPI startup) — schedule as task
            asyncio.ensure_future(_build_agent_async())
        else:
            loop.run_until_complete(_build_agent_async())
    except RuntimeError:
        asyncio.run(_build_agent_async())


async def get_agent_async():
    """Async-safe getter used by FastAPI route handlers."""
    global _agent
    if _agent is None:
        await _build_agent_async()
    return _agent


def get_agent():
    """Sync getter — only safe to call outside an async context (e.g. tests)."""
    global _agent
    if _agent is None:
        asyncio.run(_build_agent_async())
    return _agent


def get_checkpointer():
    global _checkpointer
    if _checkpointer is None:
        asyncio.run(_build_agent_async())
    return _checkpointer


def get_base_interrupt_on() -> dict:
    return BASE_INTERRUPT_ON
