"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Square } from "lucide-react";
import { AiInsightPanel } from "@/components/dashboard/AiInsightPanel";
import { CongestionChart, FpsChart } from "@/components/dashboard/CongestionChart";
import { CongestionStatusBanner } from "@/components/dashboard/CongestionStatusBanner";
import { DemoUploadPanel } from "@/components/dashboard/DemoUploadPanel";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { LiveStreamPanel } from "@/components/dashboard/LiveStreamPanel";
import { MetricCards } from "@/components/dashboard/MetricCards";
import {
  ModeSelector,
  type InputModeChoice,
} from "@/components/dashboard/ModeSelector";
import { Navbar } from "@/components/dashboard/Navbar";
import { LaneTrafficPanel } from "@/components/dashboard/LaneTrafficPanel";
import { PriorityLaneCard } from "@/components/dashboard/PriorityLaneCard";
import { ProcessingPipeline } from "@/components/dashboard/ProcessingPipeline";
import { StepProgress, resolveUserStep } from "@/components/dashboard/StepProgress";
import { UserGuidance } from "@/components/dashboard/UserGuidance";
import { VehicleCounters } from "@/components/dashboard/VehicleCounters";
import { SignalDisplay } from "@/components/signals/SignalDisplay";
import { useSignalChangeTracker } from "@/hooks/useSignalChangeTracker";
import { useTrafficWebSocket } from "@/hooks/useTrafficWebSocket";
import { buildAiInsights } from "@/lib/ai-insights";
import { resolveSignalUiMode } from "@/lib/signal-types";
import type { DemoSessionInfo } from "@/lib/types";

