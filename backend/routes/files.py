import os
from pathlib import Path
from fastapi import APIRouter, Query
from ..config import settings

router = APIRouter(prefix="/api/files", tags=["files"])

IGNORED = {".git", ".venv", "__pycache__", "node_modules", ".next", "dist", "build", ".DS_Store"}


def build_tree(path: Path, depth: int = 0, max_depth: int = 4) -> dict:
    if depth > max_depth or path.name in IGNORED:
        return {}
    node = {
        "name": path.name,
        "path": str(path),
        "type": "directory" if path.is_dir() else "file",
        "children": [],
    }
    if path.is_dir():
        try:
            children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
            for child in children:
                if child.name not in IGNORED:
                    child_node = build_tree(child, depth + 1, max_depth)
                    if child_node:
                        node["children"].append(child_node)
        except PermissionError:
            pass
    return node


@router.get("")
async def get_file_tree(path: str = Query(default=".")):
    # Resolve relative to repo root, not workspace
    repo_root = Path(__file__).parent.parent.parent
    target = (repo_root / path).resolve()

    # Security: must stay within repo root
    try:
        target.relative_to(repo_root)
    except ValueError:
        return {"error": "Path outside repo root", "tree": {}}

    if not target.exists():
        return {"error": "Path does not exist", "tree": {}}

    return {"tree": build_tree(target)}


@router.get("/content")
async def get_file_content(path: str = Query(...)):
    repo_root = Path(__file__).parent.parent.parent
    target = (repo_root / path).resolve()
    try:
        target.relative_to(repo_root)
    except ValueError:
        return {"error": "Path outside repo root"}

    if not target.is_file():
        return {"error": "Not a file"}

    try:
        content = target.read_text(encoding="utf-8", errors="replace")
        return {"path": str(target), "content": content[:50000], "truncated": len(content) > 50000}
    except Exception as e:
        return {"error": str(e)}
