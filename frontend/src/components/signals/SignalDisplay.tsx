"use client";

import { useMemo, useState } from "react";
import { Ambulance, ShieldAlert, ShieldOff, TrafficCone } from "lucide-react";
import { CongestionAlert } from "@/components/signals/CongestionAlert";
import { CountdownTimer } from "@/components/signals/CountdownTimer";
import { IntersectionSignals } from "@/components/signals/IntersectionSignals";
import { LanePriorityList } from "@/components/signals/LanePriorityList";
import { SignalRecommendationCard } from "@/components/signals/SignalRecommendationCard";
import { TrafficLight } from "@/components/signals/TrafficLight";
import { activateEmergency, clearEmergency } from "@/lib/signal-api";
import { signalPhaseKey } from "@/lib/signal-phase-key";
import { LANE_LABELS, resolveSignalUiMode } from "@/lib/signal-types";
import type { SignalRecommendation, SignalState } from "@/lib/signal-types";
import clsx from "clsx";

interface SignalDisplayProps {
  signal: SignalState | null;
  recommendation: SignalRecommendation | null;
  isActive: boolean;
}

export function SignalDisplay({
  signal,
  recommendation,
  isActive,
}: SignalDisplayProps) {
  const [busy, setBusy] = useState(false);

  const uiMode = useMemo(
    () => resolveSignalUiMode(isActive, signal),
    [isActive, signal],
  );

  const inactive = uiMode !== "active";
  const emergencyActive =
    !inactive && signal?.emergency_mode !== "none" && signal?.emergency_mode !== undefined;

  const statusMessage =
    signal?.status_message ??
    (uiMode === "no_stream"
      ? "Start live traffic monitoring or upload a demo traffic video"
      : uiMode === "no_traffic"
        ? "No traffic detected"
        : "Adaptive traffic optimization active");

  const handleEmergency = async (mode: "ambulance" | "emergency") => {
    if (inactive) return;
    setBusy(true);
    try {
      await activateEmergency(mode, signal?.priority_lane ?? undefined);
    } catch {
      /* stream inactive or no vehicles */
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await clearEmergency();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (uiMode === "no_stream") {
    return (
      <section className="glass-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <TrafficCone className="h-5 w-5 shrink-0 text-foreground-subtle" />
            <div>
              <h2 className="section-title">Intersection traffic lights</h2>
              <p className="mt-1 text-sm text-foreground-muted">{statusMessage}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 opacity-35 sm:grid-cols-4">
          {(["north", "south", "east", "west"] as const).map((lane) => (
            <TrafficLight key={lane} phase="idle" label={LANE_LABELS[lane]} compact inactive />
          ))}
        </div>
      </section>
    );
  }

  if (!signal) {
    return null;
  }

  const displayPhase = inactive ? "idle" : signal.phase;
  const countdownPhaseKey = inactive
    ? "idle"
    : signalPhaseKey(signal);
  const activeLaneLabel = signal.active_lane
    ? LANE_LABELS[signal.active_lane]
    : "None";

  return (
    <section
      className={clsx(
        "glass-card overflow-hidden",
        inactive && "opacity-95",
      )}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--glass-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Intersection traffic lights</h2>
          <p className="text-xs text-foreground-muted">
            {inactive ? (
              <span>{statusMessage}</span>
            ) : (
              <>
                Active lane:{" "}
                <span className="text-cyan-600 dark:text-cyan-400">{activeLaneLabel}</span>
                {" · "}
                Phase:{" "}
                <span className="uppercase text-foreground">{signal.phase}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || inactive}
            onClick={() => handleEmergency("ambulance")}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              "bg-red-500/15 text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <Ambulance className="h-3.5 w-3.5" />
            Ambulance override
          </button>
          <button
            type="button"
            disabled={busy || inactive}
            onClick={() => handleEmergency("emergency")}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
              "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30 hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Emergency priority
          </button>
          {emergencyActive && (
            <button
              type="button"
              disabled={busy}
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Clear override
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center gap-4 lg:col-span-1">
          <TrafficLight
            phase={displayPhase}
            label="Active signal"
            inactive={inactive}
          />
          <CountdownTimer
            phaseKey={countdownPhaseKey}
            initialSeconds={signal.countdown_sec}
            phase={displayPhase}
            inactive={inactive}
            phaseMaxSec={
              displayPhase === "green"
                ? signal.recommended_green_sec
                : displayPhase === "yellow"
                  ? 3
                  : displayPhase === "red"
                    ? 3
                    : undefined
            }
          />
          <p className="text-center text-xs text-foreground-subtle">
            {inactive
              ? "Timers paused"
              : `Recommended green: ${signal.recommended_green_sec}s`}
          </p>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <CongestionAlert
            uiMode={uiMode}
            level={signal.congestion_level}
            statusMessage={statusMessage}
            message={signal.alert_message}
            emergencyActive={emergencyActive}
          />
          <IntersectionSignals signal={signal} uiMode={uiMode} />
          <SignalRecommendationCard
            recommendation={recommendation}
            uiMode={uiMode}
          />
        </div>
      </div>

      {uiMode === "active" &&
        recommendation &&
        recommendation.lane_priorities.length > 0 && (
          <div className="border-t border-[var(--glass-border)] p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Lane priority ranking
            </h3>
            <LanePriorityList
              priorities={recommendation.lane_priorities}
              activeLane={signal.active_lane}
              priorityLane={signal.priority_lane}
            />
          </div>
        )}
    </section>
  );
}
