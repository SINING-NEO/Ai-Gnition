"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import type { WorkflowSpec, RiskReport } from "@/lib/types";

type Workflow = {
  id: string;
  name: string;
  description: string;
  status: string;
  spec: WorkflowSpec;
  riskReport: RiskReport | null;
};

export default function StudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
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

  if (error) {
    return <p className="text-ember-hot">{error}</p>;
  }
  if (!workflow) {
    return <p className="text-mist">Loading studio…</p>;
  }

  return (
    <div className="animate-rise space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Workflow Studio</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-fog">
          {workflow.name}
        </h1>
        <p className="mt-3 max-w-2xl text-mist">{workflow.description}</p>
      </div>

      <WorkflowGraph spec={workflow.spec} />

      <div className="flex flex-wrap gap-3">
        {workflow.status === "pending_approval" && (
          <button
            type="button"
            onClick={() => router.push(`/approve/${workflow.id}`)}
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-hot"
          >
            Review with Guardian
          </button>
        )}
        {workflow.status === "approved" && (
          <button
            type="button"
            onClick={() => router.push(`/approve/${workflow.id}`)}
            className="rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-hot"
          >
            Run workflow
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-fog hover:bg-white/10"
        >
          Back to patterns
        </button>
      </div>
    </div>
  );
}
