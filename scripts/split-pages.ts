/**
 * split-pages.ts
 *
 * Reads each layout's monolithic pages.json (structure: { "0": {pageNumber,lines,...}, "1": ... })
 * and writes one file per page: src/data/pages/{layout}/p{N}.json (~40 KB each).
 *
 * Idempotent: skips individual files that are already newer than the source.
 *
 * Usage (from repo root):
 *   yarn generate:pages:split
 *   — or —
 *   yarn workspace open-quran-view generate:pages:split
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const PAGES_SRC = join(PROJECT_ROOT, "src/data/pages");

const LAYOUTS = ["hafs-v2", "hafs-v4", "hafs-unicode"] as const;

type Page = {
  pageNumber: number;
  [key: string]: unknown;
};

/** pages.json is a numeric-keyed object: { "0": Page, "1": Page, … } */
type PagesJson = Record<string, Page>;

async function splitLayout(layout: string): Promise<void> {
  const sourcePath = join(PAGES_SRC, layout, "pages.json");

  if (!existsSync(sourcePath)) {
    console.warn(`  ⚠️  Skipping "${layout}" — pages.json not found at ${sourcePath}`);
    return;
  }

  const sourceMtime = statSync(sourcePath).mtimeMs;
  const outDir = join(PAGES_SRC, layout);

  console.log(`  📖 Reading ${layout}/pages.json …`);
  const raw = readFileSync(sourcePath, "utf-8");
  const parsed = JSON.parse(raw) as PagesJson;

  // Support both { pages: Page[] } and { "0": Page, "1": Page, … }
  const pages: Page[] = Array.isArray((parsed as any).pages)
    ? (parsed as any).pages
    : Object.values(parsed);

  if (pages.length === 0) {
    throw new Error(`"${layout}/pages.json" appears to be empty`);
  }

  let written = 0;
  let skipped = 0;

  for (const page of pages) {
    const pageNum = page.pageNumber;
    if (typeof pageNum !== "number") {
      console.warn(`  ⚠️  Skipping entry with no pageNumber:`, JSON.stringify(page).slice(0, 80));
      continue;
    }

    const outPath = join(outDir, `p${pageNum}.json`);

    // Skip if the per-page file is already up-to-date
    if (existsSync(outPath) && statSync(outPath).mtimeMs >= sourceMtime) {
      skipped++;
      continue;
    }

    writeFileSync(outPath, JSON.stringify(page), "utf-8");
    written++;

    if (written % 100 === 0) {
      process.stdout.write(`\r  ✍️  ${written} / ${pages.length} written …`);
    }
  }

  if (written > 0) process.stdout.write("\n");
  console.log(
    `  ✅ "${layout}": ${written} written, ${skipped} skipped (up-to-date)`,
  );
}

async function main() {
  console.log("🔪 Splitting monolithic pages.json files into per-page files…\n");

  for (const layout of LAYOUTS) {
    mkdirSync(join(PAGES_SRC, layout), { recursive: true });
    await splitLayout(layout);
    console.log();
  }

  console.log("✨ Done — per-page JSON files are ready.");
  console.log(
    "   Next: run `yarn generate:static:data` to regenerate data.rn.ts thunks.",
  );
}

main().catch((err) => {
  console.error("❌ split-pages failed:", err);
  process.exit(1);
});
