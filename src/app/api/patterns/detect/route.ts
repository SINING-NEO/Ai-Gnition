import { NextResponse } from "next/server";
import { detectAndStorePatterns } from "@/lib/agents/pattern-hunter";
import { getEventCount } from "@/lib/agents/observer";
import { seedDatabase } from "@/lib/db/seed";

export const runtime = "nodejs";

export async function POST() {
  if (getEventCount() === 0) seedDatabase(true);
  const patterns = await detectAndStorePatterns();
  return NextResponse.json({ patterns });
}
