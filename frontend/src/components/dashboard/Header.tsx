"use client";

import { Activity, Radio } from "lucide-react";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import clsx from "clsx";

interface HeaderProps {
  connectionState: ConnectionState;
  modelName: string | null;
}

const STATE_LABELS: Record<ConnectionState, string> = {
  idle: "Standby",
  connecting: "Connecting…",
  connected: "Connected",
  streaming: "Live",
  error: "Error",
  closed: "Disconnected",
};

export function Header({ connectionState, modelName }: HeaderProps) {
  const isLive = connectionState === "streaming";

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/30">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Real-Time AI Traffic
          </p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Optimization Dashboard
          </h1>
          {modelName && (
            <p className="mt-0.5 text-xs text-zinc-500">
              Model: <span className="text-zinc-400">{modelName}</span>
            </p>
          )}
        </div>
      </div>

      <div
        className={clsx(
          "inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm font-medium sm:self-auto",
          isLive
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-white/10 bg-surface-overlay text-zinc-400",
        )}
      >
        <Radio
          className={clsx("h-3.5 w-3.5", isLive && "animate-pulse-soft text-emerald-400")}
        />
        {STATE_LABELS[connectionState]}
      </div>
    </header>
  );
}
