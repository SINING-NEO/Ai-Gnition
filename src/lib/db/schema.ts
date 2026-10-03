import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  metadata: text("metadata"), // JSON
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const patterns = sqliteTable("patterns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sequence: text("sequence").notNull(), // JSON string[]
  frequencyPerWeek: integer("frequency_per_week").notNull(),
  estimatedMinutesPerWeek: real("estimated_minutes_per_week").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull().default("detected"), // detected | automating | automated | dismissed
  createdAt: text("created_at").notNull(),
});

export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  patternId: text("pattern_id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  spec: text("spec").notNull(), // JSON WorkflowSpec
  riskReport: text("risk_report"), // JSON RiskReport
  status: text("status").notNull().default("draft"), // draft | pending_approval | approved | rejected
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull(),
  status: text("status").notNull().default("queued"), // queued | running | succeeded | failed
  log: text("log").notNull().default("[]"), // JSON RunLogEntry[]
  minutesSaved: real("minutes_saved").default(0),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  createdAt: text("created_at").notNull(),
});

export const insights = sqliteTable("insights", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});
