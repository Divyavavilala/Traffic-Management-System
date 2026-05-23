import type { SignalState } from "@/lib/signal-types";

/** Stable identity for a signal phase — countdown resets only when this changes. */
export function signalPhaseKey(signal: SignalState): string {
  return `${signal.phase}:${signal.active_lane ?? "none"}:${signal.emergency_mode}`;
}
