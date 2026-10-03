"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PatternCard, type PatternCardData } from "./PatternCard";
import { TimeMeter } from "./TimeMeter";
import { ActivityFeed } from "./ActivityFeed";

type Stats = {
  potentialMinutesPerWeek: number;
  savedMinutes: number;
  eventCount: number;
  patternCount: number;
};

type EventRow = {
  id: string;
  source: string;
  action: string;
  summary: string;
  occurredAt: string;
};

export function DashboardClient() {
  const router = useRouter();
  const [patterns, setPatterns] = useState<PatternCardData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes, eRes] = await Promise.all([
        fetch("/api/patterns"),
        fetch("/api/stats"),
        fetch("/api/events"),
      ]);
      const pJson = await pRes.json();
      const sJson = await sRes.json();
      const eJson = await eRes.json();
      setPatterns(pJson.patterns ?? []);
      setStats(sJson.stats ?? null);
      setEvents((eJson.events ?? []).slice(0, 8));
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function reseeds() {
    startTransition(async () => {
      await fetch("/api/seed", { method: "POST" });
      await load();
    });
  }

  async function automate(patternId: string) {
    setBusyId(patternId);
    setError(null);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const wf = json.workflow;
      if (wf.status === "pending_approval") {
        router.push(`/approve/${wf.id}`);
      } else {
        router.push(`/studio/${wf.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automate failed");
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="animate-rise grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-leaf">
            For Priya · Ops
          </p>
          <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-tight text-fog md:text-6xl">
            OneLastThing
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-mist">
            It notices the grind you stopped seeing — then agents propose, build,
            and run the automation. You only approve.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void reseeds()}
              disabled={pending || loading}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-fog transition hover:bg-white/10 disabled:opacity-50"
            >
              {pending ? "Seeding week…" : "Load Priya's week"}
            </button>
            <a
              href="/chat"
              className="rounded-full bg-fog px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-sand"
            >
              Ask in plain English
            </a>
          </div>
        </div>
        {stats && (
          <TimeMeter
            potentialMinutes={stats.potentialMinutesPerWeek}
            savedMinutes={stats.savedMinutes}
          />
        )}
      </section>

      {error && (
        <p className="rounded-lg border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember-hot">
          {error}
        </p>
      )}

      <section className="animate-rise-delay-2">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-fog">
            Detected patterns
          </h2>
          <span className="text-sm text-mist/70">
            {loading ? "Scanning…" : `${patterns.length} loops this week`}
          </span>
        </div>
        <div className="border-t border-white/15">
          {loading && (
            <p className="py-10 text-mist/70">Mining activity sequences…</p>
          )}
          {!loading && patterns.length === 0 && (
            <p className="py-10 text-mist/70">
              No patterns yet. Load Priya&apos;s seeded week to begin.
            </p>
          )}
          {patterns.map((p) => (
            <PatternCard
              key={p.id}
              pattern={p}
              onAutomate={automate}
              busy={busyId === p.id}
            />
          ))}
        </div>
      </section>

      <ActivityFeed events={events} />
    </div>
  );
}
