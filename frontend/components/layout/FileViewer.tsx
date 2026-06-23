"use client";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  path: string;
  name: string;
  onClose: () => void;
}

function getLanguage(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", md: "markdown", json: "json", css: "css",
    html: "html", toml: "toml", yaml: "yaml", yml: "yaml",
    sh: "bash", txt: "text", env: "bash",
  };
  return map[ext] ?? "text";
}

export function FileViewer({ path, name, onClose }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setContent(null);
    setError("");
    fetch(`${API_BASE}/api/files/content?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setContent(d.content ?? "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-cc-elevated border border-cc-border rounded-lg flex flex-col shadow-2xl"
        style={{ width: "min(860px, 92vw)", height: "min(600px, 88vh)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-cc-border flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-cc-dim">📄</span>
            <span className="text-cc-amber font-semibold">{name}</span>
            <span className="text-cc-muted truncate max-w-xs">{path}</span>
          </div>
          <button
            onClick={onClose}
            className="text-cc-dim hover:text-cc-text text-lg leading-none px-1 transition-colors"
          >×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full text-cc-dim text-xs">
              Loading...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-cc-red text-xs">
              {error}
            </div>
          )}
          {!loading && !error && content !== null && (
            <pre className="text-cc-text text-xs leading-relaxed p-4 m-0 font-mono whitespace-pre overflow-x-auto h-full">
              {/* Line numbers + content */}
              {content.split("\n").map((line, i) => (
                <div key={i} className="flex gap-4 hover:bg-cc-surface/50">
                  <span className="text-cc-muted select-none w-8 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1">{line}</span>
                </div>
              ))}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-1.5 border-t border-cc-border flex items-center gap-4 text-[10px] text-cc-muted flex-shrink-0">
          <span>{getLanguage(name)}</span>
          {content !== null && (
            <>
              <span>{content.split("\n").length} lines</span>
              <span>{content.length.toLocaleString()} chars</span>
            </>
          )}
          <span className="ml-auto">ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
}
