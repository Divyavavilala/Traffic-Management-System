"use client";

import { useEffect, useRef, useState } from "react";

export interface UseSignalCountdownOptions {
  /** Stable identity: phase + active lane (+ emergency when it resets the timer). */
  phaseKey: string;
  /** Server countdown — applied only when `phaseKey` changes. */
  initialSeconds: number;
  inactive?: boolean;
}

/**
 * Local 1 Hz countdown independent of high-frequency WebSocket analytics frames.
 * Resets only when `phaseKey` changes (signal phase / lane / emergency transition).
 */
export function useSignalCountdown({
  phaseKey,
  initialSeconds,
  inactive = false,
}: UseSignalCountdownOptions): number {
  const [displaySec, setDisplaySec] = useState(() =>
    Math.max(0, initialSeconds),
  );
  const phaseKeyRef = useRef(phaseKey);

  useEffect(() => {
    if (phaseKeyRef.current !== phaseKey) {
      phaseKeyRef.current = phaseKey;
      setDisplaySec(Math.max(0, initialSeconds));
    }
  }, [phaseKey, initialSeconds]);

  useEffect(() => {
    if (inactive) return;

    const interval = window.setInterval(() => {
      setDisplaySec((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [inactive, phaseKey]);

  if (inactive) {
    return 0;
  }

  return displaySec;
}
