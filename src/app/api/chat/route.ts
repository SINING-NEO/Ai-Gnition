import { NextResponse } from "next/server";
import { buildWorkflowFromPrompt } from "@/lib/agents/architect";
import { generateText } from "@/lib/agents/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const workflow = await buildWorkflowFromPrompt(message);
  const reply =
    (await generateText({
      system:
        "You are OneLastThing's chat. Confirm you designed an automation in 2 short sentences. Mention the workflow name and that Guardian will review risky steps.",
      prompt: `User said: ${message}\nWorkflow: ${workflow.name}`,
    })) ??
    `Got it — I designed **${workflow.name}**. Guardian reviewed the steps${
      workflow.riskReport?.requiresApproval ? " and needs your approval before anything sends." : "."
    }`;

  return NextResponse.json({ reply, workflow });
}
