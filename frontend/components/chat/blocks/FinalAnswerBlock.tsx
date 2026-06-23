"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Block } from "@/store/chatStore";

export function FinalAnswerBlock({ block }: { block: Block }) {
  const content = block.payload?.content ?? "";

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-6 h-6 rounded bg-cc-surface border border-cc-border flex-shrink-0 flex items-center justify-center text-cc-amber text-xs font-bold mt-0.5">
        A
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-cc-amber text-xs font-semibold">DeepAgent</span>
          {block.streaming && <span className="text-cc-dim text-xs animate-pulse">streaming...</span>}
        </div>
        <div className="prose prose-sm text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
          {block.streaming && <span className="animate-pulse text-cc-dim">▊</span>}
        </div>
      </div>
    </div>
  );
}
