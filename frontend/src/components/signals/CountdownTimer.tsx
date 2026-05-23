"use client";

import type { SignalPhase } from "@/lib/signal-types";
import { useSignalCountdown } from "@/hooks/useSignalCountdown";
import clsx from "clsx";
import { memo, useEffect, useRef } from "react";

interface CountdownTimerProps {
  /** Resets local countdown when this changes (phase / lane / emergency). */
  phaseKey: string;
  /** Server countdown at phase start — not synced on every WebSocket frame. */
  initialSeconds: number;
  phase: SignalPhase;
  inactive?: boolean;
  /** Total phase duration for the ring (e.g. recommended green seconds). */
  phaseMaxSec?: number;
}

const PHASE_RING: Record<Exclude<SignalPhase, "idle">, string> = {
  green: "stroke-emerald-500",
  yellow: "stroke-amber-400",
  red: "stroke-red-500",
};

const PHASE_GLOW: Record<Exclude<SignalPhase, "idle">, string> = {
  green: "drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]",
  yellow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]",
  red: "drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]",
};

function CountdownTimerInner({
  phaseKey,
  initialSeconds,
  phase,
  inactive,
  phaseMaxSec,
}: CountdownTimerProps) {
  const displaySec = useSignalCountdown({
    phaseKey,
    initialSeconds,
    inactive,
  });

  const ringMaxRef = useRef(
    Math.max(phaseMaxSec ?? initialSeconds, initialSeconds, 1),
  );
  const ringPhaseKeyRef = useRef(phaseKey);

  useEffect(() => {
    if (ringPhaseKeyRef.current !== phaseKey) {
      ringPhaseKeyRef.current = phaseKey;
      ringMaxRef.current = Math.max(
        phaseMaxSec ?? initialSeconds,
        initialSeconds,
        1,
      );
    }
  }, [phaseKey, phaseMaxSec, initialSeconds]);

  const isIdle = inactive || phase === "idle";
  const ringPhase = phase === "idle" ? "red" : phase;
  const max = ringMaxRef.current;
  const circumference = 2 * Math.PI * 44;
  const pct = isIdle ? 0 : Math.min(100, (displaySec / max) * 100);

  return (
    <div
      className={clsx(
        "relative flex h-32 w-32 items-center justify-center transition-opacity duration-300",
        isIdle && "opacity-40",
        !isIdle && PHASE_GLOW[ringPhase],
      )}
    >
      <svg className="-rotate-90 h-32 w-32" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          className="stroke-surface-overlay"
          strokeWidth="5"
        />
        {!isIdle && (
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            className={clsx(
              PHASE_RING[ringPhase],
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
            )}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={clsx(
            "text-4xl font-bold tabular-nums",
            isIdle
              ? "text-foreground-subtle"
              : ringPhase === "green"
                ? "text-emerald-600 dark:text-emerald-400"
                : ringPhase === "yellow"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400",
          )}
        >
          {isIdle ? "—" : displaySec}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-subtle">
          {isIdle ? "standby" : "seconds"}
        </span>
      </div>
    </div>
  );
}

export const CountdownTimer = memo(CountdownTimerInner);
