"use client";

import { useTheme } from "@/providers/ThemeProvider";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/types";

interface CongestionChartProps {
  history: ChartPoint[];
  isActive: boolean;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-xs shadow-card backdrop-blur-xl">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
          {entry.name}:{" "}
          {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function CongestionChart({ history, isActive }: CongestionChartProps) {
  const { theme } = useTheme();
  const hasData = history.length > 1;
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const tickColor = theme === "dark" ? "#a1a1aa" : "#64748b";

  return (
    <section className="glass-card p-5 lg:col-span-2">
      <h2 className="section-title">Congestion over time</h2>
      <p className="section-subtitle">
        How busy the intersection has been during this session
      </p>

      {!hasData ? (
        <div className="mt-4 flex h-52 items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] text-sm text-foreground-subtle">
          {isActive
            ? "Building chart as traffic is analyzed…"
            : "Chart appears during monitoring"}
        </div>
      ) : (
        <div className="mt-4 h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="vehicleFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: tickColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="score"
                tick={{ fill: tickColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="vehicles"
                orientation="right"
                tick={{ fill: tickColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: tickColor }} />
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="score"
                name="Congestion level"
                stroke="#06b6d4"
                fill="url(#scoreFill)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
              <Area
                yAxisId="vehicles"
                type="monotone"
                dataKey="vehicles"
                name="Vehicles"
                stroke="#8b5cf6"
                fill="url(#vehicleFill)"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function FpsChart({ history, isActive }: CongestionChartProps) {
  const { theme } = useTheme();
  const hasData = history.length > 1;
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
  const tickColor = theme === "dark" ? "#a1a1aa" : "#64748b";

  return (
    <section className="glass-card p-5">
      <h2 className="section-title">AI processing speed</h2>
      <p className="section-subtitle">How fast the system analyzes each frame</p>

      {!hasData ? (
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-[var(--glass-border)] text-sm text-foreground-subtle">
          {isActive ? "Measuring…" : "No data yet"}
        </div>
      ) : (
        <div className="mt-4 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="fpsStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis
                domain={[0, "auto"]}
                tick={{ fill: tickColor, fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="fps"
                name="Frames per second"
                stroke="url(#fpsStroke)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
