import { WS_URL } from "@/lib/config";
import type { StreamInputMode } from "@/lib/types";

export function buildTrafficWsUrl(
  mode: StreamInputMode,
  sessionId?: string | null,
): string {
  const base = WS_URL.replace(/\/$/, "");
  if (mode === "demo" && sessionId) {
    const params = new URLSearchParams({
      mode: "demo",
      session_id: sessionId,
    });
    return `${base}?${params.toString()}`;
  }
  const params = new URLSearchParams({ mode: "live" });
  return `${base}?${params.toString()}`;
}
