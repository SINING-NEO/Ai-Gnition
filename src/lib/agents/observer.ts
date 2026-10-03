import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "../db";
import { ActivityEventSchema, type ActivityEvent } from "../types";
import { uid, nowIso } from "../utils";

/** Normalise and persist inbound activity events. */
export function ingestEvents(raw: unknown[]) {
  const db = getDb();
  const createdAt = nowIso();
  const inserted = [];

  for (const item of raw) {
    const parsed = ActivityEventSchema.safeParse(item);
    if (!parsed.success) continue;
    const e = parsed.data;
    const row = {
      id: e.id ?? uid("evt"),
      source: e.source,
      action: e.action,
      entityType: e.entityType ?? null,
      entityId: e.entityId ?? null,
      summary: e.summary,
      metadata: e.metadata ? JSON.stringify(e.metadata) : null,
      occurredAt: e.occurredAt,
      createdAt,
    };
    db.insert(schema.events).values(row).run();
    inserted.push(row);
  }

  return inserted;
}

export function listEvents(limit = 200) {
  const db = getDb();
  return db
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.occurredAt))
    .limit(limit)
    .all();
}

export function getEventCount() {
  const db = getDb();
  return db.select().from(schema.events).all().length;
}

export function toActivityEvent(row: typeof schema.events.$inferSelect): ActivityEvent {
  return {
    id: row.id,
    source: row.source as ActivityEvent["source"],
    action: row.action,
    entityType: row.entityType ?? undefined,
    entityId: row.entityId ?? undefined,
    summary: row.summary,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : undefined,
    occurredAt: row.occurredAt,
  };
}

export function clearEvents() {
  const db = getDb();
  db.delete(schema.events).run();
}

export function markPatternStatus(id: string, status: string) {
  const db = getDb();
  db.update(schema.patterns)
    .set({ status })
    .where(eq(schema.patterns.id, id))
    .run();
}
