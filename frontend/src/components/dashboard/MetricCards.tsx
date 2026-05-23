"use client";

import { Car, Gauge, Zap } from "lucide-react";
import { congestionLevel } from "@/lib/config";
import type { TrafficAnalytics } from "@/lib/types";
import clsx from "clsx";

interface MetricCardsProps {
  analytics: TrafficAnalytics;
  isActive: boolean;
}

export function MetricCards({ analytics, isActive }: MetricCardsProps) {
  const level = congestionLevel(analytics.weighted_traffic_score);
  const hasVehicles = analytics.vehicle_count > 0;

  const cards = [
    {
      label: "Overall congestion",
      value: hasVehicles ? level.label : "—",
      sub: hasVehicles
        ? "How busy the intersection is right now"
        : isActive
          ? "Waiting for vehicles"
          : "Start monitoring to see status",
      subColor: hasVehicles ? level.color : undefined,
      icon: Gauge,
      gradient: "from-cyan-500/15 via-transparent to-transparent",
      iconColor: "text-cyan-500",
    },
    {
      label: "Vehicles on screen",
      value: String(analytics.vehicle_count),
      sub: hasVehicles
        ? "Detected in the current video frame"
        : isActive
          ? "No traffic detected yet"
          : "—",
      icon: Car,
      gradient: "from-violet-500/15 via-transparent to-transparent",
      iconColor: "text-violet-500",
    },
    {
      label: "AI processing speed",
      value: analytics.fps > 0 ? `${analytics.fps.toFixed(0)} fps` : "—",
      sub:
        analytics.fps >= 20
          ? "Running smoothly"
          : analytics.fps > 0
            ? "Slightly slower — still analyzing"
            : isActive
              ? "Starting up…"
              : "—",
      icon: Zap,
      gradient: "from-amber-500/15 via-transparent to-transparent",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={clsx(
            "glass-card group relative overflow-hidden p-5",
            `bg-gradient-to-br ${card.gradient}`,
          )}
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              {card.label}
            </p>
            <card.icon className={clsx("h-4 w-4 opacity-80", card.iconColor)} />
          </div>
          <p className="metric-value mt-3">{card.value}</p>
          <p
            className="mt-1 text-sm font-medium"
            style={card.subColor ? { color: card.subColor } : undefined}
          >
            {!card.subColor && (
              <span className="text-foreground-muted">{card.sub}</span>
            )}
            {card.subColor && card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
