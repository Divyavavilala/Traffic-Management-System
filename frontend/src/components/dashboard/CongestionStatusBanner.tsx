"use client";

import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getOverallCongestionLabel } from "@/lib/ai-insights";
import { LANE_LABELS } from "@/lib/signal-types";
import type { LaneId } from "@/lib/signal-types";
import type { TrafficAnalytics } from "@/lib/types";
interface CongestionStatusBannerProps {
  analytics: TrafficAnalytics;
  isActive: boolean;
  priorityLane: LaneId | null | undefined;
  activeLane: LaneId | null | undefined;
  greenSeconds: number | null;
}

export function CongestionStatusBanner({
  analytics,
  isActive,
  priorityLane,
  activeLane,
  greenSeconds,
}: CongestionStatusBannerProps) {
  if (!isActive) return null;

  const congestion = getOverallCongestionLabel(
    analytics.weighted_traffic_score,
  );
  const count = analytics.vehicle_count;

  const StatusIcon =
    congestion.label === "Low" || count === 0
      ? CheckCircle2
      : congestion.label === "Critical" || congestion.label === "High"
        ? AlertTriangle
        : Activity;

  return (
    <section
      className="glass-card overflow-hidden animate-slide-up"
      style={{
        boxShadow: `0 0 40px -12px ${congestion.color}33`,
      }}
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${congestion.color}, transparent)`,
        }}
      />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${congestion.color}22` }}
          >
            <StatusIcon className="h-6 w-6" style={{ color: congestion.color }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Current congestion status
            </p>
            <p
              className="text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: congestion.color }}
            >
              {count === 0 ? "Watching for traffic" : congestion.label}
            </p>
            <p className="mt-1 max-w-lg text-sm text-foreground-muted">
              {count === 0
                ? "The AI is scanning the video — vehicles will appear with colored boxes when detected."
                : congestion.description}
            </p>
          </div>
        </div>

        {(priorityLane || activeLane) && count > 0 && (
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {priorityLane && (
              <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
                Priority: {LANE_LABELS[priorityLane]}
              </span>
            )}
            {activeLane && (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Green light: {LANE_LABELS[activeLane]}
                {greenSeconds != null && greenSeconds > 0
                  ? ` · ${greenSeconds}s`
                  : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
