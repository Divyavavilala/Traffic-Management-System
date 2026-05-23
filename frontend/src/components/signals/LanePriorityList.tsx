"use client";

import { LANE_LABELS, type LanePriority, type LaneId } from "@/lib/signal-types";
import clsx from "clsx";

interface LanePriorityListProps {
  priorities: LanePriority[];
  activeLane: LaneId | null;
  priorityLane: LaneId | null;
}

export function LanePriorityList({
  priorities,
  activeLane,
  priorityLane,
}: LanePriorityListProps) {
  if (priorities.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No lane priorities until traffic is detected</p>
    );
  }

  return (
    <ul className="space-y-2">
      {priorities.map((item, index) => (
        <li
          key={item.lane}
          className={clsx(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
            activeLane && item.lane === activeLane
              ? "bg-accent/10 ring-1 ring-accent/30"
              : "bg-white/[0.03]",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-600">#{index + 1}</span>
            <span className="font-medium text-zinc-200">
              {LANE_LABELS[item.lane]}
            </span>
            {priorityLane && item.lane === priorityLane && (
              <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-300">
                Priority
              </span>
            )}
            {activeLane && item.lane === activeLane && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                Active
              </span>
            )}
          </div>
          <span className="font-mono text-xs tabular-nums text-accent">
            {item.score.toFixed(1)}
          </span>
        </li>
      ))}
    </ul>
  );
}
