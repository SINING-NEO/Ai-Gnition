"use client";

import { formatHours } from "@/lib/utils";

export function TimeMeter({
  potentialMinutes,
  savedMinutes,
}: {
  potentialMinutes: number;
  savedMinutes: number;
}) {
  const pct = potentialMinutes
    ? Math.min(100, Math.round((savedMinutes / potentialMinutes) * 100))
    : 0;

  return (
    <div className="animate-rise-delay-1 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-5 backdrop-blur">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">
            Time reclaimed
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold text-fog">
            {formatHours(savedMinutes)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-mist/70">
            Spotted / week
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ember-hot">
            {formatHours(potentialMinutes)}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/60">
        <div
          className="meter-bar h-full rounded-full bg-gradient-to-r from-leaf to-ember"
          style={{ width: `${Math.max(pct, savedMinutes > 0 ? 8 : 0)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-mist/80">
        {savedMinutes > 0
          ? `${pct}% of this week's detected grind already automated.`
          : "Approve a workflow and watch this meter climb."}
      </p>
    </div>
  );
}
