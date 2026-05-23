"use client";

import { Play, Radio, Square, Video } from "lucide-react";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import type { StreamMode } from "@/lib/types";
import clsx from "clsx";

interface StreamControlsProps {
  connectionState: ConnectionState;
  streamMode: StreamMode;
  error: string | null;
  isActive: boolean;
  demoComplete: boolean;
  onStartLive: () => void;
  onStop: () => void;
}

export function StreamControls({
  connectionState,
  streamMode,
  error,
  isActive,
  demoComplete,
  onStartLive,
  onStop,
}: StreamControlsProps) {
  const busy = connectionState === "connecting";
  const isLiveActive = isActive && streamMode === "live";
  const isDemoActive = isActive && streamMode === "demo";

  return (
    <section className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-500" />
          <h2 className="section-title">Traffic input</h2>
          {isLiveActive && <span className="badge-live">Live</span>}
          {isDemoActive && <span className="badge-demo">Simulation</span>}
        </div>
        <p className="text-sm text-foreground-muted">
          {isLiveActive
            ? "Live camera feed — adaptive optimization active"
            : isDemoActive
              ? "Replaying uploaded footage through the detection pipeline"
              : demoComplete
                ? "Demo playback finished"
                : "Start live monitoring from your camera or run a demo simulation"}
        </p>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={onStartLive}
          disabled={busy || isActive}
          className="btn-primary"
        >
          <Play className="h-4 w-4" />
          Start live monitoring
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={!isActive && connectionState !== "error" && !demoComplete}
          className="btn-secondary"
        >
          <Square className="h-4 w-4" />
          Stop
        </button>
      </div>

      <div className="hidden items-center gap-4 text-foreground-subtle lg:flex">
        <div className="flex items-center gap-2 text-xs">
          <Video className="h-3.5 w-3.5 text-cyan-500" />
          <span>Realtime</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Radio className="h-3.5 w-3.5 text-violet-500" />
          <span>Demo replay</span>
        </div>
      </div>
    </section>
  );
}
