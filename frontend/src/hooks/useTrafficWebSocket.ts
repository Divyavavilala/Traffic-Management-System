"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHART_HISTORY_LENGTH } from "@/lib/config";
import { buildTrafficWsUrl } from "@/lib/stream-url";
import { signalPhaseKey } from "@/lib/signal-phase-key";
import type {
  SignalRecommendation,
  SignalState,
} from "@/lib/signal-types";
import type {
  ChartPoint,
  DemoSessionInfo,
  FrameMessage,
  StreamInputMode,
  StreamMode,
  TrafficAnalytics,
  WsMessage,
} from "@/lib/types";

export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "streaming"
  | "error"
  | "closed";

const EMPTY_ANALYTICS: TrafficAnalytics = {
  vehicle_count: 0,
  weighted_traffic_score: 0,
  counts_by_class: {},
  counts_by_lane: {},
  scores_by_lane: {},
  priority_lane: null,
  fps: 0,
};

export function useTrafficWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [analytics, setAnalytics] =
    useState<TrafficAnalytics>(EMPTY_ANALYTICS);
  const [frameId, setFrameId] = useState(0);
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [modelName, setModelName] = useState<string | null>(null);
  const [signal, setSignal] = useState<SignalState | null>(null);
  const [recommendation, setRecommendation] =
    useState<SignalRecommendation | null>(null);
  const [streamMode, setStreamMode] = useState<StreamMode>("idle");
  const [demoSession, setDemoSession] = useState<DemoSessionInfo | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);

  /** Merge signal metadata without per-frame countdown churn. */
  const applySignalUpdate = useCallback((incoming: SignalState) => {
    setSignal((prev) => {
      if (!prev) return incoming;
      if (signalPhaseKey(prev) !== signalPhaseKey(incoming)) {
        return incoming;
      }
      return { ...incoming, countdown_sec: prev.countdown_sec };
    });
  }, []);

  const appendHistory = useCallback((msg: FrameMessage) => {
    const a = msg.analytics;
    const point: ChartPoint = {
      time: new Date(msg.timestamp_ms).toLocaleTimeString([], {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      score: a.weighted_traffic_score,
      vehicles: a.vehicle_count,
      fps: a.fps,
    };
    setHistory((prev) => {
      const next = [...prev, point];
      return next.length > CHART_HISTORY_LENGTH
        ? next.slice(-CHART_HISTORY_LENGTH)
        : next;
    });
  }, []);

  const handleMessage = useCallback(
    (raw: string) => {
      let data: WsMessage;
      try {
        data = JSON.parse(raw) as WsMessage;
      } catch {
        return;
      }

      if (data.type === "error") {
        setError(data.message);
        setConnectionState("error");
        return;
      }

      if (data.type === "status") {
        setModelName(data.model_name);
        setStreamMode(data.mode ?? (demoSession ? "demo" : "live"));
        if (data.message === "demo_complete") {
          setDemoComplete(true);
          setConnectionState("closed");
          return;
        }
        setConnectionState("streaming");
        setError(null);
        setDemoComplete(false);
        return;
      }

      if (data.type === "frame") {
        setConnectionState("streaming");
        setFrameSrc(`data:image/jpeg;base64,${data.image_base64}`);
        setAnalytics(data.analytics);
        setFrameId(data.frame_id);
        appendHistory(data);
        if (data.signal) applySignalUpdate(data.signal);
        if (data.recommendation) setRecommendation(data.recommendation);
      }

      if (data.type === "signal") {
        applySignalUpdate(data.signal);
        setRecommendation(data.recommendation);
      }
    },
    [appendHistory, applySignalUpdate, demoSession],
  );

  const openStream = useCallback(
    (mode: StreamInputMode, session?: DemoSessionInfo | null) => {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      setError(null);
      setConnectionState("connecting");
      setHistory([]);
      setDemoComplete(false);
      setStreamMode(mode);
      if (mode === "demo" && session) {
        setDemoSession(session);
      } else {
        setDemoSession(null);
      }

      const url = buildTrafficWsUrl(
        mode,
        mode === "demo" ? session?.sessionId : undefined,
      );
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState("connected");
      };

      ws.onmessage = (event) => {
        handleMessage(event.data as string);
      };

      ws.onerror = () => {
        setError("Unable to connect to traffic analysis service");
        setConnectionState("error");
      };

      ws.onclose = () => {
        setConnectionState((prev) =>
          prev === "error" ? "error" : "closed",
        );
        wsRef.current = null;
        setStreamMode("idle");
      };
    },
    [handleMessage],
  );

  const connectLive = useCallback(() => {
    openStream("live");
  }, [openStream]);

  const connectDemo = useCallback(
    (session: DemoSessionInfo) => {
      openStream("demo", session);
    },
    [openStream],
  );

  const disconnect = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "stop" }));
      ws.close();
    } else if (ws) {
      ws.close();
    }
    wsRef.current = null;
    setConnectionState("idle");
    setFrameSrc(null);
    setAnalytics(EMPTY_ANALYTICS);
    setFrameId(0);
    setSignal(null);
    setRecommendation(null);
    setStreamMode("idle");
    setDemoSession(null);
    setDemoComplete(false);
  }, []);

  useEffect(() => {
    return () => {
      const ws = wsRef.current;
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "stop" }));
        }
        ws.close();
      }
    };
  }, []);

  const isActive =
    connectionState === "connected" || connectionState === "streaming";

  return {
    connectionState,
    error,
    frameSrc,
    analytics,
    frameId,
    history,
    modelName,
    signal,
    recommendation,
    streamMode,
    demoSession,
    demoComplete,
    connectLive,
    connectDemo,
    disconnect,
    isActive,
  };
}
