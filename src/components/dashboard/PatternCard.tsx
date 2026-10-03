"use client";

import { formatHours } from "@/lib/utils";

export type PatternCardData = {
  id: string;
  name: string;
  description: string;
  sequence: string[];
  frequencyPerWeek: number;
  estimatedMinutesPerWeek: number;
  confidence: number;
  status: string;
};

export function PatternCard({
  pattern,
  onAutomate,
  busy,
}: {
  pattern: PatternCardData;
  onAutomate: (id: string) => void;
  busy?: boolean;
}) {
  const label =
    pattern.status === "automated"
      ? "Run again"
      : pattern.status === "automating"
        ? "Continue"
        : "Automate";

  return (
    <article className="group flex flex-col border-b border-white/10 py-6 last:border-b-0 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-fog md:text-3xl">
            {pattern.name}
          </h3>
          <span className="text-xs uppercase tracking-[0.16em] text-leaf">
            {pattern.frequencyPerWeek}×/week · {formatHours(pattern.estimatedMinutesPerWeek)}
          </span>
        </div>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-mist/90">
          {pattern.description}
        </p>
        <p className="mt-3 font-mono text-xs text-mist/50">
          {pattern.sequence.join(" → ")}
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => onAutomate(pattern.id)}
        className="mt-4 shrink-0 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-hot disabled:cursor-not-allowed disabled:opacity-50 md:mt-0 animate-pulse-glow disabled:animate-none"
      >
        {busy ? "Architecting…" : label}
      </button>
    </article>
  );
}
