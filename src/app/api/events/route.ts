import { NextResponse } from "next/server";
import { ingestEvents, listEvents } from "@/lib/agents/observer";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ events: listEvents() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : body.events;
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Expected events array" }, { status: 400 });
  }
  const inserted = ingestEvents(items);
  return NextResponse.json({ inserted: inserted.length, events: inserted });
}
