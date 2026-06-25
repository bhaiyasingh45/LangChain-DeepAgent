"use client";
import { Block } from "@/store/chatStore";

export function UserMessageBlock({ block }: { block: Block }) {
  const ts = new Date(block.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex justify-end px-4 py-2.5 group">
      <div className="flex flex-col items-end gap-1 max-w-[80%]">
        {/* Meta row */}
        <div className="flex items-baseline gap-2 pr-1">
          <span className="text-cc-dim text-[11px]">{ts}</span>
          <span className="text-cc-amber text-xs font-semibold">You</span>
        </div>

        {/* Bubble */}
        <div
          className="relative rounded-2xl rounded-tr-sm px-3.5 py-2.5 border border-cc-amber/20"
          style={{ background: "rgba(212,168,83,0.07)" }}
        >
          {/* Left accent stripe */}
          <span
            className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
            style={{ background: "rgba(212,168,83,0.45)" }}
          />
          <p className="text-cc-text text-sm whitespace-pre-wrap break-words leading-relaxed pl-1">
            {block.payload?.content ?? ""}
          </p>
        </div>
      </div>
    </div>
  );
}
