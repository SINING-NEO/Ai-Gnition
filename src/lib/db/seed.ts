import { getDb, schema } from "./index";
import { uid, nowIso } from "../utils";

type SeedEvent = {
  source: "email" | "calendar" | "sheets" | "browser" | "manual";
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  dayOffset: number;
  hour: number;
  minute?: number;
};

type SeededEvent = SeedEvent & { occurredAt: string };

/** Generate a realistic week of Priya's ops activity. */
export function buildSeedEvents(anchor = new Date()): SeededEvent[] {
  const events: SeedEvent[] = [];

  // Order email → extract → sheet pattern (~18×/week, Mon–Fri)
  const orderDays = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5];
  orderDays.forEach((day, i) => {
    const orderId = `ORD-${2400 + i}`;
    const hour = 9 + (i % 6);
    events.push(
      {
        source: "email",
        action: "open_email",
        entityType: "email",
        entityId: `mail_order_${i}`,
        summary: `Opened order email for ${orderId} from supplier`,
        metadata: { subject: `Order confirmation ${orderId}`, from: "orders@acmesupply.com" },
        dayOffset: day,
        hour,
        minute: 5,
      },
      {
        source: "email",
        action: "extract_fields",
        entityType: "email",
        entityId: `mail_order_${i}`,
        summary: `Copied order #, SKU, qty, total from ${orderId}`,
        metadata: { fields: ["order_id", "sku", "qty", "total"], orderId },
        dayOffset: day,
        hour,
        minute: 8,
      },
      {
        source: "sheets",
        action: "append_row",
        entityType: "sheet",
        entityId: "Orders",
        summary: `Appended ${orderId} to Orders sheet`,
        metadata: { sheet: "Orders", orderId },
        dayOffset: day,
        hour,
        minute: 12,
      },
    );
  });

  // Weekly status email every Friday
  for (const day of [5]) {
    events.push(
      {
        source: "sheets",
        action: "read_sheet",
        entityType: "sheet",
        entityId: "Orders",
        summary: "Opened Orders sheet for weekly status",
        dayOffset: day,
        hour: 16,
        minute: 0,
      },
      {
        source: "sheets",
        action: "summarize",
        entityType: "sheet",
        entityId: "Orders",
        summary: "Tallied weekly order totals for status email",
        dayOffset: day,
        hour: 16,
        minute: 15,
      },
      {
        source: "email",
        action: "compose_email",
        entityType: "email",
        entityId: "status_weekly",
        summary: "Composed weekly status email to ops team",
        metadata: { to: "ops@company.com", subject: "Weekly Ops Status" },
        dayOffset: day,
        hour: 16,
        minute: 35,
      },
      {
        source: "email",
        action: "send_email",
        entityType: "email",
        entityId: "status_weekly",
        summary: "Sent weekly status email to ops team",
        dayOffset: day,
        hour: 16,
        minute: 40,
      },
    );
  }

  // Post-call follow-up booking (~5×/week)
  for (let i = 0; i < 5; i++) {
    const day = 1 + i;
    events.push(
      {
        source: "calendar",
        action: "end_meeting",
        entityType: "event",
        entityId: `call_${i}`,
        summary: `Finished client call with Acme #${i + 1}`,
        dayOffset: day,
        hour: 11,
        minute: 0,
      },
      {
        source: "email",
        action: "draft_email",
        entityType: "email",
        entityId: `followup_${i}`,
        summary: `Drafted follow-up notes after client call #${i + 1}`,
        dayOffset: day,
        hour: 11,
        minute: 10,
      },
      {
        source: "calendar",
        action: "create_event",
        entityType: "event",
        entityId: `followup_meet_${i}`,
        summary: `Booked follow-up meeting for client call #${i + 1}`,
        dayOffset: day,
        hour: 11,
        minute: 20,
      },
    );
  }

  // Misc browser noise so mining isn't trivial
  for (let i = 0; i < 12; i++) {
    events.push({
      source: "browser",
      action: "browse",
      summary: `Checked Slack / docs tab ${i + 1}`,
      dayOffset: 1 + (i % 5),
      hour: 10 + (i % 7),
      minute: 30,
    });
  }

  // Stamp absolute times from anchor (treat dayOffset 1 = Mon of current week)
  const monday = startOfWeek(anchor);
  return events.map((e): SeededEvent => {
    const when = new Date(monday);
    when.setDate(monday.getDate() + (e.dayOffset - 1));
    when.setHours(e.hour, e.minute ?? 0, 0, 0);
    return { ...e, occurredAt: when.toISOString() };
  });
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function seedDatabase(reset = true) {
  const db = getDb();
  if (reset) {
    db.delete(schema.runs).run();
    db.delete(schema.workflows).run();
    db.delete(schema.patterns).run();
    db.delete(schema.insights).run();
    db.delete(schema.events).run();
  }

  const raw = buildSeedEvents();
  const createdAt = nowIso();
  const rows = raw.map((e) => ({
    id: uid("evt"),
    source: e.source,
    action: e.action,
    entityType: e.entityType ?? null,
    entityId: e.entityId ?? null,
    summary: e.summary,
    metadata: e.metadata ? JSON.stringify(e.metadata) : null,
    occurredAt: e.occurredAt,
    createdAt,
  }));

  for (const row of rows) {
    db.insert(schema.events).values(row).run();
  }

  return { eventsInserted: rows.length };
}
