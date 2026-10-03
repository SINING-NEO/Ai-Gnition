import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { WorkflowSpecSchema, type WorkflowSpec } from "../types";
import { generateJson } from "./gemini";
import { uid, nowIso } from "../utils";
import { listPatterns } from "./pattern-hunter";
import { assessRisk } from "./guardian";

const TOOL_CATALOG = [
  "read_emails",
  "extract_fields",
  "append_sheet_row",
  "send_email",
  "draft_email",
  "create_calendar_event",
  "summarize",
  "generate_report",
  "notify_user",
  "read_sheet",
];

export async function buildWorkflowFromPattern(patternId: string) {
  const patterns = listPatterns();
  const pattern = patterns.find((p) => p.id === patternId);
  if (!pattern) throw new Error("Pattern not found");

  const spec =
    (await architectWithGemini({
      kind: "pattern",
      name: pattern.name,
      description: pattern.description,
      sequence: pattern.sequence,
      estimatedMinutesPerWeek: pattern.estimatedMinutesPerWeek,
    })) ?? fallbackFromPattern(pattern);

  return persistWorkflow({
    patternId,
    spec,
  });
}

export async function buildWorkflowFromPrompt(prompt: string) {
  const spec =
    (await architectWithGemini({ kind: "prompt", prompt })) ??
    fallbackFromPrompt(prompt);

  return persistWorkflow({ patternId: null, spec });
}

async function architectWithGemini(input: Record<string, unknown>) {
  const result = await generateJson<WorkflowSpec>({
    system: `You are the Architect agent for OneLastThing. Convert a repetitive work pattern or plain-English request into a WorkflowSpec JSON.
Available tools: ${TOOL_CATALOG.join(", ")}.
Rules:
- steps[].tool must be from the catalog
- steps[].risk: send_email/create_calendar_event = high or medium; reads = low
- include trigger + estimatedMinutesSaved
- return ONLY the WorkflowSpec object`,
    prompt: JSON.stringify(input),
    model: process.env.GEMINI_PLAN_MODEL ?? "gemini-2.5-flash",
  });

  if (!result) return null;
  const parsed = WorkflowSpecSchema.safeParse(result);
  return parsed.success ? parsed.data : null;
}

function fallbackFromPattern(pattern: {
  name: string;
  description: string;
  sequence: string[];
  estimatedMinutesPerWeek: number;
}): WorkflowSpec {
  const seq = pattern.sequence.join("→");

  if (seq.includes("open_email") && seq.includes("append_row")) {
    return {
      name: "Automate order email → Orders sheet",
      description: pattern.description,
      trigger: {
        type: "event",
        description: "When a new order confirmation email arrives",
        eventAction: "open_email",
      },
      steps: [
        {
          id: "s1",
          tool: "read_emails",
          label: "Read new order emails",
          args: { query: "subject:Order confirmation newer_than:1d" },
          risk: "low",
        },
        {
          id: "s2",
          tool: "extract_fields",
          label: "Extract order #, SKU, qty, total",
          args: { fields: ["order_id", "sku", "qty", "total"] },
          risk: "low",
        },
        {
          id: "s3",
          tool: "append_sheet_row",
          label: "Append row to Orders sheet",
          args: { sheet: "Orders" },
          risk: "medium",
        },
        {
          id: "s4",
          tool: "notify_user",
          label: "Notify Priya of rows added",
          args: { channel: "in_app" },
          risk: "low",
        },
      ],
      estimatedMinutesSaved: Math.round(pattern.estimatedMinutesPerWeek),
    };
  }

  if (seq.includes("send_email") && seq.includes("summarize")) {
    return {
      name: "Friday status email autopilot",
      description: pattern.description,
      trigger: {
        type: "schedule",
        description: "Every Friday at 4:00 PM",
        cron: "0 16 * * 5",
      },
      steps: [
        {
          id: "s1",
          tool: "read_sheet",
          label: "Read Orders sheet",
          args: { sheet: "Orders", range: "A:F" },
          risk: "low",
        },
        {
          id: "s2",
          tool: "summarize",
          label: "Summarize weekly totals",
          args: { focus: "orders, revenue, blockers" },
          risk: "low",
        },
        {
          id: "s3",
          tool: "draft_email",
          label: "Draft status email to ops@",
          args: { to: "ops@company.com", subject: "Weekly Ops Status" },
          risk: "medium",
        },
        {
          id: "s4",
          tool: "send_email",
          label: "Send after approval",
          args: { requireApproval: true },
          risk: "high",
        },
      ],
      estimatedMinutesSaved: Math.round(pattern.estimatedMinutesPerWeek),
    };
  }

  if (seq.includes("create_event")) {
    return {
      name: "Post-call follow-up booking",
      description: pattern.description,
      trigger: {
        type: "event",
        description: "When a client meeting ends",
        eventAction: "end_meeting",
      },
      steps: [
        {
          id: "s1",
          tool: "summarize",
          label: "Summarize call notes",
          args: {},
          risk: "low",
        },
        {
          id: "s2",
          tool: "draft_email",
          label: "Draft follow-up email",
          args: {},
          risk: "medium",
        },
        {
          id: "s3",
          tool: "create_calendar_event",
          label: "Book follow-up meeting (+3 days)",
          args: { offsetDays: 3, durationMinutes: 30 },
          risk: "high",
        },
      ],
      estimatedMinutesSaved: Math.round(pattern.estimatedMinutesPerWeek),
    };
  }

  return {
    name: `Automate: ${pattern.name}`,
    description: pattern.description,
    trigger: { type: "manual", description: "Run on demand" },
    steps: pattern.sequence.map((action, i) => ({
      id: `s${i + 1}`,
      tool: mapActionToTool(action),
      label: action.replace(/_/g, " "),
      args: {},
      risk: action.includes("send") || action.includes("create") ? "high" : "low",
    })) as WorkflowSpec["steps"],
    estimatedMinutesSaved: Math.round(pattern.estimatedMinutesPerWeek),
  };
}

