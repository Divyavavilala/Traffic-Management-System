"use client";

import {
  Brain,
  Car,
  Loader2,
  Radio,
  TrafficCone,
  Zap,
} from "lucide-react";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import clsx from "clsx";

type PipelineStage =
  | "connecting"
  | "detecting"
  | "congestion"
  | "optimizing"
  | "updating";

const STAGES: {
  id: PipelineStage;
  label: string;
  icon: typeof Car;
}[] = [
  { id: "connecting", label: "Connecting live AI monitoring…", icon: Radio },
  { id: "detecting", label: "Detecting vehicles in the video…", icon: Car },
  { id: "congestion", label: "Calculating congestion by lane…", icon: TrafficCone },
  { id: "optimizing", label: "Optimizing traffic signal timing…", icon: Brain },
  { id: "updating", label: "Updating adaptive intersection control…", icon: Zap },
];

function resolveStage(
  connectionState: ConnectionState,
  frameId: number,
  vehicleCount: number,
  signalActive: boolean,
): PipelineStage {
  if (connectionState === "connecting") return "connecting";
  if (frameId < 2 || vehicleCount === 0) return "detecting";
  if (!signalActive) return "congestion";
  if (vehicleCount > 0 && signalActive) return "updating";
  return "optimizing";
}

interface ProcessingPipelineProps {
  connectionState: ConnectionState;
  frameId: number;
  vehicleCount: number;
  signalActive: boolean;
  visible: boolean;
}

export function ProcessingPipeline({
  connectionState,
  frameId,
  vehicleCount,
  signalActive,
  visible,
}: ProcessingPipelineProps) {
  if (!visible) return null;

  const current = resolveStage(
    connectionState,
    frameId,
    vehicleCount,
    signalActive,
  );
  const currentIndex = STAGES.findIndex((s) => s.id === current);

  return (
    <div className="glass-card animate-fade-in border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            AI analyzing traffic flow…
          </p>
          <p className="text-xs text-foreground-muted">
            This usually takes a few seconds after the stream starts
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {STAGES.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const Icon = stage.icon;

          return (
            <li
              key={stage.id}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300",
                active && "bg-cyan-500/10 ring-1 ring-cyan-500/25",
                done && "text-foreground-muted",
                !done && !active && "text-foreground-subtle opacity-50",
              )}
            >
              <Icon
                className={clsx(
                  "h-4 w-4 shrink-0",
                  active && "text-cyan-500",
                  done && "text-emerald-500",
                )}
              />
              <span className={clsx(active && "font-medium text-foreground")}>
                {stage.label}
              </span>
              {active && (
                <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-cyan-500" />
              )}
              {done && (
                <span className="ml-auto text-[10px] font-semibold uppercase text-emerald-500">
                  Done
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
