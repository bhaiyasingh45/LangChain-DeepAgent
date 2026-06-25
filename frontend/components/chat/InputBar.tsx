"use client";
import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { useChatStore } from "@/store/chatStore";
import { useSSEStream } from "@/hooks/useSSEStream";
import { useSlashCommands } from "@/hooks/useSlashCommands";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export function InputBar() {
  const [value, setValue] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { streaming, sessionId, appendBlock, finalizeBlock } = useChatStore();
  const { startStream, sendCommand } = useSSEStream();
  const { suggestions, isExactCommand } = useSlashCommands(value);

  const showError = (msg: string) => {
    setVoiceError(msg);
    setTimeout(() => setVoiceError(""), 5000);
  };

  const { state: voiceState, toggle: toggleVoice } = useVoiceInput({
    onTranscript: (text) => {
      setValue(prev => (prev.trim() ? prev.trim() + " " + text : text));
      autoResize();
      textareaRef.current?.focus();
    },
    onError: showError,
  });

  const isListening = voiceState === "listening";
  const isProcessing = voiceState === "processing";

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 144) + "px";
  };

  const submit = useCallback(async () => {
    const text = value.trim();
    if (!text || streaming) return;
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (text.startsWith("/")) {
      const id = appendBlock("user", { content: text });
      finalizeBlock(id);
      await sendCommand(text, sessionId);
      return;
    }
    const id = appendBlock("user", { content: text });
    finalizeBlock(id);
    await startStream(text, sessionId);
  }, [value, streaming, sessionId, appendBlock, finalizeBlock, sendCommand, startStream]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSuggestionIndex(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSuggestionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && !isExactCommand)) {
        e.preventDefault();
        setValue(suggestions[suggestionIndex].command + " ");
        setSuggestionIndex(0);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  /* Border color for the input box */
  const boxBorderClass = isListening
    ? "border-cc-red/70 shadow-[0_0_0_1px_rgba(248,113,113,0.15)]"
    : isProcessing
    ? "border-cc-yellow/60"
    : "border-cc-border focus-within:border-cc-amber/60 focus-within:shadow-[0_0_0_1px_rgba(212,168,83,0.12)]";

  return (
    <div className="border-t border-cc-border bg-cc-surface px-3 py-3 relative">

      {/* Slash autocomplete — anchored above the box */}
      {suggestions.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-cc-elevated border border-cc-border rounded-xl shadow-2xl z-10 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.command}
              onClick={() => { setValue(s.command + " "); setSuggestionIndex(0); textareaRef.current?.focus(); }}
              className={`flex items-baseline gap-3 w-full text-left px-3.5 py-2 text-xs transition-colors ${
                i === suggestionIndex ? "bg-cc-muted/50 text-cc-text" : "hover:bg-cc-muted/20 text-cc-dim"
              }`}
            >
              <span className="text-cc-amber font-mono font-semibold">{s.command}</span>
              <span className="text-cc-dim">{s.description}</span>
            </button>
          ))}
        </div>
      )}

      {/* Voice error */}
      {voiceError && (
        <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-cc-elevated border border-cc-red/40 rounded-xl px-3.5 py-2.5 text-cc-red text-xs leading-relaxed z-10">
          {voiceError}
        </div>
      )}

      {/* Voice activity indicator — sits just above the input box */}
      {(isListening || isProcessing) && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {isListening ? (
            <>
              <span className="flex gap-0.5 items-end h-4">
                {[3, 5, 8, 5, 3].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-cc-red rounded-full"
                    style={{ height: `${h}px`, animation: `voiceBounce 0.7s ease-in-out ${i * 120}ms infinite alternate` }}
                  />
                ))}
              </span>
              <span className="text-cc-red text-[10px] font-semibold uppercase tracking-wide">Recording</span>
              <span className="text-cc-dim text-[10px]">— click mic to stop &amp; transcribe</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cc-yellow animate-pulse" />
              <span className="text-cc-yellow text-[10px] font-semibold uppercase tracking-wide">Transcribing…</span>
            </>
          )}
        </div>
      )}

      {/* The visible input box */}
      <div
        className={`flex flex-col bg-cc-elevated border rounded-xl transition-all duration-150 ${boxBorderClass}`}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => { setValue(e.target.value); autoResize(); setSuggestionIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening    ? "Recording — click the stop button when done"
            : isProcessing ? "Transcribing your speech…"
            : streaming    ? "Agent is running…"
            : "Ask anything… (/ for commands, mic for voice)"
          }
          disabled={streaming || isProcessing}
          rows={1}
          className="w-full bg-transparent text-cc-text text-sm placeholder-cc-muted resize-none outline-none leading-relaxed px-3.5 pt-3 pb-1 min-h-[36px] max-h-36 disabled:opacity-50"
          style={{ scrollbarWidth: "none" }}
        />

        {/* Bottom toolbar row */}
        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          {/* Left: mic + attach */}
          <div className="flex items-center gap-1">
            {voiceState !== "unsupported" && (
              <button
                onClick={toggleVoice}
                disabled={streaming}
                title={isListening ? "Stop recording" : isProcessing ? "Transcribing…" : "Voice input"}
                className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                  isListening
                    ? "text-cc-red bg-cc-red/10"
                    : isProcessing
                    ? "text-cc-yellow"
                    : "text-cc-dim hover:text-cc-amber hover:bg-cc-muted/20"
                } disabled:opacity-30`}
              >
                {isListening ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={isProcessing ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
            )}

            <button
              className="w-7 h-7 rounded-md flex items-center justify-center text-cc-dim hover:text-cc-text hover:bg-cc-muted/20 transition-colors disabled:opacity-30"
              title="Attach file"
              disabled={streaming}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </div>

          {/* Right: hint + send */}
          <div className="flex items-center gap-2">
            {!streaming && (
              <span className="text-cc-muted text-[10px] hidden sm:block">
                Enter to send · Shift+Enter for newline
              </span>
            )}
            <button
              onClick={submit}
              disabled={!value.trim() || streaming}
              title="Send (Enter)"
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                value.trim() && !streaming
                  ? "text-cc-amber hover:bg-cc-amber/10"
                  : "text-cc-muted"
              } disabled:opacity-30`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