export default function DashboardPage() {
  const {
    connectionState,
    error,
    frameSrc,
    analytics,
    frameId,
    history,
    signal,
    recommendation,
    streamMode,
    demoComplete,
    connectLive,
    connectDemo,
    disconnect,
    isActive,
  } = useTrafficWebSocket();

  const [inputMode, setInputMode] = useState<InputModeChoice | null>(null);
  const [pendingDemo, setPendingDemo] = useState<DemoSessionInfo | null>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleStartSimulation = useCallback(() => {
    if (pendingDemo) connectDemo(pendingDemo);
  }, [pendingDemo, connectDemo]);

  const handleClearDemo = useCallback(() => {
    setPendingDemo(null);
  }, []);

  const handleSelectLive = useCallback(() => {
    setInputMode("live");
    connectLive();
  }, [connectLive]);

  const handleFocusUpload = useCallback(() => {
    setInputMode("demo");
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const isSimulating = isActive && streamMode === "demo";

  useEffect(() => {
    if (isActive && streamMode === "demo") setInputMode("demo");
    if (isActive && streamMode === "live") setInputMode("live");
  }, [isActive, streamMode]);
  const signalUiMode = resolveSignalUiMode(isActive, signal);
  const signalActive = signalUiMode === "active";

  const { laneChangeMessage, phaseMessage, greenMessage } =
    useSignalChangeTracker(signal, recommendation, analytics, isActive);

  const signalExplanation =
    laneChangeMessage ?? phaseMessage ?? greenMessage ?? null;

  const insights = useMemo(
    () =>
      buildAiInsights({
        isActive,
        analytics,
        signal,
        recommendation,
        streamMode,
        frameId,
        laneChangeMessage,
        greenMessage,
      }),
    [
      isActive,
      analytics,
      signal,
      recommendation,
      streamMode,
      frameId,
      laneChangeMessage,
      greenMessage,
    ],
  );

  const currentStep = resolveUserStep({
    isActive,
    inputMode,
    hasPendingDemo: !!pendingDemo,
    connectionState,
    frameId,
    vehicleCount: analytics.vehicle_count,
    signalActive,
  });

  const showProcessing =
    isActive && (connectionState === "connecting" || frameId < 10);

  const showIdleSetup = !isActive;

  return (
    <>
      <Navbar connectionState={connectionState} streamMode={streamMode} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="space-y-2 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Smart Traffic Control Center
          </h1>
          <p className="max-w-2xl text-sm text-foreground-muted sm:text-base">
            AI watches traffic, measures congestion on each road, and adjusts
            intersection signals automatically — no traffic engineering degree
            required.
          </p>
        </header>

        <StepProgress currentStep={currentStep} />

        {showIdleSetup && (
          <>
            <GettingStarted
              inputMode={inputMode}
              onSelectLive={handleSelectLive}
              onFocusUpload={handleFocusUpload}
              hasUploadedVideo={!!pendingDemo}
            />
            <div className="flex justify-center sm:justify-start">
  <a
    href="https://huggingface.co/spaces/diviy-123/ai-smart-traffic-demo"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-orange-600 hover:scale-[1.02]"
  >
    Launch Public AI Demo
  </a>
</div>
            <ModeSelector
              selected={inputMode}
              onSelect={setInputMode}
              disabled={isActive}
            />
            <UserGuidance variant="idle" />
          </>
        )}

        {inputMode === "demo" && !isActive && (
          <div ref={uploadRef} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Step 2 — Upload your traffic video
            </h2>
            <p className="text-sm text-foreground-muted">
              The AI detects vehicles and calculates congestion — signal timings
              adapt to what appears in your footage.
            </p>
            <DemoUploadPanel
              disabled={isActive}
              session={pendingDemo}
              onSessionReady={setPendingDemo}
              onClearSession={handleClearDemo}
              onStartSimulation={handleStartSimulation}
              isSimulating={isSimulating}
              demoComplete={demoComplete}
            />
          </div>
        )}

        {inputMode === "live" && !isActive && !error && (
          <div className="glass-card flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-foreground-muted">
              Ready for live AI monitoring from your camera.
            </p>
            <button type="button" onClick={handleSelectLive} className="btn-primary">
              Start live camera now
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isActive && (
          <>
            {showProcessing && (
              <ProcessingPipeline
                connectionState={connectionState}
                frameId={frameId}
                vehicleCount={analytics.vehicle_count}
                signalActive={signalActive}
                visible
              />
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={disconnect}
                className="btn-secondary text-sm"
              >
                <Square className="h-4 w-4" />
                Stop monitoring
              </button>
            </div>

            <LiveStreamPanel
              frameSrc={frameSrc}
              frameId={frameId}
              isActive={isActive}
              streamMode={streamMode}
              demoComplete={demoComplete}
            />

            <CongestionStatusBanner
              analytics={analytics}
              isActive={isActive}
              priorityLane={
                recommendation?.priority_lane ?? analytics.priority_lane
              }
              activeLane={signal?.active_lane}
              greenSeconds={recommendation?.green_duration_sec ?? null}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <PriorityLaneCard
                recommendation={recommendation}
                activeLane={signal?.active_lane}
                isActive={isActive}
              />
              <AiInsightPanel
                insights={insights}
                signalExplanation={signalExplanation}
              />
            </div>

            <SignalDisplay
              signal={signal}
              recommendation={recommendation}
              isActive={isActive}
            />

            <UserGuidance variant="active" />

            <details className="glass-card group">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-foreground-muted transition hover:text-foreground">
                <span className="group-open:hidden">
                  Show detailed analytics charts ▾
                </span>
                <span className="hidden group-open:inline">
                  Hide detailed analytics charts ▴
                </span>
              </summary>
              <div className="space-y-6 border-t border-[var(--glass-border)] p-5">
                <MetricCards analytics={analytics} isActive={isActive} />
                <div className="grid gap-6 lg:grid-cols-3">
                  <LaneTrafficPanel
                    analytics={analytics}
                    priorityLane={
                      recommendation?.priority_lane ?? analytics.priority_lane
                    }
                    activeLane={signal?.active_lane}
                    isActive={isActive}
                  />
                  <div className="lg:col-span-2 space-y-6">
                    <VehicleCounters analytics={analytics} isActive={isActive} />
                    <div className="grid gap-6 lg:grid-cols-3">
                      <CongestionChart history={history} isActive={isActive} />
                      <FpsChart history={history} isActive={isActive} />
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </>
        )}

        <footer className="border-t border-[var(--glass-border)] pt-8 text-center text-xs text-foreground-subtle">
          AI Smart Traffic Optimization · Adaptive signals powered by live
          vehicle detection
        </footer>
      </main>
    </>
  );
}
