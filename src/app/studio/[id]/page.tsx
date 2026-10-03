"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

  if (error) return <p className="card p-6 text-orange">{error}</p>;
  if (!workflow) return <p className="card p-6 text-muted">Loading studio…</p>;

  return (
    <div className="animate-rise space-y-6">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={() => router.push("/")}
          className="icon-dot absolute left-0 bg-surface hover:bg-raised"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-lg font-medium">Workflow studio</p>
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-medium md:text-4xl">{workflow.name}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {workflow.description}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="chip">{workflow.spec.trigger.description}</span>
          <span className="chip">{workflow.spec.steps.length} steps</span>
        </div>
      </div>

      <WorkflowGraph spec={workflow.spec} />

      <div className="mx-auto flex max-w-md flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push(`/approve/${workflow.id}`)}
          className="btn btn-primary w-full"
        >
          {workflow.status === "pending_approval" ? "Review with Guardian" : "Run workflow"}
        </button>
      </div>
    </div>
  );
}
