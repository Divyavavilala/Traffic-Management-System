"use client";

import { Play, Square, Wifi, WifiOff } from "lucide-react";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import { WS_URL } from "@/lib/config";
import clsx from "clsx";

interface ConnectionBarProps {
  connectionState: ConnectionState;
  error: string | null;
  isActive: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionBar({
  connectionState,
  error,
  isActive,
  onConnect,
  onDisconnect,
}: ConnectionBarProps) {
  const busy = connectionState === "connecting";

  return (
    <div className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          WebSocket endpoint
        </p>
        <p className="truncate font-mono text-sm text-zinc-300">{WS_URL}</p>
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onConnect}
          disabled={busy || isActive}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
            "bg-accent text-surface hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Play className="h-4 w-4" />
          Start stream
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={!isActive && connectionState !== "error"}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition",
            "hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Square className="h-4 w-4" />
          Stop
        </button>
      </div>

      <div className="hidden items-center gap-2 text-zinc-500 sm:flex">
        {isActive ? (
          <Wifi className="h-4 w-4 text-emerald-400" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className="text-xs">
          {busy ? "Opening camera…" : "Backend must be running on :8000"}
        </span>
      </div>
    </div>
  );
}
