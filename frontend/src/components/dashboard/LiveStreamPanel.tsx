"use client";

import { Clapperboard, Scan, Video } from "lucide-react";
import type { StreamMode } from "@/lib/types";
import clsx from "clsx";

interface LiveStreamPanelProps {
  frameSrc: string | null;
  frameId: number;
  isActive: boolean;
  streamMode: StreamMode;
  demoComplete?: boolean;
}

export function LiveStreamPanel({
  frameSrc,
  frameId,
  isActive,
  streamMode,
  demoComplete,
}: LiveStreamPanelProps) {
  const isLive = isActive && streamMode === "live";
  const isDemo = isActive && streamMode === "demo";

  return (
    <section className="glass-card overflow-hidden animate-fade-in ring-1 ring-cyan-500/10">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-cyan-500" />
          <div>
            <h2 className="section-title">Live traffic view</h2>
            <p className="text-xs text-foreground-subtle">
              Colored boxes = vehicles the AI detected
            </p>
          </div>
        </div>
        {isActive && frameId > 0 && (
          <span className="rounded-lg bg-surface-overlay px-2.5 py-1 text-xs font-medium text-foreground-muted">
            Analyzing frame {frameId.toLocaleString()}
          </span>
        )}
      </div>

      <div className="relative aspect-video w-full bg-black/40 dark:bg-black/60">
        {frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frameSrc}
            alt="Live traffic with AI vehicle detections highlighted"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 px-6 text-center">
            <div
              className={clsx(
                "flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed transition-all",
                isActive
                  ? "animate-pulse-soft border-cyan-500/30 bg-cyan-500/5"
                  : "border-[var(--glass-border)]",
              )}
            >
              <Scan className="h-8 w-8 text-foreground-subtle" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isActive
                  ? "AI analyzing traffic flow…"
                  : demoComplete
                    ? "Playback finished"
                    : "Your traffic video will appear here"}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">
                {!isActive &&
                  !demoComplete &&
                  "Upload a video or start your camera to begin"}
                {isActive &&
                  "Detecting vehicles and measuring congestion per lane"}
              </p>
            </div>
          </div>
        )}

        {isLive && frameSrc && (
          <div className="absolute left-3 top-3 badge-live">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Live camera
          </div>
        )}
        {isDemo && frameSrc && (
          <div className="absolute left-3 top-3 badge-demo">
            <Clapperboard className="h-3 w-3" />
            Video demo
          </div>
        )}
      </div>
    </section>
  );
}
