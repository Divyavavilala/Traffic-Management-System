"use client";

import { Check } from "lucide-react";
import clsx from "clsx";

export type UserStep =
  | "choose_mode"
  | "start_source"
  | "analyzing"
  | "detections"
  | "insights";

const STEPS: { id: UserStep; label: string; short: string }[] = [
  { id: "choose_mode", label: "Choose how to monitor", short: "Mode" },
  { id: "start_source", label: "Start camera or upload video", short: "Source" },
  { id: "analyzing", label: "AI analyzes traffic", short: "Analyze" },
  { id: "detections", label: "Vehicles detected live", short: "Detect" },
  { id: "insights", label: "Congestion & lane ranking", short: "Insights" },
];

function stepIndex(step: UserStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

interface StepProgressProps {
  currentStep: UserStep;
}

export function StepProgress({ currentStep }: StepProgressProps) {
  const current = stepIndex(currentStep);

  return (
    <nav
      aria-label="Progress"
      className="glass-card overflow-x-auto p-4 sm:p-5"
    >
      <ol className="flex min-w-[640px] items-center justify-between gap-1 sm:min-w-0">
        {STEPS.map((step, index) => {
          const done = index < current;
          const active = index === current;

          return (
            <li
              key={step.id}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500",
                    done &&
                      "border-emerald-500 bg-emerald-500 text-white",
                    active &&
                      "border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 animate-glow-pulse",
                    !done &&
                      !active &&
                      "border-[var(--glass-border)] text-foreground-subtle",
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={clsx(
                    "hidden max-w-[88px] text-[10px] font-medium leading-tight sm:block",
                    active ? "text-foreground" : "text-foreground-subtle",
                  )}
                >
                  {step.short}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={clsx(
                    "mx-1 h-0.5 flex-1 rounded transition-colors duration-500",
                    index < current ? "bg-emerald-500/60" : "bg-surface-overlay",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-sm text-foreground-muted">
        Step {current + 1} of {STEPS.length}:{" "}
        <span className="font-medium text-foreground">
          {STEPS[current]?.label}
        </span>
      </p>
    </nav>
  );
}

export function resolveUserStep(params: {
  isActive: boolean;
  inputMode: "live" | "demo" | null;
  hasPendingDemo: boolean;
  connectionState: string;
  frameId: number;
  vehicleCount: number;
  signalActive: boolean;
}): UserStep {
  const {
    isActive,
    inputMode,
    hasPendingDemo,
    connectionState,
    frameId,
    vehicleCount,
    signalActive,
  } = params;

  if (!inputMode) return "choose_mode";
  if (!isActive) return "start_source";

  if (connectionState === "connecting" || frameId < 2) return "analyzing";
  if (vehicleCount === 0) return "analyzing";
  if (!signalActive) return "detections";
  return "insights";
}
