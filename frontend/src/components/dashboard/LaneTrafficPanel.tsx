"use client";

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { congestionLevel } from "@/lib/config";
import {
  LANE_COLORS,
  LANE_IDS,
  LANE_LABELS,
  type LaneId,
  type TrafficAnalytics,
} from "@/lib/types";
import clsx from "clsx";

const LANE_ICONS: Record<LaneId, typeof ArrowUp> = {
  north: ArrowUp,
  south: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
};

interface LaneTrafficPanelProps {
  analytics: TrafficAnalytics;
  priorityLane: LaneId | null | undefined;
  activeLane: LaneId | null | undefined;
  isActive: boolean;
}

export function LaneTrafficPanel({
  analytics,
  priorityLane,
  activeLane,
  isActive,
}: LaneTrafficPanelProps) {
  const scores = analytics.scores_by_lane ?? {};
  const counts = analytics.counts_by_lane ?? {};
  const maxScore = Math.max(...LANE_IDS.map((l) => scores[l] ?? 0), 0.01);

  const ranked = [...LANE_IDS].sort(
    (a, b) => (scores[b] ?? 0) - (scores[a] ?? 0),
  );

  return (
    <section className="glass-card p-5">
      <h2 className="section-title">Lane ranking</h2>
      <p className="section-subtitle">
        Which approaches are busiest — highest congestion gets the green light
        first
      </p>

      <ul className="mt-4 space-y-3">
        {ranked.map((lane, index) => {
          const score = scores[lane] ?? 0;
          const count = counts[lane] ?? 0;
          const level = congestionLevel(score);
          const Icon = LANE_ICONS[lane];
          const color = LANE_COLORS[lane];
          const pct = (score / maxScore) * 100;
          const isPriority = priorityLane === lane;
          const isActiveLane = activeLane === lane;

          return (
            <li
              key={lane}
              className={clsx(
                "rounded-xl border px-3 py-3 transition-all duration-500",
                isActiveLane &&
                  "border-cyan-500/30 bg-cyan-500/5 shadow-glow-sm",
                isPriority &&
                  !isActiveLane &&
                  "border-violet-500/25 bg-violet-500/5",
                !isActiveLane && !isPriority && "border-[var(--glass-border)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-foreground-subtle">
                    #{index + 1}
                  </span>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {LANE_LABELS[lane]} approach
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {count} vehicle{count !== 1 ? "s" : ""} · {level.label}{" "}
                      congestion
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isPriority && (
                    <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                      Next priority
                    </span>
                  )}
                  {isActiveLane && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                      Green now
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {!isActive && (
        <p className="mt-3 text-xs text-foreground-subtle">
          Rankings appear when monitoring is active.
        </p>
      )}
    </section>
  );
}
