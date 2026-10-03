import { seedDatabase } from "../src/lib/db/seed";
import { detectAndStorePatterns } from "../src/lib/agents/pattern-hunter";

async function main() {
  const seeded = seedDatabase(true);
  const patterns = await detectAndStorePatterns();
  console.log(
    JSON.stringify(
      { ok: true, ...seeded, patterns: patterns.map((p) => p.name) },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
