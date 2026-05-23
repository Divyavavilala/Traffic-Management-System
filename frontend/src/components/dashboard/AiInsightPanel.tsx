"use client";

import { Bot, Info, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AiInsight } from "@/lib/ai-insights";
import clsx from "clsx";

interface AiInsightPanelProps {
  insights: AiInsight[];
  signalExplanation?: string | null;
}

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  action: Sparkles,
};

const STYLES = {
  info: "border-cyan-500/20 bg-cyan-500/5",
  success: "border-emerald-500/20 bg-emerald-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  action: "border-violet-500/20 bg-violet-500/5",
};

export function AiInsightPanel({
  insights,
  signalExplanation,
}: AiInsightPanelProps) {
  return (
    <section className="glass-card p-5 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
          <Bot className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h2 className="section-title">AI insights</h2>
          <p className="section-subtitle">
            Plain-language explanations of what the system is doing
          </p>
        </div>
      </div>

      {signalExplanation && (
        <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold text-amber-700 dark:text-amber-300">
            Latest signal decision
          </p>
          <p className="mt-1 text-foreground-muted">{signalExplanation}</p>
        </div>
      )}

      <ul className="space-y-3">
        {insights.map((insight) => {
          const Icon = ICONS[insight.type];
          return (
            <li
              key={insight.id}
              className={clsx(
                "flex gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
                STYLES[insight.type],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {insight.title}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground-muted">
                  {insight.message}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
