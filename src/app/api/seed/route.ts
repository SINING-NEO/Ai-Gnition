import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { detectAndStorePatterns } from "@/lib/agents/pattern-hunter";

export const runtime = "nodejs";

export async function POST() {
  const seeded = seedDatabase(true);
  const patterns = await detectAndStorePatterns();
  return NextResponse.json({
    ok: true,
    ...seeded,
    patternsDetected: patterns.length,
    patterns,
  });
}
