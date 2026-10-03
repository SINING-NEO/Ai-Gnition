import { getDb, schema } from "../db";
import { listPatterns } from "./pattern-hunter";
import { totalMinutesSaved } from "./executor";
import { generateText } from "./gemini";
import { uid, nowIso, formatHours } from "../utils";

export function getStats() {
  const patterns = listPatterns();
  const potentialMinutes = patterns.reduce(
    (sum, p) => sum + p.estimatedMinutesPerWeek,
    0,
  );
  const savedMinutes = totalMinutesSaved();
  const db = getDb();
  const eventCount = db.select().from(schema.events).all().length;
  const workflowCount = db.select().from(schema.workflows).all().length;
  const runCount = db.select().from(schema.runs).all().length;

  return {
    eventCount,
    patternCount: patterns.length,
    workflowCount,
    runCount,
    potentialMinutesPerWeek: potentialMinutes,
    potentialHoursLabel: formatHours(potentialMinutes),
    savedMinutes,
    savedHoursLabel: formatHours(savedMinutes),
  };
}

export async function weeklyInsight() {
  const stats = getStats();
  const patterns = listPatterns().slice(0, 3);
  const fallback = {
    title: "This week's reclaimable time",
    body: `OneLastThing spotted ${stats.patternCount} repeating loops worth ~${stats.potentialHoursLabel}/week. Top candidate: ${patterns[0]?.name ?? "none yet"}. You've already reclaimed ${stats.savedHoursLabel}.`,
  };

  const text = await generateText({
    system: "You write a crisp 2-sentence weekly insight for a productivity agent product. No markdown.",
    prompt: JSON.stringify({ stats, topPatterns: patterns }),
  });

  const insight = text
    ? { title: "Weekly insight", body: text }
    : fallback;

  const db = getDb();
  const row = {
    id: uid("ins"),
    kind: "weekly",
    title: insight.title,
    body: insight.body,
    createdAt: nowIso(),
  };
  db.insert(schema.insights).values(row).run();
  return row;
}
