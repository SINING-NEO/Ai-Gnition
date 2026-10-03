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

const RISK_ACCENT = {
  low: "#4ac067",
  medium: "#ff7043",
  high: "#ff7043",
} as const;

export function WorkflowGraph({ spec }: { spec: WorkflowSpec }) {
  const { nodes, edges } = useMemo(() => {
    const triggerNode: Node = {
      id: "trigger",
      position: { x: 40, y: 110 },
      data: { label: `Trigger\n${spec.trigger.description}` },
      style: { ...nodeStyle(), background: "#ecfe72", color: "#17181c", fontWeight: 600 },
    };

    const stepNodes: Node[] = spec.steps.map((s, i) => ({
      id: s.id,
      position: { x: 280 + i * 220, y: 100 },
      data: { label: `${s.label}\n${s.tool} · ${s.risk}` },
      style: { ...nodeStyle(), borderLeft: `4px solid ${RISK_ACCENT[s.risk]}` },
    }));

    const edgeStyle = {
      markerEnd: { type: MarkerType.ArrowClosed, color: "#8766eb" },
      style: { stroke: "#8766eb", strokeWidth: 2 },
    };

    const edges: Edge[] = [
      { id: "e-trigger", source: "trigger", target: spec.steps[0]?.id, ...edgeStyle },
      ...spec.steps.slice(0, -1).map((s, i) => ({
        id: `e-${s.id}`,
        source: s.id,
        target: spec.steps[i + 1].id,
        ...edgeStyle,
      })),
    ];

    return { nodes: [triggerNode, ...stepNodes], edges };
  }, [spec]);

  return (
    <div className="card h-[360px] w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#424349" gap={22} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function nodeStyle(): React.CSSProperties {
  return {
    background: "#2e2f36",
    color: "#ffffff",
    border: "none",
    borderRadius: 14,
    padding: 12,
    fontSize: 12,
    lineHeight: 1.4,
    whiteSpace: "pre-line",
    width: 180,
    fontFamily: "var(--font-body), sans-serif",
  };
}