function fallbackFromPrompt(prompt: string): WorkflowSpec {
  const lower = prompt.toLowerCase();
  if (lower.includes("friday") || lower.includes("status")) {
    return fallbackFromPattern({
      name: "Friday status email",
      description: prompt,
      sequence: ["read_sheet", "summarize", "compose_email", "send_email"],
      estimatedMinutesPerWeek: 45,
    });
  }
  if (lower.includes("order") || lower.includes("sheet")) {
    return fallbackFromPattern({
      name: "Order emails → Sheet",
      description: prompt,
      sequence: ["open_email", "extract_fields", "append_row"],
      estimatedMinutesPerWeek: 150,
    });
  }
  return {
    name: "Custom automation",
    description: prompt,
    trigger: { type: "manual", description: "Run when you ask" },
    steps: [
      {
        id: "s1",
        tool: "summarize",
        label: "Understand request",
        args: { prompt },
        risk: "low",
      },
      {
        id: "s2",
        tool: "notify_user",
        label: "Confirm plan with you",
        args: {},
        risk: "low",
      },
      {
        id: "s3",
        tool: "generate_report",
        label: "Produce result",
        args: {},
        risk: "low",
      },
    ],
    estimatedMinutesSaved: 20,
  };
}

function mapActionToTool(action: string) {
  const map: Record<string, string> = {
    open_email: "read_emails",
    extract_fields: "extract_fields",
    append_row: "append_sheet_row",
    send_email: "send_email",
    compose_email: "draft_email",
    draft_email: "draft_email",
    create_event: "create_calendar_event",
    summarize: "summarize",
    read_sheet: "read_sheet",
  };
  return map[action] ?? "notify_user";
}

function persistWorkflow(opts: { patternId: string | null; spec: WorkflowSpec }) {
  const parsed = WorkflowSpecSchema.parse(opts.spec);
  const riskReport = assessRisk(parsed);
  const db = getDb();
  const id = uid("wf");
  const ts = nowIso();

  db.insert(schema.workflows)
    .values({
      id,
      patternId: opts.patternId,
      name: parsed.name,
      description: parsed.description,
      spec: JSON.stringify(parsed),
      riskReport: JSON.stringify(riskReport),
      status: riskReport.requiresApproval ? "pending_approval" : "approved",
      createdAt: ts,
      updatedAt: ts,
    })
    .run();

  if (opts.patternId) {
    db.update(schema.patterns)
      .set({ status: "automating" })
      .where(eq(schema.patterns.id, opts.patternId))
      .run();
  }

  return {
    id,
    patternId: opts.patternId,
    name: parsed.name,
    description: parsed.description,
    spec: parsed,
    riskReport,
    status: riskReport.requiresApproval ? "pending_approval" : "approved",
    createdAt: ts,
    updatedAt: ts,
  };
}
