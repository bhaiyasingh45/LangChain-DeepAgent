"use client";
import { Block } from "@/store/chatStore";

export function UserMessageBlock({ block }: { block: Block }) {
  const ts = new Date(block.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex gap-3 px-4 py-3 group">
      <div className="w-6 h-6 rounded bg-cc-amber flex-shrink-0 flex items-center justify-center text-black text-xs font-bold mt-0.5">
        U
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-cc-amber text-xs font-semibold">You</span>
          <span className="text-cc-dim text-xs">{ts}</span>
        </div>
        <p className="text-cc-text text-sm whitespace-pre-wrap break-words">{block.payload?.content ?? ""}</p>
      </div>
    </div>
  );
}
