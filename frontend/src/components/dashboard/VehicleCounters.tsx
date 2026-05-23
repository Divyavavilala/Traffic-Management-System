"use client";

import { Bike, Bus, Car, Truck } from "lucide-react";
import {
  CLASS_COLORS,
  CLASS_LABELS,
  VEHICLE_CLASSES,
  type TrafficAnalytics,
  type VehicleClass,
} from "@/lib/types";
import clsx from "clsx";

const ICONS: Record<VehicleClass, typeof Car> = {
  car: Car,
  motorbike: Bike,
  bus: Bus,
  truck: Truck,
};

interface VehicleCountersProps {
  analytics: TrafficAnalytics;
  isActive: boolean;
}

export function VehicleCounters({ analytics, isActive }: VehicleCountersProps) {
  const counts = analytics.counts_by_class ?? {};
  const total = analytics.vehicle_count;

  return (
    <section className="glass-card p-5 animate-fade-in">
      <h2 className="section-title">Types of vehicles</h2>
      <p className="section-subtitle">
        {total > 0
          ? `${total} vehicle${total !== 1 ? "s" : ""} spotted in this frame`
          : isActive
            ? "No traffic detected"
            : "Counts appear during monitoring"}
      </p>

      <ul className="mt-5 space-y-4">
        {VEHICLE_CLASSES.map((cls) => {
          const count = counts[cls] ?? 0;
          const Icon = ICONS[cls];
          const color = CLASS_COLORS[cls];
          const max = Math.max(
            total,
            ...VEHICLE_CLASSES.map((c) => counts[c] ?? 0),
            1,
          );
          const pct = (count / max) * 100;

          return (
            <li key={cls}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </span>
                  <span className="text-sm font-medium text-foreground-muted">
                    {CLASS_LABELS[cls]}
                  </span>
                </div>
                <span
                  className={clsx(
                    "text-lg font-bold tabular-nums",
                    count > 0 ? "text-foreground" : "text-foreground-subtle",
                  )}
                >
                  {count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-overlay">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                    opacity: count > 0 ? 1 : 0.2,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
