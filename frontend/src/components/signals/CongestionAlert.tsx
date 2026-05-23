"use client";

import { AlertTriangle, Info, Radio } from "lucide-react";
import {
  CONGESTION_COLORS,
  CONGESTION_LABELS,
  STATUS_MESSAGES,
  type CongestionLevel,
  type SignalUiMode,
} from "@/lib/signal-types";
interface CongestionAlertProps {
  uiMode: SignalUiMode;
  level: CongestionLevel;
  statusMessage: string;
  message: string | null;
  emergencyActive?: boolean;
}

export function CongestionAlert({
  uiMode,
  level,
  statusMessage,
  message,
  emergencyActive,
}: CongestionAlertProps) {
  if (uiMode === "no_stream") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-overlay px-4 py-3 text-sm text-zinc-400">
        <Info className="h-4 w-4 shrink-0 text-zinc-500" />
        {STATUS_MESSAGES.no_stream}
      </div>
    );
  }

  if (uiMode === "no_traffic") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-400">
        <Radio className="h-4 w-4 shrink-0 text-zinc-500" />
        {STATUS_MESSAGES.no_traffic}
      </div>
    );
  }

  const isSevere = level === "severe" || level === "heavy";
  const color = CONGESTION_COLORS[level];

  if (emergencyActive) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold text-red-400">Emergency override</p>
          {message && <p className="mt-1 text-zinc-400">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      <div>
        <p className="font-semibold text-emerald-400">{statusMessage}</p>
        {(message || level !== "low") && (
          <p className="mt-1 text-zinc-400">
            {message ?? CONGESTION_LABELS[level]}
          </p>
        )}
      </div>
      {!message && level === "low" && (
        <span className="ml-auto text-xs" style={{ color }}>
          {CONGESTION_LABELS.low}
        </span>
      )}
      {isSevere && message && (
        <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400" />
      )}
    </div>
  );
}
