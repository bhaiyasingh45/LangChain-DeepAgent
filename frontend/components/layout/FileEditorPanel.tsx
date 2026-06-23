"use client";
import { useEffect, useState, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const MIN_WIDTH = 200;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 480;

interface OpenFile {
  path: string;
  name: string;
}

interface Props {
  openFile: OpenFile | null;
  onClose: () => void;
}

function getLanguage(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", md: "markdown", json: "json", css: "css",
    html: "html", toml: "toml", yaml: "yaml", yml: "yaml",
    sh: "shell", bash: "shell", txt: "text", env: "env",
    gitignore: "gitignore", lock: "text",
  };
  return map[ext] ?? "text";
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    ts: "🟦", tsx: "🟦", js: "🟨", jsx: "🟨",
    py: "🐍", md: "📄", json: "📋", css: "🎨",
    html: "🌐", env: "🔑", toml: "⚙", yaml: "⚙", yml: "⚙",
    sh: "💻", txt: "📝",
  };
  return icons[ext] ?? "📄";
}

// Minimal token-level coloring — no external deps
function colorizeToken(token: string, lang: string): string {
  if (lang === "markdown") return "text-cc-text";
  const keywords = ["import", "export", "from", "const", "let", "var", "function",
    "return", "if", "else", "for", "while", "class", "interface", "type",
    "async", "await", "default", "new", "null", "undefined", "true", "false",
    "def", "class", "import", "from", "return", "if", "elif", "else", "for",
    "while", "with", "as", "pass", "raise", "try", "except", "finally",
    "and", "or", "not", "in", "is", "None", "True", "False"];
  if (keywords.includes(token)) return "text-purple-400";
  if (/^["'`]/.test(token)) return "text-cc-green";
  if (/^\d/.test(token)) return "text-yellow-300";
  if (/^\/\/|^#/.test(token)) return "text-cc-dim italic";
  return "text-cc-text";
}

function renderLine(line: string, lang: string) {
  // Comment lines
  if (/^\s*(\/\/|#|--|\/\*)/.test(line)) {
    return <span className="text-cc-dim italic">{line}</span>;
  }
  // String detection (simple)
  if (/["'`]/.test(line)) {
    const parts = line.split(/("[^"]*"|'[^']*'|`[^`]*`)/g);
    return (
      <>
        {parts.map((p, i) =>
          i % 2 === 1
            ? <span key={i} className="text-cc-green">{p}</span>
            : <span key={i}>{p}</span>
        )}
      </>
    );
  }
  return <>{line}</>;
}

export function FileEditorPanel({ openFile, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  // Fetch file content when openFile changes
  useEffect(() => {
    if (!openFile) return;
    setLoading(true);
    setContent(null);
    setError("");
    fetch(`${API_BASE}/api/files/content?path=${encodeURIComponent(openFile.path)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setContent(d.content ?? "");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [openFile?.path]);

  // Right-edge drag to resize
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!openFile) return null;

  const lang = getLanguage(openFile.name);
  const lines = content?.split("\n") ?? [];

  return (
    <div
      className="flex flex-col bg-cc-bg border-r border-cc-border flex-shrink-0 relative"
      style={{ width }}
    >
      {/* VS Code-style tab bar */}
      <div className="flex items-stretch bg-cc-surface border-b border-cc-border flex-shrink-0 h-9 overflow-x-auto">
        <div className="flex items-center gap-1.5 px-3 border-b-2 border-cc-amber bg-cc-bg min-w-0">
          <span className="text-sm flex-shrink-0">{getFileIcon(openFile.name)}</span>
          <span className="text-cc-text text-xs font-medium truncate max-w-[160px]">
            {openFile.name}
          </span>
          <button
            onClick={onClose}
            className="text-cc-dim hover:text-cc-text flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-cc-elevated transition-colors text-sm leading-none ml-1"
          >×</button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-3 py-1 bg-cc-surface border-b border-cc-border text-[10px] text-cc-muted flex-shrink-0 truncate">
        {openFile.path}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {loading && (
          <div className="flex items-center justify-center h-32 text-cc-dim text-xs">
            Loading…
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-32 text-cc-red text-xs px-4 text-center">
            {error}
          </div>
        )}
        {!loading && !error && content !== null && (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-cc-surface/40 group">
                  {/* Line number */}
                  <td className="select-none text-right text-cc-muted px-3 py-0 w-10 min-w-[2.5rem] align-top border-r border-cc-border/30 sticky left-0 bg-cc-bg group-hover:bg-cc-surface/40">
                    {i + 1}
                  </td>
                  {/* Code content */}
                  <td className="pl-4 pr-4 py-0 whitespace-pre align-top text-cc-text">
                    {renderLine(line, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom status bar — VS Code style */}
      <div className="flex items-center gap-4 px-3 py-1 bg-cc-surface border-t border-cc-border text-[10px] text-cc-muted flex-shrink-0">
        <span className="text-cc-amber">{lang}</span>
        {content !== null && (
          <>
            <span>{lines.length} lines</span>
            <span>{content.length.toLocaleString()} chars</span>
          </>
        )}
        <span className="ml-auto">UTF-8</span>
      </div>

      {/* Right-edge resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cc-amber/40 z-10"
      />
    </div>
  );
}
