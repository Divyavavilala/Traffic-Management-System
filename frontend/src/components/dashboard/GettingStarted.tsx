"use client";

import { Play, Upload, TrafficCone } from "lucide-react";
import type { InputModeChoice } from "@/components/dashboard/ModeSelector";

interface GettingStartedProps {
  inputMode: InputModeChoice | null;
  onSelectLive: () => void;
  onFocusUpload: () => void;
  hasUploadedVideo: boolean;
}

export function GettingStarted({
  inputMode,
  onSelectLive,
  onFocusUpload,
  hasUploadedVideo,
}: GettingStartedProps) {
  return (
    <section className="glass-card relative overflow-hidden px-6 py-12 text-center sm:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--hero-gradient)" }}
      />
      <div className="relative mx-auto max-w-xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-500/30">
          <TrafficCone className="h-8 w-8 text-cyan-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Start AI Traffic Monitoring
          </h2>
          <p className="text-sm leading-relaxed text-foreground-muted sm:text-base">
            This platform uses AI to watch traffic, measure congestion on each
            road approach, and automatically adjust intersection signals — just
            like a smart city control center.
          </p>
        </div>

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={onSelectLive} className="btn-primary">
            <Play className="h-4 w-4" />
            Start live camera
          </button>
          <button
            type="button"
            onClick={onFocusUpload}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4" />
            Upload traffic video
          </button>
        </div>

        {!inputMode && (
          <p className="text-xs text-foreground-subtle">
            Pick a mode above, or use the buttons here to get started quickly.
          </p>
        )}

        {inputMode === "demo" && !hasUploadedVideo && (
          <p className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
            Upload a traffic intersection video below to begin AI analysis.
          </p>
        )}

        {inputMode === "live" && (
          <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-800 dark:text-cyan-200">
            Click &quot;Start live camera&quot; when you&apos;re ready — allow
            camera access if your browser asks.
          </p>
        )}
      </div>
    </section>
  );
}
