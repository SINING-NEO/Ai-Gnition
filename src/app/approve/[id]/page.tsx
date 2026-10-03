"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { RiskReport, RunLogEntry, WorkflowSpec } from "@/lib/types";

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

  if (error) return <p className="text-ember-hot">{error}</p>;
  if (!workflow) return <p className="text-mist">Guardian is reviewing…</p>;

  const report = workflow.riskReport;

  return (
    <div className="animate-rise space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ember-hot">Guardian</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-fog">
          {workflow.name}
        </h1>
        <p className="mt-3 max-w-2xl text-mist">{workflow.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Risk report · {report?.overall ?? "low"}
          </h2>
          <ul className="mt-4 space-y-3">
            {(report?.flags ?? []).length === 0 && (
              <li className="text-sm text-mist">No elevated risks detected.</li>
            )}
            {(report?.flags ?? []).map((f) => (
              <li
                key={f.stepId + f.reason}
                className="border-l-2 border-ember pl-3 text-sm text-mist"
              >
                <span className="uppercase tracking-wider text-ember-hot">{f.level}</span>
                <p className="mt-1">{f.reason}</p>
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-sm uppercase tracking-[0.16em] text-mist/70">
            Dry-run preview
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-mist">
            {(report?.dryRunPreview ?? []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-white/10 bg-ink/40 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Live execution log
          </h2>
          <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto font-mono text-xs">
            {log.length === 0 && (
              <p className="text-mist/60">
                {running ? "Agents spinning up…" : "Approve to watch the Executor work."}
              </p>
            )}
            {log.map((entry, i) => (
              <div
                key={`${entry.ts}-${i}`}
                className={`log-line flex gap-2 ${
                  entry.level === "success"
                    ? "text-leaf"
                    : entry.level === "error"
                      ? "text-ember-hot"
                      : "text-mist"
                }`}
              >
                <span className="shrink-0 text-mist/40">
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>
                <span className="shrink-0 text-fog/80">[{entry.agent}]</span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {workflow.status === "pending_approval" && (
          <button
            type="button"
            disabled={running}
            onClick={() => void approve()}
            className="animate-pulse-glow rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-hot disabled:opacity-50"
          >
            Approve & run
          </button>
        )}
        {workflow.status === "approved" && !running && log.length === 0 && (
          <button
            type="button"
            onClick={() => void startRun(workflow.id)}
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-hot"
          >
            Run now
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push(`/studio/${workflow.id}`)}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-fog hover:bg-white/10"
        >
          Open studio
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-fog hover:bg-white/10"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
