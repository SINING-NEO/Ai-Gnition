import { NextResponse } from "next/server";
import {
  buildWorkflowFromPattern,
  buildWorkflowFromPrompt,
} from "@/lib/agents/architect";
import { listWorkflows } from "@/lib/agents/executor";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ workflows: listWorkflows() });
}

export async function POST(req: Request) {
  const body = await req.json();
  try {
    if (body.patternId) {
      const workflow = await buildWorkflowFromPattern(String(body.patternId));
      return NextResponse.json({ workflow });
    }
    if (body.prompt) {
      const workflow = await buildWorkflowFromPrompt(String(body.prompt));
      return NextResponse.json({ workflow });
    }
    return NextResponse.json(
      { error: "Provide patternId or prompt" },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build workflow" },
      { status: 400 },
    );
  }
}
