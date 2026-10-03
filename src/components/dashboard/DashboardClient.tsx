"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { PatternCard, type PatternCardData } from "./PatternCard";
import { TimeMeter } from "./TimeMeter";
import { StatTiles } from "./StatTiles";
import { ActivityFeed } from "./ActivityFeed";
import { Highlight } from "@/components/ui/Squiggle";

type Stats = {
  potentialMinutesPerWeek: number;
  savedMinutes: number;
  eventCount: number;
  patternCount: number;
  workflowCount: number;
  runCount: number;
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

  async function reseed() {
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
      router.push(wf.status === "pending_approval" ? `/approve/${wf.id}` : `/studio/${wf.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automate failed");
      setBusyId(null);
    }
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-10">
      <section className="animate-rise flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium md:text-4xl">Hi, Priya!</h1>
          <p className="mt-1 text-sm text-muted">{today}</p>
        </div>
        <span className="icon-dot bg-surface">
          <Bell className="h-5 w-5 text-muted" />
        </span>
      </section>

      <section className="animate-rise grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h2 className="font-display max-w-xl text-4xl font-normal leading-[1.15] md:text-5xl">
            Stop doing the same thing <Highlight>twice</Highlight>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
            OneLastThing notices the routine you stopped seeing, then agents{" "}
            <span className="text-violet">propose, build and run</span> the automation.
            You only approve.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void reseed()}
              disabled={pending || loading}
              className="btn btn-primary"
            >
              {pending ? "Loading week…" : "Load Priya's week"}
            </button>
            <Link href="/chat" className="btn btn-ghost">
              Ask in plain English
            </Link>
          </div>
        </div>
        {stats && (
          <TimeMeter
            potentialMinutes={stats.potentialMinutesPerWeek}
            savedMinutes={stats.savedMinutes}
          />
        )}
      </section>

      {stats && (
        <section className="animate-rise-delay-1">
          <StatTiles stats={stats} />
        </section>
      )}

      {error && (
        <p className="rounded-2xl bg-orange/15 px-4 py-3 text-sm text-orange">{error}</p>
      )}

      <section className="animate-rise-delay-2">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-medium">
            Detected <span className="text-violet">patterns</span>
          </h2>
          <span className="text-sm text-muted">
            {loading ? "Scanning…" : `${patterns.length} loops this week`}
          </span>
        </div>
        {loading && <p className="card p-6 text-muted">Mining activity sequences…</p>}
        {!loading && patterns.length === 0 && (
          <p className="card p-6 text-muted">
            No patterns yet. Load Priya&apos;s week to begin.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
