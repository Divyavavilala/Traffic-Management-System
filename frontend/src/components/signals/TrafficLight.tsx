"use client";

import type { SignalPhase } from "@/lib/signal-types";
import clsx from "clsx";

interface TrafficLightProps {
  phase: SignalPhase;
  label?: string;
  compact?: boolean;
  inactive?: boolean;
  highlighted?: boolean;
}

const BULB: Record<Exclude<SignalPhase, "idle">, "green" | "yellow" | "red"> = {
  green: "green",
  yellow: "yellow",
  red: "red",
};

const BULB_STYLES = {
  red: {
    on: "bg-red-500 shadow-[0_0_20px_6px_rgba(239,68,68,0.65)] ring-2 ring-red-400/50",
    off: "bg-zinc-700/80 dark:bg-zinc-800",
  },
  yellow: {
    on: "bg-amber-400 shadow-[0_0_20px_6px_rgba(251,191,36,0.55)] ring-2 ring-amber-300/40",
    off: "bg-zinc-700/80 dark:bg-zinc-800",
  },
  green: {
    on: "bg-emerald-500 shadow-[0_0_22px_6px_rgba(16,185,129,0.6)] ring-2 ring-emerald-400/45",
    off: "bg-zinc-700/80 dark:bg-zinc-800",
  },
} as const;

export function TrafficLight({
  phase,
  label,
  compact,
  inactive,
  highlighted,
}: TrafficLightProps) {
  const isIdle = inactive || phase === "idle";
  const active = isIdle ? null : BULB[phase];

  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 transition-all duration-500",
        isIdle && "opacity-45",
        highlighted && !isIdle && "scale-105",
      )}
    >
      <div
        className={clsx(
          "relative flex flex-col items-center gap-2.5 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 p-2.5 shadow-lg ring-1",
          compact ? "gap-2 p-2" : "p-3",
          highlighted
            ? "ring-cyan-500/40 shadow-glow-sm"
            : "ring-white/10 dark:ring-white/10",
        )}
      >
        <div className="absolute inset-x-3 top-0 h-1 rounded-b bg-white/10" />
        {(["red", "yellow", "green"] as const).map((color) => {
          const isOn = !isIdle && active === color;
          return (
            <div
              key={color}
              className={clsx(
                "rounded-full transition-all duration-500",
                compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-7 w-7 sm:h-8 sm:w-8",
                isOn ? BULB_STYLES[color].on : BULB_STYLES[color].off,
                isOn && "animate-glow-pulse",
              )}
            />
          );
        })}
      </div>
      {label && (
        <span
          className={clsx(
            "text-xs font-semibold uppercase tracking-wider",
            highlighted ? "text-cyan-600 dark:text-cyan-400" : "text-foreground-subtle",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
