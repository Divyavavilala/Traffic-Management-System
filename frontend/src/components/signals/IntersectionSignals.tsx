"use client";

import { TrafficLight } from "@/components/signals/TrafficLight";
import { LANE_LABELS, type LaneId, type SignalState } from "@/lib/signal-types";
import type { SignalUiMode } from "@/lib/signal-types";
import clsx from "clsx";

const LANES: LaneId[] = ["north", "south", "east", "west"];

interface IntersectionSignalsProps {
  signal: SignalState;
  uiMode: SignalUiMode;
}

export function IntersectionSignals({ signal, uiMode }: IntersectionSignalsProps) {
  const inactive = uiMode !== "active";

  return (
    <div className="relative rounded-2xl border border-[var(--glass-border)] bg-surface-overlay/50 p-4 sm:p-6">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={clsx(
            "rounded-full border-2 border-dashed transition-all",
            inactive
              ? "h-16 w-16 border-foreground-subtle/20"
              : "h-20 w-20 border-cyan-500/20 bg-cyan-500/5",
          )}
        >
          <span className="sr-only">Intersection center</span>
        </div>
      </div>

      <div className="relative grid grid-cols-3 grid-rows-3 gap-2 sm:gap-4 min-h-[220px]">
        <div className="col-start-2 row-start-1 flex justify-center">
          <LaneSignal
            lane="north"
            signal={signal}
            inactive={inactive}
          />
        </div>
        <div className="col-start-1 row-start-2 flex items-center justify-center">
          <LaneSignal lane="west" signal={signal} inactive={inactive} />
        </div>
        <div className="col-start-3 row-start-2 flex items-center justify-center">
          <LaneSignal lane="east" signal={signal} inactive={inactive} />
        </div>
        <div className="col-start-2 row-start-3 flex justify-center">
          <LaneSignal lane="south" signal={signal} inactive={inactive} />
        </div>
      </div>
    </div>
  );
}

function LaneSignal({
  lane,
  signal,
  inactive,
}: {
  lane: LaneId;
  signal: SignalState;
  inactive: boolean;
}) {
  const phase = signal.lanes[lane] ?? "idle";
  const isActive = !inactive && lane === signal.active_lane;

  return (
    <div
      className={clsx(
        "rounded-xl p-2 transition-all duration-500",
        isActive &&
          "bg-gradient-to-b from-cyan-500/10 to-transparent ring-1 ring-cyan-500/30 shadow-glow-sm",
        !isActive && !inactive && "opacity-75",
        inactive && "opacity-40",
      )}
    >
      <TrafficLight
        phase={inactive ? "idle" : phase}
        label={LANE_LABELS[lane]}
        compact
        inactive={inactive}
        highlighted={isActive}
      />
    </div>
  );
}
