# F5 — Streaming Everything

**Status:** `implemented`
**Feature ID:** F5
**Owner:** —

---

## Objective

All agent output streams token-by-token or step-by-step to the frontend in real time. The backend exposes an SSE endpoint; the frontend consumes it with a custom hook and routes each event to the correct chat block.

---

## Scope

- Backend: FastAPI SSE endpoint using `agent.astream()` with `stream_mode=["messages", "updates", "custom"]` and `version="v2"`
- Frontend: `useSSEStream` hook using `fetch()` + `ReadableStream` (NOT `EventSource` — it doesn't support POST)
- Streaming indicator dot in `StatusBar` is live during stream
- No polling — pure push via SSE

---

## Backend SSE Endpoint

```python
# POST /api/chat/stream
@router.post("/api/chat/stream")
async def stream_chat(body: StreamRequest):
    config = {"configurable": {"thread_id": body.session_id}}
    
    async def event_generator():
        try:
            async for chunk in agent.astream(
                {"messages": [{"role": "user", "content": body.message}]},
                config=config,
                stream_mode=["messages", "updates", "custom"],
                version="v2",
            ):
                sse_event = parse_chunk(chunk)
                if sse_event:
                    yield f"event: {sse_event['type']}\ndata: {json.dumps(sse_event['data'])}\n\n"
        except GraphInterrupt as e:
            yield f"event: permission_request\ndata: {json.dumps(build_permission_data(e))}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"
        finally:
            yield f"event: session_info\ndata: {json.dumps(get_token_usage(config))}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # required for nginx reverse proxy
        },
    )
```

### deepagents stream chunk shapes (version="v2"):

```python
# Messages mode — LLM token
{"type": "messages", "ns": (), "data": (AIMessageChunk, metadata)}

# Updates mode — node execution
{"type": "updates", "ns": ("tools:uuid",), "data": {"node_name": state_delta}}

# Custom mode — user-defined
{"type": "custom", "ns": (), "data": {...}}
```

### `parse_chunk()` mapping:

```python
def parse_chunk(chunk: dict) -> dict | None:
    t = chunk.get("type")
    data = chunk.get("data")
    ns = chunk.get("ns", ())

    if t == "messages":
        msg, meta = data
        content = msg.content if hasattr(msg, "content") else ""
        if not content:
            return None
        # Determine if final answer or thinking based on metadata
        node = meta.get("langgraph_node", "")
        event_type = "final_answer_chunk" if is_final_node(node) else "thinking_chunk"
        return {"type": event_type, "data": {"content": content, "done": False}}

    if t == "updates":
        for node_name, delta in data.items():
            if is_subagent_node(node_name):
                return {"type": "agent_selection", "data": {
                    "agent": extract_agent_name(node_name),
                    "reason": extract_reason(delta),
                }}
            if is_tool_call(delta):
                return {"type": "tool_call_start", "data": build_tool_call(delta)}
            if is_tool_result(delta):
                return {"type": "tool_call_result", "data": build_tool_result(delta)}
    return None
```

---

## Frontend — `useSSEStream` Hook

Uses `fetch()` + `response.body.getReader()`. Parses SSE lines manually.

```ts
// hooks/useSSEStream.ts
export function useSSEStream() {
  const { appendBlock, updateBlock, setStreaming } = useChatStore()

  const startStream = async (message: string, sessionId: string) => {
    setStreaming(true)
    const resp = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
    })

    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!   // keep incomplete line

      let eventType = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim()
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          dispatch(eventType, data)
        }
      }
    }
    setStreaming(false)
  }

  const dispatch = (type: string, data: any) => {
    switch (type) {
      case 'thinking_chunk':      handleThinkingChunk(data); break
      case 'agent_selection':     appendBlock('agent_selection', data); break
      case 'tool_call_start':     appendBlock('tool_call', { ...data, streaming: true }); break
      case 'tool_call_result':    updateBlock(data); break
      case 'permission_request':  appendBlock('permission', data); break
      case 'final_answer_chunk':  handleFinalChunk(data); break
      case 'error':               appendBlock('error', data); break
      case 'session_info':        updateSessionInfo(data); break
    }
  }

  return { startStream, resumeStream }
}
```

---

## Streaming Indicator

`StatusBar` reads `streaming: boolean` from Zustand store:
```tsx
<span class={`w-2 h-2 rounded-full ${streaming ? 'bg-cc-green animate-pulse' : 'bg-cc-muted'}`} />
```

---

## Files Created / Modified

- `backend/routes/chat.py` (SSE endpoint + parse_chunk)
- `frontend/hooks/useSSEStream.ts`
- `frontend/store/chatStore.ts` (setStreaming action)
- `frontend/components/layout/StatusBar.tsx` (streaming dot)

---

## Test Checklist

- [ ] `curl -N -X POST /api/chat/stream` emits SSE events in terminal
- [ ] Thinking text appears character by character in `ThinkingBlock`
- [ ] Tool call block appears immediately when tool starts, updates when result arrives
- [ ] `permission_request` event stops the stream and shows `PermissionBlock`
- [ ] `session_info` event updates token counter in top bar
- [ ] Streaming indicator dot pulses green during stream, goes grey when done
- [ ] No buffering delay — nginx `X-Accel-Buffering: no` header is set
- [ ] `resume` stream correctly continues rendering blocks after permission decision
