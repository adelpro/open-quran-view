// Local WOFF2 → TTF conversion. Faster than downloading TTF from the
// Quran Foundation API (the API is heavily rate-limited; the local WOFF2
// assets in src/data/fonts/hafs-{v2,v4}/ are already on disk).
//
// Input:  src/data/fonts/hafs-v2/p{N}.woff2  (604 files)
//         src/data/fonts/hafs-v4/p{N}.woff2  (604 files)
// Output: src/data/fonts/hafs-v2-ttf/p{N}.ttf
//         src/data/fonts/hafs-v4-ttf/p{N}.ttf
//
// Skips files that already exist on disk (resume-friendly). Uses
// wawoff2's WebAssembly-based decompressor.

import { existsSync, statSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import path from "path";
import wawoff2 from "wawoff2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = join(__dirname, "..");
const FONTS_SRC = join(PROJECT_ROOT, "src/data/fonts");

const PARALLELISM = 8;

type Pair = { src: string; dst: string };

function listPairs(layoutIn: string, layoutOut: string): Pair[] {
  const srcDir = join(FONTS_SRC, layoutIn);
  if (!existsSync(srcDir)) {
    throw new Error(`Source directory missing: ${srcDir}`);
  }
  const dstDir = join(FONTS_SRC, layoutOut);
  mkdirSync(dstDir, { recursive: true });

  return readdirSync(srcDir)
    .filter((name) => /^p\d+\.woff2$/i.test(name))
    .map((name) => {
      const page = name.replace(/\.woff2$/i, "");
      return {
        src: join(srcDir, name),
        dst: join(dstDir, `${page}.ttf`),
      };
    })
    .sort((a, b) => a.dst.localeCompare(b.dst));
}

async function convertOne(pair: Pair): Promise<"ok" | "skipped" | "fail"> {
  if (existsSync(pair.dst) && statSync(pair.dst).size > 0) return "skipped";
  try {
    const woff2 = await import("node:fs/promises").then((m) => m.readFile(pair.src));
    const ttf = await wawoff2.decompress(woff2);
    writeFileSync(pair.dst, Buffer.from(ttf));
    return "ok";
  } catch (err) {
    console.error(`  ❌ ${path.basename(pair.src)}: ${(err as Error).message}`);
    return "fail";
  }
}

async function convertLayout(layoutIn: string, layoutOut: string): Promise<void> {
  const pairs = listPairs(layoutIn, layoutOut);
  const total = pairs.length;
  let ok = 0;
  let skipped = 0;
  let fail = 0;
  let nextIdx = 0;
  let lastReported = 0;

  async function worker(): Promise<void> {
    while (true) {
      const idx = nextIdx++;
      if (idx >= pairs.length) return;
      const result = await convertOne(pairs[idx]);
      if (result === "ok") ok++;
      else if (result === "skipped") skipped++;
      else fail++;

      const done = ok + fail;
      if (done - lastReported >= 16 || idx === pairs.length - 1) {
        lastReported = done;
        process.stdout.write(
          `\r  Converting ${layoutIn} → ${layoutOut}: ${done}/${total - skipped} (${ok} new, ${skipped} cached, ${fail} failed)`,
        );
      }
    }
  }

  const workers = Array.from({ length: PARALLELISM }, () => worker());
  await Promise.all(workers);

  console.log(
    `\n  ✅ ${layoutOut}: ${ok} new, ${skipped} cached, ${fail} failed`,
  );
}

async function main() {
  console.log("🚀 Converting WOFF2 → TTF locally using wawoff2...\n");
  try {
    await convertLayout("hafs-v2", "hafs-v2-ttf");
    console.log();
    await convertLayout("hafs-v4", "hafs-v4-ttf");
    console.log("\n✨ WOFF2 → TTF conversion complete!");
  } catch (err) {
    console.error("\n❌ Error:", err);
    process.exit(1);
  }
}

main();