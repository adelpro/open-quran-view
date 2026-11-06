import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { QuranClient } from "@quranjs/api";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): { clientId: string; clientSecret: string } {
  let clientId = process.env.QF_CLIENT_ID;
  let clientSecret = process.env.QF_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const envPath = join(__dirname, "..", ".env");
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          if (key.trim() === "QF_CLIENT_ID") clientId = value.trim();
          if (key.trim() === "QF_CLIENT_SECRET") clientSecret = value.trim();
        }
      });
    }
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      "QF_CLIENT_ID and QF_CLIENT_SECRET must be set in .env file",
    );
  }

  return { clientId, clientSecret };
}

async function main() {
  console.log("🚀 Fetching Quran metadata...\n");

  const { clientId, clientSecret } = loadEnv();
  console.log("✅ Loaded environment variables");

  const client = new QuranClient({ clientId, clientSecret });

  console.log("📚 Fetching surah metadata...");
  const chapters = await client.chapters.findAll();
  process.stdout.write(`\r  Fetching surahs: ${chapters.length}/114`);
  console.log(`\n   Found ${chapters.length} surahs`);

  console.log("📖 Fetching juz metadata...");
  const juzs = await client.juzs.findAll();
  process.stdout.write(`\r  Fetching juzs: ${juzs.length}/30`);
  console.log(`\n   Found ${juzs.length} juzs`);

  const metadataDir = join(__dirname, "..", "src", "data", "metadata");
  mkdirSync(metadataDir, { recursive: true });

  const chaptersFormatted = chapters.map((chapter) => ({
    id: chapter.id,
    nameSimple: chapter.nameSimple,
    nameComplex: chapter.nameComplex,
    transliteratedName: chapter.transliteratedName,
    nameArabic: chapter.nameArabic,
    versesCount: chapter.versesCount,
    revelationPlace: chapter.revelationPlace,
    revelationOrder: chapter.revelationOrder,
    bismillahPre: chapter.bismillahPre,
    pages: chapter.pages,
    translatedName: chapter.translatedName,
  }));

  writeFileSync(
    join(metadataDir, "surahs.json"),
    JSON.stringify(chaptersFormatted, null, 2),
    "utf-8",
  );
  console.log(`✅ Saved surahs to ${join(metadataDir, "surahs.json")}`);

  const juzsFormatted = juzs.map((juz) => ({
    id: juz.id,
    juzNumber: juz.juzNumber,
    firstVerseId: juz.firstVerseId,
    lastVerseId: juz.lastVerseId,
    versesCount: juz.versesCount,
    verseMapping: juz.verseMapping,
  }));

  writeFileSync(
    join(metadataDir, "juz.json"),
    JSON.stringify(juzsFormatted, null, 2),
    "utf-8",
  );
  console.log(`✅ Saved juz to ${join(metadataDir, "juz.json")}`);

  console.log("\n✨ Metadata generation complete!");
}

main().catch((error) => {
  console.error("\n❌ Error:", error);
  process.exit(1);
});
