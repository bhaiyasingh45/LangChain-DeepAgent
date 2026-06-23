"use client";
import { useChatStore } from "@/store/chatStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function PermissionsPanel() {
  const { showPermissionsPanel, setShowPermissionsPanel, permissions, setPermissions, sessionId } = useChatStore();

  if (!showPermissionsPanel) return null;

  const revoke = async (tool: string) => {
    await fetch(`${API_BASE}/api/chat/sessions/${sessionId}/permissions/${tool}`, {
      method: "DELETE",
    });
    setPermissions(permissions.filter((p) => p.tool !== tool));
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setShowPermissionsPanel(false); }}
    >
      <div className="bg-cc-elevated border border-cc-border rounded-lg w-96 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cc-border">
          <div>
            <h2 className="text-cc-text text-sm font-semibold">Session Permissions</h2>
            <p className="text-cc-dim text-xs mt-0.5">Always-allowed actions for this session</p>
          </div>
          <button
            onClick={() => setShowPermissionsPanel(false)}
            className="text-cc-dim hover:text-cc-text transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Permissions list */}
        <div className="px-4 py-3 min-h-[80px]">
          {permissions.length === 0 ? (
            <div className="text-cc-dim text-xs text-center py-4">
              No always-allowed permissions yet.<br />
              Use the &ldquo;Always allow&rdquo; checkbox when approving actions.
            </div>
          ) : (
            <div className="space-y-2">
              {permissions.map((p) => (
                <div
                  key={p.tool}
                  className="flex items-center justify-between px-3 py-2 bg-cc-surface rounded border border-cc-border"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span>{p.icon}</span>
                    <span className="text-cc-text">{p.label}</span>
                    <span className="text-cc-muted">({p.tool})</span>
                  </div>
                  <button
                    onClick={() => revoke(p.tool)}
                    className="text-cc-red text-xs hover:opacity-80 transition-opacity"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-cc-border flex justify-between items-center">
          <span className="text-cc-dim text-xs">
            Permissions reset on session clear.
          </span>
          <button
            onClick={() => setShowPermissionsPanel(false)}
            className="text-xs text-cc-text bg-cc-muted hover:bg-cc-border px-3 py-1 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
