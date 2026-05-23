export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  "ws://localhost:8000/api/v1/ws/traffic";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const CHART_HISTORY_LENGTH = 60;

export function congestionLevel(score: number): {
  label: string;
  color: string;
} {
  if (score < 3) return { label: "Low", color: "#34d399" };
  if (score < 8) return { label: "Moderate", color: "#fbbf24" };
  if (score < 15) return { label: "High", color: "#fb923c" };
  return { label: "Critical", color: "#f87171" };
}
