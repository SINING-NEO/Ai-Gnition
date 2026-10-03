import { NextResponse } from "next/server";
import { getStats, weeklyInsight } from "@/lib/agents/reporter";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const withInsight = url.searchParams.get("insight") === "1";
  const stats = getStats();
  const insight = withInsight ? await weeklyInsight() : null;
  return NextResponse.json({ stats, insight });
}
