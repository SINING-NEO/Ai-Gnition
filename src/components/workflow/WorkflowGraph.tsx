"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { WorkflowSpec } from "@/lib/types";

export function WorkflowGraph({ spec }: { spec: WorkflowSpec }) {
  const { nodes, edges } = useMemo(() => {
    const triggerNode: Node = {
      id: "trigger",
      position: { x: 40, y: 120 },
      data: { label: `Trigger\n${spec.trigger.description}` },
      style: nodeStyle("#2a9d8f"),
      type: "default",
    };

    const stepNodes: Node[] = spec.steps.map((s, i) => ({
      id: s.id,
      position: { x: 280 + i * 220, y: 100 },
      data: { label: `${s.label}\n(${s.tool}) · ${s.risk}` },
      style: nodeStyle(
        s.risk === "high" ? "#e85d04" : s.risk === "medium" ? "#d4a373" : "#1b6b62",
      ),
    }));

    const edges: Edge[] = [
      {
        id: "e-trigger",
        source: "trigger",
        target: spec.steps[0]?.id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#c5ddd7" },
        style: { stroke: "#c5ddd7" },
      },
      ...spec.steps.slice(0, -1).map((s, i) => ({
        id: `e-${s.id}`,
        source: s.id,
        target: spec.steps[i + 1].id,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#c5ddd7" },
        style: { stroke: "#c5ddd7" },
      })),
    ];

    return { nodes: [triggerNode, ...stepNodes], edges };
  }, [spec]);

  return (
    <div className="h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#2a9d8f" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function nodeStyle(accent: string): React.CSSProperties {
  return {
    background: "#143039",
    color: "#e8f2f0",
    border: `1px solid ${accent}`,
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    whiteSpace: "pre-line",
    width: 180,
    fontFamily: "var(--font-body), sans-serif",
  };
}
