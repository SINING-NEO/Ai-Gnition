import type { RiskReport, WorkflowSpec } from "../types";

const HIGH_RISK_TOOLS = new Set(["send_email", "create_calendar_event"]);
const MEDIUM_RISK_TOOLS = new Set(["append_sheet_row", "draft_email"]);

export function assessRisk(spec: WorkflowSpec): RiskReport {
  const flags: RiskReport["flags"] = [];

  for (const step of spec.steps) {
    const level =
      step.risk === "high" || HIGH_RISK_TOOLS.has(step.tool)
        ? "high"
        : step.risk === "medium" || MEDIUM_RISK_TOOLS.has(step.tool)
          ? "medium"
          : "low";

    if (level === "low") continue;

    flags.push({
      stepId: step.id,
      level,
      reason: reasonFor(step.tool, step.label),
    });
  }

  const overall = flags.some((f) => f.level === "high")
    ? "high"
    : flags.some((f) => f.level === "medium")
      ? "medium"
      : "low";

  const dryRunPreview = [
    `Trigger: ${spec.trigger.description}`,
    ...spec.steps.map(
      (s, i) => `${i + 1}. [${s.tool}] ${s.label} — would run with ${JSON.stringify(s.args)}`,
    ),
    "No external side-effects executed in dry-run.",
  ];

  return {
    overall,
    flags,
    dryRunPreview,
    requiresApproval: overall !== "low",
  };
}

function reasonFor(tool: string, label: string) {
  switch (tool) {
    case "send_email":
      return `Sends external email: "${label}"`;
    case "create_calendar_event":
      return `Writes to calendar: "${label}"`;
    case "append_sheet_row":
      return `Mutates spreadsheet data: "${label}"`;
    case "draft_email":
      return `Creates an outbound draft: "${label}"`;
    default:
      return `Elevated action: "${label}"`;
  }
}
