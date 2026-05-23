"use client";

import { Moon, Sun, TrafficCone } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import type { ConnectionState } from "@/hooks/useTrafficWebSocket";
import type { StreamMode } from "@/lib/types";
import clsx from "clsx";

interface NavbarProps {
  connectionState: ConnectionState;
  streamMode: StreamMode;
}

export function Navbar({ connectionState, streamMode }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const isLive = connectionState === "streaming" && streamMode === "live";
  const isDemo = connectionState === "streaming" && streamMode === "demo";

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-cyan-500/30 shadow-glow-sm">
            <TrafficCone className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
              AI Smart Traffic
            </p>
            <p className="text-sm font-semibold text-foreground sm:text-base">
              Optimization Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLive && <span className="badge-live hidden sm:inline-flex">Live</span>}
          {isDemo && <span className="badge-demo hidden sm:inline-flex">Simulation</span>}
          {!isLive && !isDemo && connectionState === "streaming" && (
            <span className="badge-live hidden sm:inline-flex">Monitoring</span>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
              "border-[var(--glass-border)] text-foreground-muted hover:bg-surface-overlay hover:text-foreground",
            )}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
