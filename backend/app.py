from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes.chat import router as chat_router
from .routes.sessions import router as sessions_router
from .routes.files import router as files_router
from .routes.voice import router as voice_router

app = FastAPI(
    title="ClaudeCode DeepAgent API",
    description="LangChain deepagents backend with multi-agent routing, HITL, and SSE streaming",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev — tighten to settings.allowed_origins in prod
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(sessions_router)
app.include_router(files_router)
app.include_router(voice_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": settings.bedrock_model_id,
        "region": settings.aws_default_region,
    }
