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
  const done = pattern.status === "automated";

  return (
    <article className="card flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-medium">{pattern.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{pattern.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl font-medium text-lime">
            {formatHours(pattern.estimatedMinutesPerWeek)}
          </p>
          <p className="text-xs text-muted">{pattern.frequencyPerWeek}× / week</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {pattern.sequence.map((step) => (
          <span key={step} className="chip">
            {step.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      <button
        type="button"
        data-testid={`automate-${pattern.id}`}
        disabled={busy}
        onClick={() => onAutomate(pattern.id)}
        className={`btn w-full ${done ? "btn-ghost" : "btn-primary"}`}
      >
        {busy ? "Architecting…" : label}
      </button>
    </article>
  );
}
