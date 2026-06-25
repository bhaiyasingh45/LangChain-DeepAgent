"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Block } from "@/store/chatStore";

export function FinalAnswerBlock({ block }: { block: Block }) {
  const content = block.payload?.content ?? "";

  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-6 h-6 rounded-sm flex items-center justify-center text-cc-blue text-xs font-bold border border-cc-blue/30"
          style={{ background: "rgba(96,165,250,0.08)" }}
        >
          A
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 min-w-0 border-l-2 pl-3"
        style={{ borderLeftColor: "rgba(96,165,250,0.3)" }}
      >
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-cc-blue text-xs font-semibold tracking-wide">DeepAgent</span>
          {block.streaming && (
            <span className="text-cc-dim text-[11px] animate-pulse">generating</span>
          )}
        </div>

        {/* Markdown body */}
        <div className="prose prose-sm max-w-none text-cc-text text-sm leading-relaxed prose-headings:text-cc-text prose-strong:text-cc-text prose-code:text-cc-amber prose-code:bg-cc-elevated prose-code:px-1 prose-code:rounded prose-pre:bg-cc-elevated prose-pre:border prose-pre:border-cc-border prose-a:text-cc-blue prose-blockquote:border-cc-blue/30 prose-blockquote:text-cc-dim">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
          {block.streaming && (
            <span className="text-cc-amber animate-pulse">▊</span>
          )}
        </div>
      </div>
    </div>
  );
}
