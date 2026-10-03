"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Info, ShieldCheck } from "lucide-react";
import type { RiskReport, RunLogEntry, WorkflowSpec } from "@/lib/types";

const LEVEL_COLOR = {
  low: "var(--green)",
  medium: "var(--orange)",
  high: "var(--orange)",
} as const;

type Workflow = {
  id: string;
  name: string;
  description: string;
  status: string;
  spec: WorkflowSpec;
  riskReport: RiskReport | null;
};

export default function ApprovePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [log, setLog] = useState<RunLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/workflows/${id}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Not found");
        return;
      }
      setWorkflow(json.workflow);
    })();
  }, [id]);

  async function approve() {
    const res = await fetch(`/api/workflows/${id}/approve`, { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Approve failed");
      return;
    }
    setWorkflow(json.workflow);
    await startRun(json.workflow.id);
  }

  async function startRun(workflowId: string) {
    setRunning(true);
    setLog([]);
    setError(null);
    try {
      const create = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });
      const created = await create.json();
      if (!create.ok) {
        throw new Error(created.error || "Could not start run");
      }

      const res = await fetch(`/api/runs/${created.run.id}/stream`);
      if (!res.ok || !res.body) {
        throw new Error("Could not open execution stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "log") {
            setLog((prev) => [...prev, payload.entry]);
          }
          if (payload.type === "error") {
            throw new Error(payload.message || "Execution failed");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  if (!workflow && error) {
    return <p className="card p-6 text-orange">{error}</p>;
  }
  if (!workflow) return <p className="card p-6 text-muted">Guardian is reviewing…</p>;

  const report = workflow.riskReport;
  const flags = report?.flags ?? [];
  const overall = report?.overall ?? "low";

  return (
    <div className="animate-rise mx-auto max-w-5xl space-y-6">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={() => router.push("/")}
          className="icon-dot absolute left-0 bg-surface hover:bg-raised"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-lg font-medium">Guardian review</p>
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-medium md:text-4xl">{workflow.name}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {workflow.description}
        </p>
      </div>

      {flags.length > 0 && workflow.status === "pending_approval" && (
        <div className="flex items-start gap-3 rounded-2xl bg-lime p-4 text-bg">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">
              Guardian found {flags.length} step{flags.length > 1 ? "s" : ""} that change
              data or contact people. Nothing runs until you approve.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-orange/15 px-4 py-3 text-sm text-orange">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Risk report</h2>
            <span
              className="chip capitalize"
              style={{ color: LEVEL_COLOR[overall] }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LEVEL_COLOR[overall] }}
              />
              {overall}
            </span>
          </div>

          <ul className="mt-5 space-y-2">
            {flags.length === 0 && (
              <li className="tile flex items-center gap-3 bg-raised p-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-green" />
                No elevated risks detected.
              </li>
            )}
            {flags.map((f) => (
              <li
                key={f.stepId + f.reason}
                className="flex items-start gap-3 rounded-xl bg-raised p-3 text-sm"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: LEVEL_COLOR[f.level] }}
                />
                <span>{f.reason}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-sm font-medium text-muted">Dry-run preview</h3>
          <ol className="mt-3 space-y-2">
            {(report?.dryRunPreview ?? []).map((line, i) => (
              <li key={line} className="flex gap-3 text-sm">
                <span className="font-display w-5 shrink-0 text-lime">{i + 1}</span>
                <span className="text-muted">{line}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card flex flex-col p-6">
          <h2 className="font-display text-xl font-medium">Live execution</h2>
          <div className="mt-5 max-h-[360px] flex-1 space-y-2 overflow-y-auto">
            {log.length === 0 && (
              <p className="rounded-xl bg-raised p-4 text-sm text-muted">
                {running ? "Agents spinning up…" : "Approve to watch the Executor work."}
              </p>
            )}
            {log.map((entry, i) => {
              const color =
                entry.level === "success"
                  ? "var(--green)"
                  : entry.level === "error"
                    ? "var(--orange)"
                    : "var(--muted)";
              return (
                <div
                  key={`${entry.ts}-${i}`}
                  className="log-line flex items-start gap-3 rounded-xl bg-raised px-3 py-2.5 text-sm"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p>{entry.message}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {entry.agent} · {new Date(entry.ts).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-3">
        {workflow.status === "pending_approval" && (
          <button
            type="button"
            data-testid="approve-run"
            disabled={running}
            onClick={() => void approve()}
            className="btn btn-primary w-full"
          >
            {running ? "Running…" : "Approve & run"}
          </button>
        )}
        {workflow.status === "approved" && !running && (
          <button
            type="button"
            data-testid="run-now"
            onClick={() => void startRun(workflow.id)}
            className="btn btn-primary w-full"
          >
            {log.length ? "Run again" : "Run now"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(`/studio/${workflow.id}`)}
          className="btn btn-ghost w-full"
        >
          Open studio
        </button>
      </div>
    </div>
  );
}
