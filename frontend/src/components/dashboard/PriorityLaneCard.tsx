"use client";

import { ArrowRight, Clock } from "lucide-react";
import { CONGESTION_LABELS, LANE_LABELS } from "@/lib/signal-types";
import type { CongestionLevel, LaneId, SignalRecommendation } from "@/lib/signal-types";
import clsx from "clsx";

interface PriorityLaneCardProps {
  recommendation: SignalRecommendation | null;
  activeLane: LaneId | null | undefined;
  isActive: boolean;
}

export function PriorityLaneCard({
  recommendation,
  activeLane,
  isActive,
}: PriorityLaneCardProps) {
  if (!isActive || !recommendation?.optimization_active) {
    return (
      <div className="glass-card border-dashed p-5 text-center text-sm text-foreground-subtle">
        Signal recommendations appear here once vehicles are detected.
      </div>
    );
  }

  const priority = recommendation.priority_lane;
  const level = recommendation.congestion_level as CongestionLevel;

  return (
    <section className="glass-card p-5 animate-fade-in">
      <h2 className="section-title">Signal recommendation</h2>
      <p className="section-subtitle">What the AI suggests right now</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-violet-500/10 p-4 ring-1 ring-violet-500/20">
          <p className="text-xs font-semibold uppercase text-foreground-subtle">
            Give priority to
          </p>
          <p className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
            {priority ? LANE_LABELS[priority] : "—"}
            <ArrowRight className="h-4 w-4 text-violet-500" />
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            Busiest approach based on live detections
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
          <p className="text-xs font-semibold uppercase text-foreground-subtle">
            Recommended green time
          </p>
          <p className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
            <Clock className="h-5 w-5 text-emerald-500" />
            {recommendation.green_duration_sec} seconds
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {CONGESTION_LABELS[level]} on this approach
          </p>
        </div>
      </div>

      {activeLane && activeLane !== priority && (
        <p className="mt-3 rounded-lg bg-surface-overlay px-3 py-2 text-xs text-foreground-muted">
          Currently serving {LANE_LABELS[activeLane]} — will switch to{" "}
          {priority ? LANE_LABELS[priority] : "next priority"} after this phase.
        </p>
      )}
    </section>
  );
}
