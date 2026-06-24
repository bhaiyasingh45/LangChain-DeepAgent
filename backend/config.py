import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AWS Bedrock (primary)
    aws_default_region: str = "us-east-1"
    bedrock_model_id: str = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"

    # Azure OpenAI (fallback)
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_deployment_name: str = "gpt-4o-mini"
    azure_openai_api_version: str = "2024-12-01-preview"

    # Anthropic direct (fallback)
    anthropic_api_key: str = ""

    # Tavily (web search)
    tavily_api_key: str = ""

    # Workspace
    workspace_dir: str = str(Path(__file__).parent.parent / "workspace")
    agents_md_path: str = str(Path(__file__).parent.parent / "AGENTS.md")
    skills_dir: str = str(Path(__file__).parent.parent / "skills")
    data_dir: str = str(Path(__file__).parent.parent / "data")

    # CORS — allow all localhost ports in dev
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
