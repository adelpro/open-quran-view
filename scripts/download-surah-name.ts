import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// QUL (Quran Universal Library) on Tarteel's CDN.
// Pairs with the existing src/data/shared/surah-name-v4.woff2 (same version).
// License: not explicitly cited on the QUL page; add a NOTICE file at
// publish time crediting QUL / Tarteel — Phase 8 CHANGELOG item.
const SURAH_NAME_TTF_URL =
  "https://static-cdn.tarteel.ai/qul/fonts/surah-names/v4/surah-name-v4.ttf";

async function main() {
  const outputPath = join(
    __dirname,
    "..",
    "src",
    "data",
    "shared",
    "surah-name-v4.ttf",
  );
  mkdirSync(dirname(outputPath), { recursive: true });

  console.log("🚀 Downloading surah-name v4 TTF from QUL CDN...\n");

  const response = await fetch(SURAH_NAME_TTF_URL);
  if (!response.ok) {
    console.error(
      `❌ Failed to download: ${response.status} ${response.statusText}`,
    );
    process.exit(1);
  }

  const buffer = await response.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✅ Saved to ${outputPath}`);
  console.log(`   Size: ${buffer.byteLength} bytes`);
}

main().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});