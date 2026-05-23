"use client";

import { useEffect, useRef, useState } from "react";
import type { LaneId, SignalPhase, SignalState } from "@/lib/signal-types";
import {
  explainGreenDuration,
  explainLaneChange,
  explainPhaseChange,
} from "@/lib/ai-insights";
import type { SignalRecommendation } from "@/lib/signal-types";
import type { TrafficAnalytics } from "@/lib/types";

export function useSignalChangeTracker(
  signal: SignalState | null,
  recommendation: SignalRecommendation | null,
  analytics: TrafficAnalytics,
  isActive: boolean,
) {
  const prevPriority = useRef<LaneId | null>(null);
  const prevPhase = useRef<SignalPhase | null>(null);
  const [laneChangeMessage, setLaneChangeMessage] = useState<string | null>(
    null,
  );
  const [phaseMessage, setPhaseMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      prevPriority.current = null;
      prevPhase.current = null;
      setLaneChangeMessage(null);
      setPhaseMessage(null);
      return;
    }

    const currentPriority = recommendation?.priority_lane ?? null;
    const currentPhase = signal?.phase ?? null;

    if (prevPriority.current && currentPriority) {
      const msg = explainLaneChange(
        prevPriority.current,
        currentPriority,
        analytics,
      );
      if (msg) setLaneChangeMessage(msg);
    }

    if (prevPhase.current && signal) {
      const msg = explainPhaseChange(prevPhase.current, signal);
      if (msg) setPhaseMessage(msg);
    }

    if (currentPriority) prevPriority.current = currentPriority;
    if (currentPhase) prevPhase.current = currentPhase;
  }, [
    isActive,
    signal,
    recommendation?.priority_lane,
    signal?.phase,
    analytics,
    recommendation,
  ]);

  const greenMessage = explainGreenDuration(recommendation);

  return {
    laneChangeMessage,
    phaseMessage,
    greenMessage,
    priorityExplanation: null,
  };
}
