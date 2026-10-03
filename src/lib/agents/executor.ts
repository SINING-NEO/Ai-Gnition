import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { toolRegistry } from "../tools/registry";
import type { RunLogEntry, WorkflowSpec } from "../types";
import { uid, nowIso } from "../utils";

export function getWorkflow(id: string) {
  const db = getDb();
  const row = db.select().from(schema.workflows).where(eq(schema.workflows.id, id)).get();
  if (!row) return null;
  return {
    ...row,
    spec: JSON.parse(row.spec) as WorkflowSpec,
    riskReport: row.riskReport ? JSON.parse(row.riskReport) : null,
  };
}

export function listWorkflows() {
  const db = getDb();
  return db
    .select()
    .from(schema.workflows)
    .all()
    .map((row) => ({
      ...row,
      spec: JSON.parse(row.spec) as WorkflowSpec,
      riskReport: row.riskReport ? JSON.parse(row.riskReport) : null,
    }));
}

export function approveWorkflow(id: string) {
  const db = getDb();
  const ts = nowIso();
  db.update(schema.workflows)
    .set({ status: "approved", updatedAt: ts })
    .where(eq(schema.workflows.id, id))
    .run();
  const wf = getWorkflow(id);
  if (wf?.patternId) {
    db.update(schema.patterns)
      .set({ status: "automated" })
      .where(eq(schema.patterns.id, wf.patternId))
      .run();
  }
  return wf;
}

export function createRun(workflowId: string) {
  const wf = getWorkflow(workflowId);
  if (!wf) throw new Error("Workflow not found");
  if (wf.status !== "approved") throw new Error("Workflow not approved");

  const db = getDb();
  const id = uid("run");
  const createdAt = nowIso();
  db.insert(schema.runs)
    .values({
      id,
      workflowId,
      status: "queued",
      log: "[]",
      minutesSaved: 0,
      createdAt,
    })
    .run();
  return { id, workflowId, status: "queued" as const, createdAt };
}

export function getRun(id: string) {
  const db = getDb();
  const row = db.select().from(schema.runs).where(eq(schema.runs.id, id)).get();
  if (!row) return null;
  return {
    ...row,
    log: JSON.parse(row.log) as RunLogEntry[],
  };
}

function appendLog(runId: string, entry: RunLogEntry, patch?: Partial<typeof schema.runs.$inferInsert>) {
  const db = getDb();
  const run = getRun(runId);
  if (!run) return;
  const log = [...run.log, entry];
  db.update(schema.runs)
    .set({ log: JSON.stringify(log), ...patch })
    .where(eq(schema.runs.id, runId))
    .run();
}

/** Execute a workflow step-by-step; yields log entries for SSE. */
export async function* executeRun(runId: string): AsyncGenerator<RunLogEntry> {
  const run = getRun(runId);
  if (!run) throw new Error("Run not found");
  const wf = getWorkflow(run.workflowId);
  if (!wf) throw new Error("Workflow not found");

  const startedAt = nowIso();
  const startEntry: RunLogEntry = {
    ts: startedAt,
    level: "info",
    agent: "Executor",
    message: `Starting workflow "${wf.name}"`,
  };
  appendLog(runId, startEntry, { status: "running", startedAt });
  yield startEntry;

  let failed = false;

  for (const step of wf.spec.steps) {
    const begin: RunLogEntry = {
      ts: nowIso(),
      level: "info",
      agent: "Executor",
      message: `Running step: ${step.label}`,
      data: { tool: step.tool, stepId: step.id },
    };
    appendLog(runId, begin);
    yield begin;

    // Small delay so the live log feels alive in demos
    await sleep(450);

    const handler = toolRegistry[step.tool];
    if (!handler) {
      const err: RunLogEntry = {
        ts: nowIso(),
        level: "error",
        agent: "Executor",
        message: `Unknown tool: ${step.tool}`,
      };
      appendLog(runId, err);
      yield err;
      failed = true;
      break;
    }

    const result = await handler(step.args ?? {});
    const done: RunLogEntry = {
      ts: nowIso(),
      level: result.ok ? "success" : "error",
      agent: "Executor",
      message: result.output,
      data: result.data,
    };
    appendLog(runId, done);
    yield done;
    if (!result.ok) {
      failed = true;
      break;
    }
  }

  const finishedAt = nowIso();
  const minutesSaved = failed ? 0 : wf.spec.estimatedMinutesSaved / Math.max(1, wf.spec.trigger.type === "schedule" ? 1 : 4);

  const finale: RunLogEntry = {
    ts: finishedAt,
    level: failed ? "error" : "success",
    agent: "Reporter",
    message: failed
      ? "Run failed — no time credited."
      : `Run complete. Estimated time saved this run: ${Math.round(minutesSaved)} minutes.`,
    data: { minutesSaved },
  };
  appendLog(runId, finale, {
    status: failed ? "failed" : "succeeded",
    finishedAt,
    minutesSaved,
  });
  yield finale;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function totalMinutesSaved() {
  const db = getDb();
  const rows = db.select().from(schema.runs).all();
  return rows.reduce((sum, r) => sum + (r.minutesSaved ?? 0), 0);
}
