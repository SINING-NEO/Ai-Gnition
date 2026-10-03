import { z } from "zod";

export const ActivityEventSchema = z.object({
  id: z.string().optional(),
  source: z.enum(["email", "calendar", "sheets", "browser", "manual"]),
  action: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  summary: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.string(),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export const WorkflowStepSchema = z.object({
  id: z.string(),
  tool: z.string(),
  label: z.string(),
  args: z.record(z.string(), z.unknown()).default({}),
  risk: z.enum(["low", "medium", "high"]).default("low"),
});

export const WorkflowSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.object({
    type: z.enum(["manual", "schedule", "event"]),
    description: z.string(),
    cron: z.string().optional(),
    eventAction: z.string().optional(),
  }),
  steps: z.array(WorkflowStepSchema).min(1),
  estimatedMinutesSaved: z.number().nonnegative().default(0),
});

export type WorkflowSpec = z.infer<typeof WorkflowSpecSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export type PatternInsight = {
  name: string;
  description: string;
  sequence: string[];
  frequencyPerWeek: number;
  estimatedMinutesPerWeek: number;
  confidence: number;
};

export type RiskReport = {
  overall: "low" | "medium" | "high";
  flags: Array<{
    stepId: string;
    level: "low" | "medium" | "high";
    reason: string;
  }>;
  dryRunPreview: string[];
  requiresApproval: boolean;
};

export type RunLogEntry = {
  ts: string;
  level: "info" | "success" | "warn" | "error";
  agent: string;
  message: string;
  data?: Record<string, unknown>;
};
