"use client";

import { useCallback, useRef, useState } from "react";
import {
  CheckCircle2,
  Film,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  deleteDemoSession,
  uploadDemoVideo,
  type DemoUploadResult,
} from "@/lib/demo-api";
import type { DemoSessionInfo } from "@/lib/types";
import clsx from "clsx";

interface DemoUploadPanelProps {
  disabled: boolean;
  session: DemoSessionInfo | null;
  onSessionReady: (session: DemoSessionInfo) => void;
  onClearSession: () => void;
  onStartSimulation: () => void;
  isSimulating: boolean;
  demoComplete?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function DemoUploadPanel({
  disabled,
  session,
  onSessionReady,
  onClearSession,
  onStartSimulation,
  isSimulating,
  demoComplete,
}: DemoUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DemoUploadResult | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);
      try {
        const result = await uploadDemoVideo(file, setProgress);
        setMeta(result);
        onSessionReady({
          sessionId: result.session_id,
          filename: result.filename,
          durationSec: result.duration_sec,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setMeta(null);
      } finally {
        setUploading(false);
      }
    },
    [onSessionReady],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [disabled, uploading, handleFile],
  );

  const clearAll = () => {
    const sid = session?.sessionId;
    setMeta(null);
    setProgress(0);
    setError(null);
    onClearSession();
    if (inputRef.current) inputRef.current.value = "";
    if (sid) {
      void deleteDemoSession(sid).catch(() => undefined);
    }
  };

  return (
    <section className="glass-card animate-fade-in p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-violet-500" />
            <h2 className="section-title">Upload a traffic video</h2>
          </div>
          <p className="section-subtitle mt-0.5">
            Use intersection footage — the AI will detect vehicles and adapt
            signals just like a live camera
          </p>
        </div>
        <span className="badge-demo shrink-0">Demo</span>
      </div>

      {!session ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={clsx(
            "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all",
            disabled || uploading
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5",
            "border-[var(--glass-border)]",
          )}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
              <p className="text-sm font-medium text-foreground">
                Uploading video… {progress}%
              </p>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-overlay">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/25">
                <Upload className="h-7 w-7 text-violet-500" />
              </div>
              <p className="text-center text-sm text-foreground-muted">
                Drop your traffic intersection video here, or click to choose a
                file
              </p>
              <p className="text-xs text-foreground-subtle">
                MP4, WebM, MOV, AVI, MKV · max 200 MB
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {session.filename}
              </p>
              {meta && (
                <p className="mt-0.5 text-xs text-foreground-subtle">
                  {formatBytes(meta.size_bytes)} · {formatDuration(meta.duration_sec)}{" "}
                  · {meta.frame_count.toLocaleString()} frames
                </p>
              )}
            </div>
            {!isSimulating && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 rounded-lg p-1.5 text-foreground-subtle hover:bg-surface-overlay hover:text-foreground"
                aria-label="Remove video"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={(disabled && !demoComplete) || isSimulating}
            onClick={onStartSimulation}
            className="btn-primary w-full"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI analyzing your video…
              </>
            ) : demoComplete ? (
              <>
                <Film className="h-4 w-4" />
                Run analysis again
              </>
            ) : (
              <>
                <Film className="h-4 w-4" />
                Start AI analysis
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </section>
  );
}
