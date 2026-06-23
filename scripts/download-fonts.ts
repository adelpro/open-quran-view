import { writeFileSync, mkdirSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FONT_BASE = "https://verses.quran.foundation/fonts/quran/hafs";

// Each layout: [label, woff2SubPath, ttfSubPath]
//   woff2SubPath → hafs-v2/, hafs-v4/  (web font rendering, unchanged)
//   ttfSubPath   → hafs-v2-ttf/, hafs-v4-ttf/  (RN, loaded via expo-font)
const LAYOUTS: Array<{
  version: "v2" | "v4";
  woff2SubPath: string;
  ttfSubPath: string;
  outputDirWoff2: string;
  outputDirTtf: string;
}> = [
  {
    version: "v2",
    woff2SubPath: "v2/woff2",
    ttfSubPath: "v2/ttf",
    outputDirWoff2: join(__dirname, "..", "src", "data", "fonts", "hafs-v2"),
    outputDirTtf: join(__dirname, "..", "src", "data", "fonts", "hafs-v2-ttf"),
  },
  {
    version: "v4",
    woff2SubPath: "v4/colrv1/woff2",
    ttfSubPath: "v4/colrv1/ttf",
    outputDirWoff2: join(__dirname, "..", "src", "data", "fonts", "hafs-v4"),
    outputDirTtf: join(__dirname, "..", "src", "data", "fonts", "hafs-v4-ttf"),
  },
];

async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const buffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

const PARALLELISM = 8;

async function downloadPageFonts(
  version: "v2" | "v4",
  format: "woff2" | "ttf",
  subPath: string,
  outputDir: string,
): Promise<void> {
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  mkdirSync(outputDir, { recursive: true });

  // Build the full job list up front, marking which are cached vs new.
  type Job = { page: number; url: string; outputPath: string; needsFetch: boolean };
  const jobs: Job[] = [];
  for (let page = 1; page <= 604; page++) {
    const outputPath = join(outputDir, `p${page}.${format}`);
    const url = `${FONT_BASE}/${subPath}/p${page}.${format}`;
    const needsFetch = !(existsSync(outputPath) && statSync(outputPath).size > 0);
    jobs.push({ page, url, outputPath, needsFetch });
  }
  skipped = jobs.filter((j) => !j.needsFetch).length;

  // Simple worker pool: pull a job off the queue, fetch, repeat.
  let nextIdx = 0;
  let lastReported = 0;
  const total = jobs.length;

  async function worker(): Promise<void> {
    while (true) {
      const idx = nextIdx++;
      if (idx >= jobs.length) return;
      const job = jobs[idx];
      if (!job.needsFetch) continue;
      const success = await downloadFile(job.url, job.outputPath);
      if (success) downloaded++;
      else failed++;

      // Update progress every ~16 jobs (cheap, low-frequency).
      const done = downloaded + failed;
      if (done - lastReported >= 16 || idx === jobs.length - 1) {
        lastReported = done;
        process.stdout.write(
          `\r  Downloading QCF ${version.toUpperCase()} ${format.toUpperCase()}: ${done}/${total - skipped} (${downloaded} new, ${skipped} cached, ${failed} failed)`,
        );
      }
    }
  }

  const workers = Array.from({ length: PARALLELISM }, () => worker());
  await Promise.all(workers);

  console.log(
    `\n  ✅ ${format.toUpperCase()} v${version}: ${downloaded} new, ${skipped} cached, ${failed} failed`,
  );
}

async function main() {
  console.log("🚀 Starting font downloads...\n");
  console.log("Note: QCF V2 and V4 fonts require 604 downloads each.");
  console.log("Downloading both WOFF2 (web) and TTF (React Native).\n");

  try {
    for (const layout of LAYOUTS) {
      // Web: WOFF2 (existing behavior)
      await downloadPageFonts(
        layout.version,
        "woff2",
        layout.woff2SubPath,
        layout.outputDirWoff2,
      );
      console.log();
      // React Native: TTF (new in Phase 3 of the rn-view-v2 rollout)
      await downloadPageFonts(
        layout.version,
        "ttf",
        layout.ttfSubPath,
        layout.outputDirTtf,
      );
      console.log();
    }

    console.log("✨ Font download complete!");
    console.log("\n⚠️  Note: These fonts are large (~80MB total for both formats).");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();