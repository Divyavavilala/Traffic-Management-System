"use client";

import { Timer } from "lucide-react";
import {
  CONGESTION_LABELS,
  CONGESTION_COLORS,
  LANE_LABELS,
  type SignalRecommendation,
  type SignalUiMode,
} from "@/lib/signal-types";

interface SignalRecommendationCardProps {
  recommendation: SignalRecommendation | null;
  uiMode: SignalUiMode;
}

export function SignalRecommendationCard({
  recommendation,
  uiMode,
}: SignalRecommendationCardProps) {
  if (!recommendation || uiMode !== "active") {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
        {uiMode === "no_stream"
          ? "Start monitoring to see how the AI would time the lights"
          : "Waiting for vehicles — signal timing appears when traffic is detected"}
      </div>
    );
  }

  const color = CONGESTION_COLORS[recommendation.congestion_level];
  const priorityLane = recommendation.priority_lane;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-surface-overlay p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Recommended green
        </p>
        <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white tabular-nums">
          <Timer className="h-5 w-5 text-accent" />
          {recommendation.green_duration_sec}s
        </p>
      </div>
      <div className="rounded-xl bg-surface-overlay p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Yellow / Red
        </p>
        <p className="mt-1 text-lg font-medium text-zinc-300">
          {recommendation.yellow_duration_sec}s /{" "}
          {recommendation.red_duration_sec}s
        </p>
      </div>
      <div className="rounded-xl bg-surface-overlay p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Priority lane
        </p>
        <p className="mt-1 text-lg font-semibold" style={{ color }}>
          {priorityLane ? LANE_LABELS[priorityLane] : "—"}
        </p>
        <p className="text-xs text-foreground-subtle">
          {CONGESTION_LABELS[recommendation.congestion_level]} on this approach
        </p>
      </div>
    </div>
  );
}
