import { API_URL } from "@/lib/config";
import type { LaneId } from "@/lib/signal-types";
import type { SignalRecommendation, SignalState } from "@/lib/signal-types";

export async function activateEmergency(
  mode: "emergency" | "ambulance",
  lane?: LaneId,
): Promise<SignalState> {
  const res = await fetch(`${API_URL}/api/v1/signal/emergency`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, lane: lane ?? null }),
  });
  if (!res.ok) throw new Error("Failed to activate emergency mode");
  return res.json();
}

export async function clearEmergency(): Promise<SignalState> {
  const res = await fetch(`${API_URL}/api/v1/signal/emergency`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to clear emergency mode");
  return res.json();
}

export async function fetchSignalState(): Promise<SignalState> {
  const res = await fetch(`${API_URL}/api/v1/signal/state`);
  if (!res.ok) throw new Error("Failed to fetch signal state");
  return res.json();
}

export async function fetchRecommendation(
  analytics: {
    weighted_traffic_score: number;
    vehicle_count: number;
    counts_by_class: Record<string, number>;
  },
): Promise<SignalRecommendation> {
  const res = await fetch(`${API_URL}/api/v1/signal/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...analytics,
      emergency_mode: "none",
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch recommendation");
  return res.json();
}
