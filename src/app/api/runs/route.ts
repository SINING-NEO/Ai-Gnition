import { NextResponse } from "next/server";
import { createRun } from "@/lib/agents/executor";
import { getDb, schema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const runs = db
    .select()
    .from(schema.runs)
    .all()
    .map((r) => ({ ...r, log: JSON.parse(r.log) }));
  return NextResponse.json({ runs });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.workflowId) {
    return NextResponse.json({ error: "workflowId required" }, { status: 400 });
  }
  try {
    const run = createRun(String(body.workflowId));
    return NextResponse.json({ run });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create run" },
      { status: 400 },
    );
  }
}
