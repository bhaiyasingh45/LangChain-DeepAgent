"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type VoiceState = "idle" | "listening" | "processing" | "unsupported";

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError?: (msg: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Pick a supported MIME type
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
        .find(t => MediaRecorder.isTypeSupported(t)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks so the mic indicator light turns off
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        setState("processing");
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];

        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await fetch(`${API_BASE}/api/voice/transcribe`, {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          if (data.text) onTranscript(data.text);
        } catch (err: any) {
          onError?.(err.message ?? "Transcription failed");
        } finally {
          setState("idle");
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setState("listening");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        onError?.("Microphone access denied. Click the 🔒 icon in your address bar and allow microphone access.");
      } else {
        onError?.(err.message ?? "Could not start microphone");
      }
      setState("idle");
    }
  }, [onTranscript, onError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop(); // triggers onstop → transcription
    }
  }, []);

  const toggle = useCallback(() => {
    if (state === "listening") stop();
    else start();
  }, [state, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { state, toggle };
}
