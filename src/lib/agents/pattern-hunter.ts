import { getDb, schema } from "../db";
import { minePatterns } from "../patterns/mine";
import { listEvents } from "./observer";
import { generateJson } from "./gemini";
import { uid, nowIso } from "../utils";
import type { PatternInsight } from "../types";

export async function detectAndStorePatterns() {
  const events = listEvents(1000);
  const mined = minePatterns(
    events.map((e) => ({
      id: e.id,
      action: e.action,
      source: e.source,
      summary: e.summary,
      occurredAt: e.occurredAt,
      entityId: e.entityId,
    })),
  );

  const enriched = await enrichWithGemini(mined);
  const db = getDb();

  // Replace previous detections for a clean demo
  db.delete(schema.patterns).run();

  const createdAt = nowIso();
  const rows = enriched.map((p) => ({
    id: uid("pat"),
    name: p.name,
    description: p.description,
    sequence: JSON.stringify(p.sequence),
    frequencyPerWeek: p.frequencyPerWeek,
    estimatedMinutesPerWeek: p.estimatedMinutesPerWeek,
    confidence: p.confidence,
    status: "detected",
    createdAt,
  }));

  for (const row of rows) {
    db.insert(schema.patterns).values(row).run();
  }

  return rows.map((r) => ({
    ...r,
    sequence: JSON.parse(r.sequence) as string[],
  }));
}

async function enrichWithGemini(patterns: PatternInsight[]): Promise<PatternInsight[]> {
  if (!patterns.length) return patterns;

  const result = await generateJson<{ patterns: PatternInsight[] }>({
    system:
      "You refine detected work patterns for an ops worker named Priya. Keep names short and punchy. Return JSON { patterns: [...] } matching the input shape.",
    prompt: JSON.stringify({ patterns }),
  });

  if (!result?.patterns?.length) return patterns;

  return patterns.map((p, i) => {
    const r = result.patterns[i];
    if (!r) return p;
    return {
      ...p,
      name: r.name || p.name,
      description: r.description || p.description,
      estimatedMinutesPerWeek: r.estimatedMinutesPerWeek ?? p.estimatedMinutesPerWeek,
    };
  });
}

export function listPatterns() {
  const db = getDb();
  return db
    .select()
    .from(schema.patterns)
    .all()
    .map((r) => ({
      ...r,
      sequence: JSON.parse(r.sequence) as string[],
    }))
    .sort((a, b) => b.estimatedMinutesPerWeek - a.estimatedMinutesPerWeek);
}
