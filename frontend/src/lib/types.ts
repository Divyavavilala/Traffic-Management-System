import type {
  SignalMessage,
  SignalRecommendation,
  SignalState,
} from "@/lib/signal-types";

export type { SignalMessage, SignalRecommendation, SignalState };

export type VehicleClass = "car" | "motorbike" | "bus" | "truck";

export type LaneId = "north" | "south" | "east" | "west";

export type StreamInputMode = "live" | "demo";

export type StreamMode = "idle" | "live" | "demo";

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface TrafficAnalytics {
  vehicle_count: number;
  weighted_traffic_score: number;
  counts_by_class: Partial<Record<VehicleClass, number>>;
  counts_by_lane?: Partial<Record<LaneId, number>>;
  scores_by_lane?: Partial<Record<LaneId, number>>;
  priority_lane?: LaneId | null;
  fps: number;
}

export interface FrameMessage {
  type: "frame";
  frame_id: number;
  timestamp_ms: number;
  image_base64: string;
  detections: Detection[];
  analytics: TrafficAnalytics;
  signal?: SignalState;
  recommendation?: SignalRecommendation;
}

export interface StatusMessage {
  type: "status";
  message: string;
  running: boolean;
  mode?: StreamMode;
  camera_index?: number | null;
  session_id?: string | null;
  demo_filename?: string | null;
  frame_skip: number;
  inference_size: number;
  model_name: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type WsMessage =
  | FrameMessage
  | StatusMessage
  | ErrorMessage
  | SignalMessage;

export interface ChartPoint {
  time: string;
  score: number;
  vehicles: number;
  fps: number;
}

export interface DemoSessionInfo {
  sessionId: string;
  filename: string;
  durationSec: number;
}

export const VEHICLE_CLASSES: VehicleClass[] = [
  "car",
  "motorbike",
  "bus",
  "truck",
];

export const LANE_IDS: LaneId[] = ["north", "south", "east", "west"];

export const CLASS_LABELS: Record<VehicleClass, string> = {
  car: "Cars",
  motorbike: "Motorbikes",
  bus: "Buses",
  truck: "Trucks",
};

export const LANE_LABELS: Record<LaneId, string> = {
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

export const CLASS_COLORS: Record<VehicleClass, string> = {
  car: "#06b6d4",
  motorbike: "#f59e0b",
  bus: "#10b981",
  truck: "#8b5cf6",
};

export const LANE_COLORS: Record<LaneId, string> = {
  north: "#06b6d4",
  south: "#10b981",
  east: "#f59e0b",
  west: "#8b5cf6",
};
