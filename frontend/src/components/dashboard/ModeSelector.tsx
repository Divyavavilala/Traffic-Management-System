"use client";

import { Camera, Film, Sparkles } from "lucide-react";
import clsx from "clsx";

export type InputModeChoice = "live" | "demo";

interface ModeSelectorProps {
  selected: InputModeChoice | null;
  onSelect: (mode: InputModeChoice) => void;
  disabled?: boolean;
}

const MODES: {
  id: InputModeChoice;
  title: string;
  description: string;
  icon: typeof Camera;
  badge: string;
}[] = [
  {
    id: "live",
    title: "Live Camera Mode",
    description:
      "Use your webcam to monitor a real intersection. The AI watches traffic and adjusts signals as conditions change.",
    icon: Camera,
    badge: "Realtime",
  },
  {
    id: "demo",
    title: "Demo Simulation Mode",
    description:
      "Upload a prerecorded traffic video (intersection footage works best). The AI replays it like a live feed for demos and presentations.",
    icon: Film,
    badge: "Upload video",
  },
];

export function ModeSelector({ selected, onSelect, disabled }: ModeSelectorProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-cyan-500" />
        <h2 className="text-lg font-semibold text-foreground">
          Step 1 — Choose how you want to monitor traffic
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODES.map((mode) => {
          const isSelected = selected === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(mode.id)}
              className={clsx(
                "glass-card group relative flex flex-col items-start gap-3 p-6 text-left transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-card-hover",
                isSelected &&
                  "ring-2 ring-cyan-500/50 bg-cyan-500/5",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <span
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  mode.id === "live"
                    ? "badge-live"
                    : "badge-demo",
                )}
              >
                {mode.badge}
              </span>
              <div
                className={clsx(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                    : "bg-surface-overlay text-foreground-muted group-hover:text-cyan-500",
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{mode.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                  {mode.description}
                </p>
              </div>
              {isSelected && (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
