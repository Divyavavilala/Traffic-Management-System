export type CongestionLevel = "none" | "low" | "medium" | "heavy" | "severe";
export type SignalPhase = "idle" | "green" | "yellow" | "red";
export type SignalOperationalMode = "no_stream" | "no_traffic" | "active";
export type LaneId = "north" | "south" | "east" | "west";
export type EmergencyMode = "none" | "emergency" | "ambulance";

export interface LanePriority {
  lane: LaneId;
  score: number;
  vehicle_share: number;
}

export interface SignalRecommendation {
  operational_mode: SignalOperationalMode;
  optimization_active: boolean;
  status_message: string;
  congestion_level: CongestionLevel;
  green_duration_sec: number;
  yellow_duration_sec: number;
  red_duration_sec: number;
  priority_lane: LaneId | null;
  lane_priorities: LanePriority[];
  weighted_traffic_score: number;
  vehicle_count: number;
  emergency_mode: EmergencyMode;
  alert_message: string | null;
}

export interface SignalState {
  operational_mode: SignalOperationalMode;
  optimization_active: boolean;
  status_message: string;
  active_lane: LaneId | null;
  phase: SignalPhase;
  countdown_sec: number;
  recommended_green_sec: number;
  congestion_level: CongestionLevel;
  priority_lane: LaneId | null;
  emergency_mode: EmergencyMode;
  lanes: Record<LaneId, SignalPhase>;
  alert_message: string | null;
}

export interface SignalMessage {
  type: "signal";
  timestamp_ms: number;
  signal: SignalState;
  recommendation: SignalRecommendation;
}

export const LANE_LABELS: Record<LaneId, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

export const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  none: "No congestion data",
  low: "Low traffic",
  medium: "Medium traffic",
  heavy: "Heavy traffic",
  severe: "Severe congestion",
};

export const CONGESTION_COLORS: Record<CongestionLevel, string> = {
  none: "#71717a",
  low: "#34d399",
  medium: "#fbbf24",
  heavy: "#fb923c",
  severe: "#f87171",
};

export const STATUS_MESSAGES = {
  no_stream:
    "Start live traffic monitoring or upload a demo traffic video",
  no_traffic: "No traffic detected",
  active: "Adaptive traffic optimization active",
} as const;

export type SignalUiMode = SignalOperationalMode;

export function resolveSignalUiMode(
  isStreamActive: boolean,
  signal: SignalState | null,
): SignalUiMode {
  if (!isStreamActive) return "no_stream";
  if (
    !signal ||
    signal.operational_mode === "no_traffic" ||
    !signal.optimization_active
  ) {
    return "no_traffic";
  }
  return "active";
}
