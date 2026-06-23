"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { FileEditorPanel } from "@/components/layout/FileEditorPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InputBar } from "@/components/chat/InputBar";
import { PermissionsPanel } from "@/components/permissions/PermissionsPanel";

const CHAT_MIN = 300;
const CHAT_MAX = 800;
const CHAT_DEFAULT = 420;

export default function Home() {
  const [openFile, setOpenFile] = useState<{ path: string; name: string } | null>(null);
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(CHAT_DEFAULT);

  // Escape closes the file editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFile(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Drag the left edge of the chat panel to resize it
  const onChatDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = chatWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [chatWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - e.clientX; // drag left = wider chat
      setChatWidth(Math.min(CHAT_MAX, Math.max(CHAT_MIN, startWidth.current + delta)));
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

  return (
    <div className="h-screen flex flex-col bg-cc-bg overflow-hidden">
      <TopBar />

      {/* Main row: Sidebar | FileEditor | Chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: file tree explorer */}
        <Sidebar
          onOpenFile={(path, name) => setOpenFile({ path, name })}
          activeFilePath={openFile?.path ?? null}
        />

        {/* Middle: VS Code-style file editor — only when a file is open */}
        <FileEditorPanel
          openFile={openFile}
          onClose={() => setOpenFile(null)}
        />

        {/* Right: chat panel */}
        <div
          className="flex flex-col overflow-hidden flex-shrink-0 relative border-l border-cc-border"
          style={openFile ? { width: chatWidth } : { flex: 1 }}
        >
          {/* Left drag handle — resize chat width when file editor is visible */}
          {openFile && (
            <div
              onMouseDown={onChatDragStart}
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-cc-amber/40 z-10"
              title="Drag to resize chat"
            />
          )}
          <ChatWindow />
          <InputBar />
        </div>
      </div>

      <StatusBar />
      <PermissionsPanel />
    </div>
  );
}
