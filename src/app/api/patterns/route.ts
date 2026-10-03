import { NextResponse } from "next/server";
import { listPatterns } from "@/lib/agents/pattern-hunter";
import { getEventCount } from "@/lib/agents/observer";
import { seedDatabase } from "@/lib/db/seed";
import { detectAndStorePatterns } from "@/lib/agents/pattern-hunter";

export const runtime = "nodejs";

export async function GET() {
  let patterns = listPatterns();
  if (!patterns.length && getEventCount() === 0) {
    seedDatabase(true);
    patterns = await detectAndStorePatterns();
  } else if (!patterns.length) {
    patterns = await detectAndStorePatterns();
  }
  return NextResponse.json({ patterns });
}
