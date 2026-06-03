import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FONT_BASE = "https://verses.quran.foundation/fonts/quran/hafs";

async function downloadFile(url: string, outputPath: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));
    return true;
  } catch {
    return false;
  }
}

async function downloadPageFonts(
  version: "v2" | "v4",
  subPath: string,
  outputDir: string,
): Promise<void> {
  let downloaded = 0;
  let failed = 0;

  mkdirSync(outputDir, { recursive: true });

  for (let page = 1; page <= 604; page++) {
    const url = `${FONT_BASE}/${subPath}/p${page}.ttf`;
    const outputPath = join(outputDir, `p${page}.ttf`);

    const success = await downloadFile(url, outputPath);

    if (success) {
      downloaded++;
    } else {
      failed++;
    }

    process.stdout.write(
      `\r  Downloading QCF ${version.toUpperCase()}: ${page}/604 (${downloaded} ok, ${failed} failed)`,
    );
  }

  console.log(`\n  ✅ Downloaded ${downloaded}/${604} font files`);
}

async function main() {
  console.log("🚀 Starting font downloads...\n");

  try {
    console.log("Note: QCF V2 and V4 fonts require 604 downloads each.");
    console.log("This may take several minutes...\n");

    await downloadPageFonts(
      "v2",
      "v2/ttf",
      join(__dirname, "..", "src", "data", "fonts", "hafs-v2"),
    );
    console.log();
    await downloadPageFonts(
      "v4",
      "v4/colrv1/ttf",
      join(__dirname, "..", "src", "data", "fonts", "hafs-v4"),
    );

    console.log("\n✨ Font download complete!");
    console.log("\n⚠️  Note: These fonts are large (~50MB total).");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();

