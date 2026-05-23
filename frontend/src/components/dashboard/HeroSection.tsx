"use client";

import { Sparkles, Zap } from "lucide-react";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import type { StreamMode } from "@/lib/types";
import clsx from "clsx";

interface HeroSectionProps {
  connectionState: ConnectionState;
  streamMode: StreamMode;
  modelName: string | null;
}

const STATE_COPY: Record<ConnectionState, string> = {
  idle: "Ready to monitor",
  connecting: "Initializing…",
  connected: "Connected",
  streaming: "Analyzing traffic",
  error: "Connection issue",
  closed: "Session ended",
};

export function HeroSection({
  connectionState,
  streamMode,
  modelName,
}: HeroSectionProps) {
  const isActive =
    connectionState === "connected" || connectionState === "streaming";

  return (
    <section className="animate-slide-up relative overflow-hidden rounded-3xl border border-[var(--glass-border)] p-6 sm:p-8">
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: "var(--hero-gradient)" }}
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Intelligent traffic analytics
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Real-time traffic optimization
            <span className="block bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">
              powered by computer vision
            </span>
          </h1>
          <p className="text-sm leading-relaxed text-foreground-muted sm:text-base">
            Monitor live intersections, detect vehicles with YOLOv8, and adapt
            signal timing based on congestion — or replay demo footage for
            presentations.
          </p>
          {modelName && isActive && (
            <p className="text-xs text-foreground-subtle">
              Detection engine active
            </p>
          )}
        </div>

        <div
          className={clsx(
            "flex shrink-0 flex-col gap-2 rounded-2xl border px-4 py-3 backdrop-blur-md",
            "border-[var(--glass-border)] bg-[var(--glass-bg)]",
          )}
        >
          <div className="flex items-center gap-2">
            <Zap
              className={clsx(
                "h-4 w-4",
                isActive ? "text-emerald-500" : "text-foreground-subtle",
              )}
            />
            <span className="text-sm font-semibold text-foreground">
              {STATE_COPY[connectionState]}
            </span>
          </div>
          {streamMode === "demo" && isActive && (
            <span className="text-xs text-violet-600 dark:text-violet-400">
              Demo simulation running
            </span>
          )}
          {streamMode === "live" && isActive && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Live monitoring active
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
