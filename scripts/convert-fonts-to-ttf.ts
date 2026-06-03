/**
 * convert-fonts-to-ttf.ts
 *
 * One-shot migration: converts WOFF2 font files in src/data/fonts/{hafs-v2,hafs-v4}/
 * and src/data/shared/ to TTF in place. Required because:
 *   - React Native cannot read WOFF2
 *   - The artifacts plan standardizes on TTF for both web and RN
 *
 * Uses the `wawoff2` Node binding (C++ port of Google's woff2 decoder).
 * Idempotent: skips files that are already .ttf; skips conversion if .ttf
 * already exists alongside a .woff2 sibling.
 *
 * Usage:
 *   yarn tsx scripts/convert-fonts-to-ttf.ts
 */

import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// wawoff2 is ESM/CJS dual — default import gives the API object.
import wawoff2 from "wawoff2";

const TARGET_DIRS = [
  join(PROJECT_ROOT, "src/data/fonts/hafs-v2"),
  join(PROJECT_ROOT, "src/data/fonts/hafs-v4"),
  join(PROJECT_ROOT, "src/data/shared"),
];

async function convertOne(woff2Path: string): Promise<"converted" | "skipped" | "failed"> {
  const ttfPath = woff2Path.replace(/\.woff2$/i, ".ttf");
  if (existsSync(ttfPath)) {
    return "skipped";
  }
  try {
    const input = readFileSync(woff2Path);
    const output = await wawoff2.decompress(input);
    writeFileSync(ttfPath, Buffer.from(output));
    return "converted";
  } catch (err) {
    console.error(`  ✗ Failed to convert ${basename(woff2Path)}:`, (err as Error).message);
    return "failed";
  }
}

async function walkDir(dir: string): Promise<string[]> {
  const woffs: string[] = [];
  if (!existsSync(dir)) return woffs;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      woffs.push(...(await walkDir(full)));
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".woff2") {
      woffs.push(full);
    }
  }
  return woffs;
}

async function main() {
  console.log("🔄 Converting WOFF2 fonts to TTF…\n");

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const toDelete: string[] = [];

  for (const dir of TARGET_DIRS) {
    if (!existsSync(dir)) {
      console.warn(`  ⚠️  Skipping (missing): ${dir}`);
      continue;
    }
    const files = await walkDir(dir);
    if (files.length === 0) {
      console.log(`  · ${dir.replace(PROJECT_ROOT, "")}  — no .woff2 files`);
      continue;
    }
    console.log(`  📂 ${dir.replace(PROJECT_ROOT, "")}  — ${files.length} files`);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const result = await convertOne(f);
      if (result === "converted") {
        converted++;
        toDelete.push(f);
        process.stdout.write(`\r  ✍️  ${i + 1}/${files.length} converted …`);
      } else if (result === "skipped") {
        skipped++;
      } else {
        failed++;
      }
    }
    if (files.length > 0) process.stdout.write("\n");
  }

  // Phase 2: remove the .woff2 originals now that .ttf siblings exist
  if (toDelete.length > 0) {
    console.log(`\n🗑️  Removing ${toDelete.length} .woff2 originals…`);
    for (const f of toDelete) {
      try {
        unlinkSync(f);
      } catch (err) {
        console.warn(`  ⚠️  Could not delete ${basename(f)}:`, (err as Error).message);
      }
    }
  }

  console.log(`\n✨ Conversion complete: ${converted} converted, ${skipped} skipped, ${failed} failed`);
  if (converted > 0) {
    console.log(
      "   Next: run `yarn generate:static:fonts` to refresh fonts.web.ts / fonts.rn.ts.",
    );
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ convert-fonts-to-ttf failed:", err);
  process.exit(1);
});
