"use client";

import { formatHours } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/ProgressRing";

export function TimeMeter({
  potentialMinutes,
  savedMinutes,
}: {
  potentialMinutes: number;
  savedMinutes: number;
}) {
  const pct = potentialMinutes
    ? Math.min(100, (savedMinutes / potentialMinutes) * 100)
    : 0;
  const leftMinutes = Math.max(0, potentialMinutes - savedMinutes);

  return (
    <div className="card animate-rise-delay-1 flex items-center justify-between gap-6 p-6">
      <div className="min-w-0">
        <p className="font-display text-2xl font-medium">Time reclaimed</p>
        <p className="mt-2 text-lg">
          <span className="font-semibold text-green">{formatHours(savedMinutes)}</span>
          <span className="text-muted"> of {formatHours(potentialMinutes)} / week</span>
        </p>
        <span className="chip mt-4">{formatHours(leftMinutes)} left to automate</span>
      </div>
      <ProgressRing value={pct} />
    </div>
  );
}
