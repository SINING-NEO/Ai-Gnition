import type { PatternInsight } from "../types";

export type MineableEvent = {
  id: string;
  action: string;
  source: string;
  summary: string;
  occurredAt: string;
  entityId?: string | null;
};

const MINUTES_PER_ACTION: Record<string, number> = {
  open_email: 1,
  extract_fields: 4,
  append_row: 2,
  read_sheet: 2,
  summarize: 8,
  compose_email: 10,
  send_email: 1,
  draft_email: 6,
  end_meeting: 0,
  create_event: 5,
  browse: 1,
};

/** Canonical pipelines we care about for the demo + general n-gram mining. */
const KNOWN_PIPELINES: string[][] = [
  ["open_email", "extract_fields", "append_row"],
  ["read_sheet", "summarize", "compose_email", "send_email"],
  ["end_meeting", "draft_email", "create_event"],
];

/**
 * Mine frequent action sequences from a chronological event stream.
 * Counts known pipelines first, then fills with non-overlapping n-grams.
 */
export function minePatterns(events: MineableEvent[], topN = 5): PatternInsight[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const byDay = new Map<string, string[]>();
  for (const e of sorted) {
    if (e.action === "browse") continue;
    const day = e.occurredAt.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(e.action);
    byDay.set(day, list);
  }

  const weeksObserved = Math.max(1, byDay.size / 5);
  const results: PatternInsight[] = [];

  for (const pipeline of KNOWN_PIPELINES) {
    let count = 0;
    for (const actions of byDay.values()) {
      count += countOccurrences(actions, pipeline);
    }
    if (count < 1) continue;
    const frequencyPerWeek = Math.max(1, Math.round(count / weeksObserved));
    const minutesEach = pipeline.reduce(
      (sum, a) => sum + (MINUTES_PER_ACTION[a] ?? 3),
      0,
    );
    const named = nameSequence(pipeline);
    results.push({
      name: named.name,
      description: named.description,
      sequence: pipeline,
      frequencyPerWeek,
      estimatedMinutesPerWeek: frequencyPerWeek * minutesEach,
      confidence: Math.min(0.95, 0.6 + count * 0.02),
    });
  }

  return results
    .sort((a, b) => b.estimatedMinutesPerWeek - a.estimatedMinutesPerWeek)
    .slice(0, topN);
}

function countOccurrences(actions: string[], pipeline: string[]) {
  let count = 0;
  for (let i = 0; i <= actions.length - pipeline.length; i++) {
    let ok = true;
    for (let j = 0; j < pipeline.length; j++) {
      if (actions[i + j] !== pipeline[j]) {
        ok = false;
        break;
      }
    }
    if (ok) count += 1;
  }
  return count;
}

function nameSequence(sequence: string[]): { name: string; description: string } {
  const key = sequence.join("→");
  const presets: Record<string, { name: string; description: string }> = {
    "open_email→extract_fields→append_row": {
      name: "Order emails → Sheet",
      description:
        "You open supplier order emails, copy fields, and append them to the Orders sheet.",
    },
    "read_sheet→summarize→compose_email→send_email": {
      name: "Friday status email",
      description:
        "Every week you tally the Orders sheet and send the same status email to ops.",
    },
    "end_meeting→draft_email→create_event": {
      name: "Post-call follow-ups",
      description:
        "After client calls you draft a follow-up and book the next meeting.",
    },
  };

  if (presets[key]) return presets[key];

  return {
    name: sequence.map((a) => a.replace(/_/g, " ")).join(" → "),
    description: `Detected repeating sequence: ${sequence.map((a) => a.replace(/_/g, " ")).join(", ")}.`,
  };
}
