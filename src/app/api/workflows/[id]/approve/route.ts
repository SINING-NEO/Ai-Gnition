import { NextResponse } from "next/server";
import { approveWorkflow } from "@/lib/agents/executor";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const workflow = approveWorkflow(id);
  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ workflow });
}
