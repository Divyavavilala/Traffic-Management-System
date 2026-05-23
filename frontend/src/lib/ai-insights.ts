import { congestionLevel } from "@/lib/config";
import {
  CONGESTION_LABELS,
  LANE_LABELS,
  type CongestionLevel,
  type LaneId,
  type SignalPhase,
  type SignalRecommendation,
  type SignalState,
} from "@/lib/signal-types";
import type { TrafficAnalytics } from "@/lib/types";

export interface AiInsight {
  id: string;
  type: "info" | "success" | "warning" | "action";
  title: string;
  message: string;
}

export interface SignalExplanation {
  headline: string;
  detail: string;
}

function laneLabel(lane: LaneId | null | undefined): string {
  return lane ? LANE_LABELS[lane] : "this approach";
}

export function explainPriorityLane(
  recommendation: SignalRecommendation | null,
  analytics: TrafficAnalytics,
): string | null {
  if (!recommendation?.priority_lane) return null;

  const lane = recommendation.priority_lane;
  const scores = analytics.scores_by_lane ?? {};
  const counts = analytics.counts_by_lane ?? {};
  const score = scores[lane] ?? 0;
  const count = counts[lane] ?? 0;
  const level = recommendation.congestion_level;

  if (count === 0 && score === 0) {
    return `${laneLabel(lane)} is currently selected based on live traffic patterns.`;
  }

  return `${laneLabel(lane)} lane prioritized — highest congestion (${CONGESTION_LABELS[level].toLowerCase()}, ${count} vehicle${count !== 1 ? "s" : ""}, score ${score.toFixed(1)}).`;
}

export function explainGreenDuration(
  recommendation: SignalRecommendation | null,
): string | null {
  if (!recommendation?.optimization_active) return null;

  const sec = recommendation.green_duration_sec;
  const level = recommendation.congestion_level;
  const lane = recommendation.priority_lane;

  const durationReason: Record<CongestionLevel, string> = {
    none: "minimal traffic",
    low: "light traffic",
    medium: "moderate traffic",
    heavy: "heavy traffic",
    severe: "severe congestion",
  };

  return `Green light set to ${sec}s for ${laneLabel(lane)} because of ${durationReason[level]}.`;
}

export function explainLaneChange(
  previousLane: LaneId | null,
  currentLane: LaneId | null,
  analytics: TrafficAnalytics,
): string | null {
  if (!previousLane || !currentLane || previousLane === currentLane) {
    return null;
  }

  const scores = analytics.scores_by_lane ?? {};
  const currentScore = scores[currentLane] ?? 0;
  const prevScore = scores[previousLane] ?? 0;

  return `Signal switched from ${laneLabel(previousLane)} to ${laneLabel(currentLane)} — ${laneLabel(currentLane)} now has the highest congestion (score ${currentScore.toFixed(1)} vs ${prevScore.toFixed(1)}).`;
}

export function explainPhaseChange(
  previousPhase: SignalPhase | null,
  signal: SignalState | null,
): string | null {
  if (!signal?.active_lane || !previousPhase || previousPhase === signal.phase) {
    return null;
  }

  const lane = laneLabel(signal.active_lane);

  if (signal.phase === "yellow") {
    return `${lane} signal turning yellow — preparing to serve the next priority lane.`;
  }
  if (signal.phase === "green" && previousPhase === "red") {
    return `Green light activated for ${lane} to clear backed-up traffic.`;
  }
  return null;
}

export function buildAiInsights(params: {
  isActive: boolean;
  analytics: TrafficAnalytics;
  signal: SignalState | null;
  recommendation: SignalRecommendation | null;
  streamMode: string;
  frameId: number;
  laneChangeMessage: string | null;
  greenMessage: string | null;
}): AiInsight[] {
  const {
    isActive,
    analytics,
    signal,
    recommendation,
    streamMode,
    frameId,
    laneChangeMessage,
    greenMessage,
  } = params;

  const insights: AiInsight[] = [];

  if (!isActive) {
    insights.push({
      id: "welcome",
      type: "info",
      title: "Ready when you are",
      message:
        "Choose live camera or upload an intersection video. The AI will detect vehicles, measure congestion, and adjust signals automatically.",
    });
    return insights;
  }

  if (frameId < 3) {
    insights.push({
      id: "analyzing",
      type: "action",
      title: "AI is analyzing traffic",
      message:
        "Scanning each frame for cars, buses, trucks, and motorbikes to understand how busy each approach is.",
    });
    return insights;
  }

  const count = analytics.vehicle_count;
  if (count === 0) {
    insights.push({
      id: "no-traffic",
      type: "info",
      title: "Watching for vehicles",
      message:
        "No vehicles in view yet. When traffic appears, congestion levels and signal timing will update automatically.",
    });
    return insights;
  }

  const level = congestionLevel(analytics.weighted_traffic_score);
  insights.push({
    id: "traffic-detected",
    type: "success",
    title: `${count} vehicle${count !== 1 ? "s" : ""} detected`,
    message: `Overall congestion is ${level.label.toLowerCase()}. The system is balancing green time across intersection approaches.`,
  });

  if (laneChangeMessage) {
    insights.push({
      id: "lane-change",
      type: "warning",
      title: "Priority lane updated",
      message: laneChangeMessage,
    });
  } else if (greenMessage) {
    insights.push({
      id: "green-timing",
      type: "info",
      title: "Signal timing adapted",
      message: greenMessage,
    });
  } else if (recommendation?.alert_message) {
    insights.push({
      id: "alert",
      type: "warning",
      title: "Congestion alert",
      message: recommendation.alert_message,
    });
  } else if (signal?.priority_lane && recommendation) {
    const priorityMsg = explainPriorityLane(recommendation, analytics);
    if (priorityMsg) {
      insights.push({
        id: "priority",
        type: "info",
        title: "Why this lane?",
        message: priorityMsg,
      });
    }
  }

  if (streamMode === "demo") {
    insights.push({
      id: "demo-note",
      type: "info",
      title: "Demo mode",
      message:
        "Playing your uploaded video through the same AI pipeline used for live cameras — signals react to detected traffic, not a preset schedule.",
    });
  }

  if (
    signal?.optimization_active &&
    signal.phase === "green" &&
    level.label === "Low" &&
    count > 0
  ) {
    insights.push({
      id: "flow-ok",
      type: "success",
      title: "Traffic flow looks healthy",
      message: "Congestion is low — shorter green cycles keep all approaches moving fairly.",
    });
  }

  return insights.slice(0, 4);
}

export function getOverallCongestionLabel(score: number): {
  label: string;
  description: string;
  color: string;
} {
  const level = congestionLevel(score);
  const descriptions: Record<string, string> = {
    Low: "Traffic is moving freely across the intersection.",
    Moderate: "Some buildup — signals are adjusting timing to keep flow steady.",
    High: "Noticeable congestion — longer greens on the busiest approaches.",
    Critical: "Heavy congestion — maximum green time on priority lanes.",
  };
  return {
    label: level.label,
    color: level.color,
    description: descriptions[level.label] ?? descriptions.Moderate,
  };
}
