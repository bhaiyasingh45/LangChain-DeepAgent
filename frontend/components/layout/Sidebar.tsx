"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/store/chatStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 220;

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface SidebarProps {
  onOpenFile: (path: string, name: string) => void;
  activeFilePath?: string | null;
}

interface FileTreeProps {
  nodes: FileNode[];
  depth?: number;
  onOpenFile: (path: string, name: string) => void;
  activeFilePath?: string | null;
}

function FileTree({ nodes, depth = 0, onOpenFile, activeFilePath }: FileTreeProps) {
  return (
    <div>
      {nodes.map((node) => (
        <FileNodeItem key={node.path} node={node} depth={depth} onOpenFile={onOpenFile} activeFilePath={activeFilePath} />
      ))}
    </div>
  );
}

interface FileNodeItemProps {
  node: FileNode;
  depth: number;
  onOpenFile: (path: string, name: string) => void;
  activeFilePath?: string | null;
}

function FileNodeItem({ node, depth, onOpenFile, activeFilePath }: FileNodeItemProps) {
  const [open, setOpen] = useState(false);
  const isDir = node.type === "directory";
  const isActive = !isDir && node.path === activeFilePath;
  const icon = isDir ? (open ? "📂" : "📁") : getFileIcon(node.name);

  return (
    <div>
      <button
        onClick={() => isDir ? setOpen(!open) : onOpenFile(node.path, node.name)}
        className={`flex items-center gap-1.5 w-full text-left py-0.5 rounded text-xs transition-colors group
          ${isActive ? "bg-cc-elevated text-cc-amber" : "text-cc-text hover:bg-cc-elevated hover:text-cc-amber"}`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
      >
        {isDir && (
          <span className="text-cc-dim text-[9px] w-2 flex-shrink-0">
            {open ? "▼" : "▶"}
          </span>
        )}
        {!isDir && <span className="w-2 flex-shrink-0" />}
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && open && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} onOpenFile={onOpenFile} activeFilePath={activeFilePath} />
      )}
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    ts: "🟦", tsx: "🟦", js: "🟨", jsx: "🟨",
    py: "🐍", md: "📄", json: "📋", css: "🎨",
    html: "🌐", env: "🔑", gitignore: "🚫", toml: "⚙",
    txt: "📝", ipynb: "📓", yaml: "⚙", yml: "⚙",
  };
  return icons[ext] ?? "📄";
}

export function Sidebar({ onOpenFile, activeFilePath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [tree, setTree] = useState<FileNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);
  const streaming = useChatStore((s) => s.streaming);
  const prevStreaming = useRef(false);

  const fetchTree = useCallback(() => {
    setRefreshing(true);
    fetch(`${API_BASE}/api/files?path=.`)
      .then((r) => r.json())
      .then((d) => setTree(d.tree))
      .catch(() => null)
      .finally(() => setRefreshing(false));
  }, []);

  // Initial load
  useEffect(() => { fetchTree(); }, [fetchTree]);

  // Auto-refresh when agent finishes streaming (streaming: true → false)
  useEffect(() => {
    if (prevStreaming.current && !streaming) {
      fetchTree();
    }
    prevStreaming.current = streaming;
  }, [streaming, fetchTree]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  if (collapsed) {
    return (
      <div className="w-8 bg-cc-surface border-r border-cc-border flex flex-col items-center pt-2 flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="text-cc-dim hover:text-cc-amber text-xs transition-colors"
          title="Expand sidebar"
        >▶</button>
      </div>
    );
  }

  return (
    <div
      className="bg-cc-surface border-r border-cc-border flex flex-col flex-shrink-0 overflow-hidden relative"
      style={{ width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-cc-border flex-shrink-0">
        <span className="text-cc-dim text-xs font-semibold uppercase tracking-wider">Explorer</span>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTree}
            disabled={refreshing}
            className="text-cc-dim hover:text-cc-amber text-xs transition-colors disabled:opacity-40"
            title="Refresh file tree"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={refreshing ? "animate-spin" : ""}>
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-cc-dim hover:text-cc-amber text-xs transition-colors"
            title="Collapse sidebar"
          >◀</button>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {tree ? (
          <FileTree
            nodes={tree.children ?? []}
            depth={0}
            onOpenFile={onOpenFile}
            activeFilePath={activeFilePath}
          />
        ) : (
          <div className="px-3 py-2 text-cc-dim text-xs">Loading...</div>
        )}
      </div>

      {/* Bottom info */}
      <div className="border-t border-cc-border px-3 py-2 text-[10px] text-cc-muted">
        <div>LangChain-DeepAgent</div>
        <div>4 agents · 7 features</div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cc-amber/40 transition-colors z-10"
      />
    </div>
  );
}
