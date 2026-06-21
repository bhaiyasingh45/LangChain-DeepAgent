# 🤖 LangChain Deep Agents — Study Notes & Reference

> A comprehensive reference and personal study guide for **LangChain Deep Agents** — the easiest way to build LLM-powered agents with built-in planning, file systems, subagent orchestration, and long-term memory.

---

## 📌 Table of Contents

1. [What is Deep Agents?](#-what-is-deep-agents)
2. [Architecture Overview](#-architecture-overview)
3. [Quickstart](#-quickstart)
4. [Customization](#-customization)
5. [Core Capabilities](#-core-capabilities)
   - [1. Models](#1-models)
   - [2. Tools](#2-tools)
   - [3. Context Engineering](#3-context-engineering)
   - [4. Backends](#4-backends)
   - [5. Subagents](#5-subagents)
   - [6. Async Subagents](#6-async-subagents)
   - [7. Human-in-the-Loop](#7-human-in-the-loop)
   - [8. Permissions](#8-permissions)
   - [9. Memory](#9-memory)
   - [10. Skills](#10-skills)
   - [11. Sandboxes](#11-sandboxes)
   - [12. Interpreters (Beta)](#12-interpreters-beta)
   - [13. Profiles (Beta)](#13-profiles-beta)
   - [14. Event Streaming (Beta)](#14-event-streaming-beta)
   - [15. Streaming](#15-streaming)
   - [16. Grading Rubrics (Beta)](#16-grading-rubrics-beta)
6. [Deployment](#-deployment)
7. [Frontend](#-frontend)
8. [Protocols](#-protocols)
9. [Deep Agents Code](#-deep-agents-code)
10. [Comparison: Deep Agents vs Claude Agent SDK](#-comparison-deep-agents-vs-claude-agent-sdk)
11. [Resources & References](#-resources--references)

---

## 🧠 What is Deep Agents?

**Deep Agents** is LangChain's opinionated, production-ready framework for building LLM-powered agents that can handle complex, multi-step tasks. The `deepagents` package is a standalone Python library built on top of [LangChain](https://docs.langchain.com/oss/python/langchain/) and uses the [LangGraph](https://docs.langchain.com/oss/python/langgraph/) runtime for durable execution, streaming, human-in-the-loop, and more.

### Why Deep Agents?

Deep Agents is an **"agent harness"** — it uses the same core tool-calling loop as other agent frameworks but ships with production-ready capabilities built-in, making agents reliable for real-world tasks:

| Capability | Description |
|---|---|
| 🔧 **Take actions in an environment** | Use tools, read/write files, execute code |
| 🗄️ **Connect to your data** | Load memories, skills, and domain knowledge at the right moment |
| ✂️ **Manage growing context** | Summarize history and offload large results across long runs |
| 🌐 **Parallelize tasks** | Delegate to general or specialized subagents in isolated context windows |
| 👤 **Stay in the loop** | Pause for human approval at critical decision points |
| 🚀 **Improve over time** | Update memory, skills, and prompts based on real usage |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Deep Agent                        │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │   Model    │  │   Tools    │  │    Backend    │  │
│  │ (Provider) │  │(User / MCP)│  │ (Filesystem)  │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │   Memory   │  │   Skills   │  │   Subagents   │  │
│  └────────────┘  └────────────┘  └───────────────┘  │
│  ┌─────────────────────────────────────────────────┐ │
│  │         LangGraph Runtime (Durable Execution)   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

| Layer | Role |
|---|---|
| **`deepagents`** | Standalone Python library (PyPI: `deepagents`) |
| **LangChain** | Core building blocks — chat models, tools, middleware |
| **LangGraph** | Runtime: durable execution, streaming, HITL, checkpointing |
| **LangSmith** | Observability: tracing, debugging, evaluation, deployment |

---

## 🚀 Quickstart

### Step 1: Install

```bash
# Pick your model provider
pip install -qU deepagents langchain-anthropic      # Anthropic
pip install -qU deepagents langchain-openai         # OpenAI
pip install -qU deepagents langchain-google-genai   # Google

# Optional: for a search tool example
pip install tavily-python
```

### Step 2: Set API Keys

```bash
export ANTHROPIC_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
export GOOGLE_API_KEY="your-api-key"
export TAVILY_API_KEY="your-tavily-api-key"   # if using Tavily search
```

### Step 3: Create and Run a Deep Agent

```python
from deepagents import create_deep_agent

# Define a tool — a plain Python function with a docstring
def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return f"It's always sunny in {city}!"

# Create the agent
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",   # provider:model format
    tools=[get_weather],
    system_prompt="You are a helpful assistant.",
)

# Run the agent
result = agent.invoke(
    {"messages": [{"role": "user", "content": "What is the weather in SF?"}]}
)
print(result["messages"][-1].content)
```

### How the Agent Works (Internally)

When `agent.invoke()` is called, the deep agent automatically:

1. **Plans its approach** — uses the built-in `write_todos` tool to break the task into discrete steps
2. **Conducts research / takes actions** — calls your tools (e.g., `get_weather`, `internet_search`)
3. **Manages context** — writes large results to the virtual filesystem using `write_file` / `read_file` to prevent context overflow
4. **Spawns subagents** (if needed) — delegates complex subtasks to specialized subagents
5. **Synthesizes a response** — compiles all findings into a final answer

---

## ⚙️ Customization

`create_deep_agent()` is the single entry point for building a deep agent. You compose the agent by passing in parameters:

```python
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",    # model string or initialized instance
    system_prompt="You are an expert...",   # custom instructions
    tools=[search, fetch_url],              # domain tools the agent can call
    memory=["./AGENTS.md"],                 # files loaded into memory at startup
    skills=["./skills/"],                   # directory of on-demand skill files
    backend=...,                            # pluggable filesystem backend
    permissions=[...],                      # path-level read/write access rules
    subagents=[...],                        # custom specialized subagents
    middleware=[...],                       # extra middleware added to default stack
    interrupt_on={"execute": True},         # pause before tool calls for human approval
    response_format=MySchema,               # structured output (Pydantic schema)
    state_schema=...,                       # custom LangGraph state schema
)
```

### Full Parameter Reference

| Parameter | Type | Description |
|---|---|---|
| `model` | `str \| BaseChatModel` | LLM to use in `"provider:model"` format |
| `system_prompt` | `str \| SystemMessage` | Custom instructions prepended to all runs |
| `tools` | `list` | Python functions, `BaseTool` instances, or dicts |
| `memory` | `list[str]` | AGENTS.md file paths loaded at agent startup |
| `skills` | `list[str]` | Path(s) to skill directories for on-demand knowledge |
| `backend` | `BackendProtocol` | Filesystem backend (default: `StateBackend`) |
| `permissions` | `list[FilesystemPermission]` | Path-level read/write access control rules |
| `subagents` | `list[SubAgent]` | Specialized subagents for task delegation |
| `middleware` | `list[AgentMiddleware]` | Extra middleware for the agent loop |
| `interrupt_on` | `dict` | Tool names that trigger a human-approval pause |
| `response_format` | `type \| dict` | Structured output schema |
| `state_schema` | `type[DeepAgentState]` | Custom graph state |
| `checkpointer` | `Checkpointer` | LangGraph checkpointer for persistence |
| `store` | `BaseStore` | LangGraph store for cross-thread memory |
| `debug` | `bool` | Enable debug logging |
| `name` | `str` | Optional agent name |

---

## 🧩 Core Capabilities

### 1. Models

Deep Agents works with **any LangChain-compatible chat model that supports tool calling**.

**Model string format:** `"provider:model_name"`

| Provider | Install | Model String Example |
|---|---|---|
| Anthropic | `pip install langchain-anthropic` | `"anthropic:claude-sonnet-4-6"` |
| OpenAI | `pip install langchain-openai` | `"openai:gpt-5.4"` |
| Google | `pip install langchain-google-genai` | `"google_genai:gemini-3.5-flash"` |
| Azure OpenAI | `pip install langchain-openai` | `"azure_openai:gpt-5.5"` |
| OpenRouter | `pip install langchain-openrouter` | `"openrouter:anthropic/claude-sonnet-4-6"` |
| Fireworks | `pip install langchain-fireworks` | `"fireworks:accounts/fireworks/models/..."` |
| Baseten | `pip install langchain-baseten` | `"baseten:zai-org/GLM-5"` |
| Ollama | `pip install langchain-ollama` | `"ollama:devstral-2"` |

You can also pass an initialized model instance directly:

```python
from langchain_anthropic import ChatAnthropic
from deepagents import create_deep_agent

model = ChatAnthropic(model="claude-sonnet-4-6", temperature=0)
agent = create_deep_agent(model=model)
```

📖 [Models Docs](https://docs.langchain.com/oss/python/deepagents/models)

---

### 2. Tools

Tools are the primary way agents interact with the world. They can be:

- **Plain Python functions** — with a docstring that serves as the tool description
- **LangChain `BaseTool` instances** — for more advanced tool configuration
- **MCP tools** — external tools exposed via the Model Context Protocol

```python
import os
from typing import Literal
from tavily import TavilyClient

tavily_client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
) -> dict:
    """Run a web search and return results."""
    return tavily_client.search(
        query,
        max_results=max_results,
        include_raw_content=include_raw_content,
        topic=topic,
    )

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    tools=[internet_search],
)
```

📖 [Tools Docs](https://docs.langchain.com/oss/python/deepagents/tools)

---

### 3. Context Engineering

Managing the LLM context window is one of the hardest problems in production agents. Deep Agents handles this with built-in mechanisms:

| Mechanism | What it does |
|---|---|
| **Context compression** | Offloads large tool results to the virtual filesystem automatically |
| **Summarization** | Summarizes older messages to keep context within model limits |
| **Prompt caching** | Reduces token cost and latency for repeated content |
| **Virtual filesystem** | A sandboxed file system agents use to `write_file` / `read_file` intermediate results |

The **virtual filesystem** is especially important: instead of keeping a 50,000-token search result in the conversation, the agent writes it to a file and references it later — keeping the context clean.

📖 [Context Engineering Docs](https://docs.langchain.com/oss/python/deepagents/context-engineering)

---

### 4. Backends

The **backend** determines where the virtual filesystem stores and retrieves data. It is pluggable.

| Backend | When to use |
|---|---|
| `StateBackend` | Default. In-memory state, no persistence |
| `LocalShellBackend` | Local disk + shell execution (`execute` tool); for local development |
| `LangGraphStoreBackend` | Persisted via LangGraph store |
| `CompositeBackend` | Route different paths to different backends |
| Custom backend | Implement `BackendProtocol` |

Shell-capable backends expose an `execute` tool that lets the agent run system commands, git operations, tests, and builds.

```python
from deepagents.backends import LocalShellBackend
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    backend=LocalShellBackend(base_dir="./workspace"),
)
```

📖 [Backends Docs](https://docs.langchain.com/oss/python/deepagents/backends)

---

### 5. Subagents

A deep agent can **spawn subagents** to delegate work. This is a key pattern for handling complex tasks.

**Why subagents?**
- **Context isolation** — each subagent runs in its own isolated context window ("context quarantine")
- **Specialization** — different tools, system prompts, or models per subagent
- **Parallelization** — multiple subagents working simultaneously on different subtasks

The built-in `task` tool allows the main orchestrator agent to spawn subagents dynamically.

```python
from deepagents import create_deep_agent, SubAgent

# Define a specialized subagent
researcher = SubAgent(
    name="researcher",
    model="anthropic:claude-sonnet-4-6",
    tools=[internet_search],
    system_prompt="You are an expert researcher. Search thoroughly before concluding.",
)

# Pass it to the main agent
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    subagents=[researcher],
)
```

📖 [Subagents Docs](https://docs.langchain.com/oss/python/deepagents/subagents)

---

### 6. Async Subagents

For **long-running or parallel subtasks**, async subagents run in the **background**. The main agent can:
- Periodically check on their progress
- Send follow-up instructions mid-task
- Cancel them if needed

This is useful for tasks like long scraping jobs, multi-step data pipelines, or anything that would block a synchronous subagent.

📖 [Async Subagents Docs](https://docs.langchain.com/oss/python/deepagents/async-subagents)

---

### 7. Human-in-the-Loop (HITL)

Deep Agents can **pause execution and wait for human approval** before performing sensitive operations. This is powered by LangGraph's `interrupt` mechanism.

```python
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    interrupt_on={
        "execute": True,       # Pause before any shell execution
        "write_file": True,    # Pause before any file write
    },
)
```

When an interrupt is triggered, the agent pauses and waits. A human can then approve, modify, or reject the action before execution resumes.

📖 [Human-in-the-Loop Docs](https://docs.langchain.com/oss/python/deepagents/human-in-the-loop)

---

### 8. Permissions

**Filesystem permissions** control what paths and directories the agent (and its subagents) are allowed to read or write. This prevents unintended file access.

```python
from deepagents.permissions import FilesystemPermission

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    permissions=[
        FilesystemPermission(path="./workspace", read=True, write=True),
        FilesystemPermission(path="./secrets", read=False, write=False),
        FilesystemPermission(path="./output", read=True, write=True),
    ],
)
```

Subagents can **inherit** the parent agent's permission rules or have their own rules declared explicitly.

📖 [Permissions Docs](https://docs.langchain.com/oss/python/deepagents/permissions)

---

### 9. Memory

Deep Agents supports **long-term memory** across sessions and threads using LangGraph's Memory Store.

**Two forms of memory:**

1. **AGENTS.md files** — preloaded at startup via the `memory=` parameter (static knowledge, instructions, background context)
2. **Dynamic memory** — the agent can update its memory based on real usage, so it improves over time

```python
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    memory=["./AGENTS.md"],   # Load context file(s) at startup
    store=my_langraph_store,  # For cross-session persistent memory
)
```

📖 [Memory Docs](https://docs.langchain.com/oss/python/deepagents/memory)

---

### 10. Skills

**Skills** are reusable, on-demand knowledge modules that extend agent capabilities with specialized workflows, domain expertise, and custom instructions. They are loaded when relevant, not all at once.

```python
agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-6",
    skills=["./skills/"],   # Directory containing skill definition files
)
```

Skills allow you to add domain expertise (e.g., "how to write a SEC filing") to an agent without bloating the system prompt.

📖 [Skills Docs](https://docs.langchain.com/oss/python/deepagents/skills)

---

### 11. Sandboxes

**Sandboxes** are isolated execution environments for running code without risk to the host system. Use them when:
- Agents need to run untrusted or user-provided code
- You need consistent, reproducible execution environments
- You want to separate agent execution from your production infrastructure

Use `LocalShellBackend` for local development and a remote sandbox backend for production isolation.

📖 [Sandboxes Docs](https://docs.langchain.com/oss/python/deepagents/sandboxes)

---

### 12. Interpreters (Beta)

**Interpreters** run JavaScript in an in-memory **QuickJS** runtime. They enable agents to:
- Compose tools programmatically without a full shell
- Orchestrate subagents dynamically at runtime
- Transform and process structured data efficiently

This is lighter than a full sandbox and useful for tasks that need programmatic logic without system-level access.

📖 [Interpreters Docs](https://docs.langchain.com/oss/python/deepagents/interpreters)  
📖 [Programmatic Subagents](https://docs.langchain.com/oss/python/deepagents/programmatic-subagents)

---

### 13. Profiles (Beta)

**Profiles** are per-model configuration bundles. They let you define model-specific defaults (e.g., parameters, prompt adjustments) once and apply them consistently across agents.

📖 [Profiles Docs](https://docs.langchain.com/oss/python/deepagents/profiles)

---

### 14. Event Streaming (Beta)

**Event streaming** provides fine-grained, event-level visibility into agent execution in real time. Unlike regular streaming (which streams token-by-token output), event streaming gives you structured events for each action the agent takes.

📖 [Event Streaming Docs](https://docs.langchain.com/oss/python/deepagents/event-streaming)

---

### 15. Streaming

Deep Agents has built-in **streaming** powered by LangGraph. You can observe agent output progressively — including tool calls, tool results, and LLM responses — without waiting for the full run to complete.

```python
# Stream output token by token / event by event
for chunk in agent.stream(
    {"messages": [{"role": "user", "content": "Research LangGraph for me"}]}
):
    print(chunk)
```

This is essential for production UIs that show real-time agent progress.

📖 [Streaming Docs](https://docs.langchain.com/oss/python/deepagents/streaming)

---

### 16. Grading Rubrics (Beta)

**Grading rubrics** provide a structured way to evaluate agent outputs automatically. You define criteria, and the agent's output is scored against them — useful for benchmarking and regression testing.

📖 [Grading Rubrics Docs](https://docs.langchain.com/oss/python/deepagents/rubric)

---

## 🚢 Deployment

### Going to Production

LangSmith is the recommended platform for deploying and monitoring Deep Agents in production.

- ✅ Trace every agent run end-to-end
- ✅ Debug tool calls and LLM decisions
- ✅ Evaluate output quality with rubrics
- ✅ Monitor for regressions and failures

```bash
# Set LangSmith env vars
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY="your-langsmith-api-key"
export LANGCHAIN_PROJECT="my-deep-agent"
```

📖 [Going to Production](https://docs.langchain.com/oss/python/deepagents/going-to-production)  
📖 [Managed Deep Agents (Beta)](https://docs.langchain.com/langsmith/managed-deep-agents-overview)

---

## 🖥️ Frontend

Deep Agents includes documentation on integrating agents with frontend applications — enabling full-stack agent-powered products.

📖 [Frontend Overview](https://docs.langchain.com/oss/python/deepagents/frontend/overview)

---

## 🔌 Protocols

### Agent Client Protocol (ACP)

**ACP (Agent Client Protocol)** is a standard protocol for connecting to deep agents from external clients such as code editors, IDEs, and other developer tools. It defines how clients and agents communicate.

📖 [ACP Docs](https://docs.langchain.com/oss/python/deepagents/acp)

---

### MCP with LangChain

**MCP (Model Context Protocol)** is an open protocol for exposing tools and data sources to LLMs. LangChain provides native support for connecting MCP servers as tool providers for your agents.

📖 [MCP with LangChain](https://docs.langchain.com/oss/python/langchain/mcp)

---

### A2A with LangSmith

**A2A (Agent-to-Agent)** communication allows deep agents to interact with each other through LangSmith's infrastructure — enabling multi-agent systems at scale.

📖 [A2A with LangSmith](https://docs.langchain.com/langsmith/server-a2a)

---

## 💻 Deep Agents Code

**Deep Agents Code** is a specialized variant of Deep Agents focused on coding workflows. It extends the base agent with code-specific tools, remote sandboxes, and programmatic subagents.

| Section | Description | Link |
|---|---|---|
| Overview | Introduction to Deep Agents Code | [Docs](https://docs.langchain.com/oss/python/deepagents/code/overview) |
| Memory and Skills | Memory/skills patterns for Code mode | [Docs](https://docs.langchain.com/oss/python/deepagents/code/memory-and-skills) |
| Remote Sandboxes | Execute code in remote isolated environments | [Docs](https://docs.langchain.com/oss/python/deepagents/code/remote-sandboxes) |
| Subagents | Subagent patterns specific to Code mode | [Docs](https://docs.langchain.com/oss/python/deepagents/code/subagents) |
| Model Providers | Supported model providers in Code mode | [Docs](https://docs.langchain.com/oss/python/deepagents/code/providers) |
| Configuration | Configuration options for Code mode | [Docs](https://docs.langchain.com/oss/python/deepagents/code/configuration) |
| MCP Tools | Using MCP tools in Code mode | [Docs](https://docs.langchain.com/oss/python/deepagents/code/mcp-tools) |
| App Data | Data storage locations and management | [Docs](https://docs.langchain.com/oss/python/deepagents/code/data-locations) |

---

## ⚖️ Comparison: Deep Agents vs Claude Agent SDK

LangChain provides a side-by-side comparison of Deep Agents with Anthropic's Claude Agent SDK, covering differences in design philosophy, capabilities, and use cases.

📖 [Comparison Docs](https://docs.langchain.com/oss/python/deepagents/comparison)

---

## 📚 Resources & References

| Resource | Link |
|---|---|
| 📖 Deep Agents Docs (Overview) | https://docs.langchain.com/oss/python/deepagents/overview |
| 🐍 PyPI Package (`deepagents`) | https://pypi.org/project/deepagents/ |
| 💻 GitHub Examples | https://github.com/langchain-ai/deepagents/tree/main/examples |
| 🔍 API Reference | https://reference.langchain.com/python/deepagents/ |
| 📊 LangSmith | https://smith.langchain.com/ |
| 📘 LangChain Docs | https://docs.langchain.com/oss/python/langchain/ |
| 📗 LangGraph Docs | https://docs.langchain.com/oss/python/langgraph/ |
| 🎓 LangChain Academy | https://academy.langchain.com/ |
| 💬 LangChain Forum | https://forum.langchain.com/ |

---

> 🗒️ **Note:** This repository is a personal study guide and learning log for [LangChain Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview). Content is progressively added as I work through each section of the documentation. Notes, code examples, and key takeaways will be added to each section over time.
