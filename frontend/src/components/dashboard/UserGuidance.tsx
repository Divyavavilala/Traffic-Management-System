"use client";

import { HelpCircle, Lightbulb, MapPin, Timer } from "lucide-react";
import clsx from "clsx";

interface GuidanceCard {
  icon: typeof Lightbulb;
  title: string;
  body: string;
}

const IDLE_GUIDANCE: GuidanceCard[] = [
  {
    icon: Lightbulb,
    title: "What to upload",
    body: "Use clear footage of a traffic intersection — cars and buses visible from above or street level work best.",
  },
  {
    icon: HelpCircle,
    title: "What the AI does",
    body: "It finds vehicles in each frame, estimates how busy each approach (North, South, East, West) is, and recommends signal timing.",
  },
  {
    icon: Timer,
    title: "Why signals change",
    body: "When one lane gets congested, it receives a longer green light. When traffic eases, timing shortens automatically.",
  },
];

const ACTIVE_GUIDANCE: GuidanceCard[] = [
  {
    icon: MapPin,
    title: "Reading the feed",
    body: "Colored boxes show detected vehicles. Numbers update as traffic moves through the intersection.",
  },
  {
    icon: Timer,
    title: "Signal timing",
    body: "Green duration grows with congestion: light traffic ≈10s, heavy traffic up to 60s on the busiest lane.",
  },
  {
    icon: Lightbulb,
    title: "AI insights",
    body: "Check the insight panel below for plain-language explanations of why a lane was prioritized.",
  },
];

interface UserGuidanceProps {
  variant: "idle" | "active";
}

export function UserGuidance({ variant }: UserGuidanceProps) {
  const cards = variant === "idle" ? IDLE_GUIDANCE : ACTIVE_GUIDANCE;

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={clsx(
              "rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 backdrop-blur-sm",
              "transition hover:border-cyan-500/20",
            )}
          >
            <Icon className="mb-2 h-4 w-4 text-cyan-500" />
            <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
              {card.body}
            </p>
          </div>
        );
      })}
    </section>
  );
}
