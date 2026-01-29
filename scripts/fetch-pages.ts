import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface MushafConfig {
  id: number;
  name: string;
  wordFields: string;
  outputDir: string;
}

const MUSHAF_CONFIGS: MushafConfig[] = [
  {
    id: 1,
    name: "Hafs QCF V2",
    wordFields: "code_v2,text_qpc_hafs,line_number,page_number,position",
    outputDir: "src/data/pages/hafs-v2",
  },
  {
    id: 19,
    name: "Hafs QCF V4 Tajweed",
    wordFields: "code_v2,text_qpc_hafs,line_number,page_number,position",
    outputDir: "src/data/pages/hafs-v4",
  },
  {
    id: 5,
    name: "Hafs Unicode (QPC Hafs)",
    wordFields: "text_qpc_hafs,line_number,page_number,position",
    outputDir: "src/data/pages/hafs-unicode",
  },
];

const API_BASE = "https://apis.quran.foundation/content/api/v4";
const RATE_LIMIT_DELAY = 100;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadEnv(): { clientId: string; clientSecret: string } {
  const envPath = join(__dirname, "..", ".env");
  const envExamplePath = join(__dirname, "..", ".env.example");

  let clientId = process.env.QURAN_CLIENT_ID;
  let clientSecret = process.env.QURAN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          if (key.trim() === "QURAN_CLIENT_ID") clientId = value.trim();
          if (key.trim() === "QURAN_CLIENT_SECRET") clientSecret = value.trim();
        }
      });
    }
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      "QURAN_CLIENT_ID and QURAN_CLIENT_SECRET must be set in .env file",
    );
  }

  return { clientId, clientSecret };
}

async function getAccessToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://oauth2.quran.foundation/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=content",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchPageData(
  pageNumber: number,
  mushafId: number,
  wordFields: string,
  accessToken: string,
  clientId: string,
) {
  const url = `${API_BASE}/verses/by_page/${pageNumber}?words=true&mushaf=${mushafId}&word_fields=${wordFields}`;

  const response = await fetch(url, {
    headers: {
      "x-auth-token": accessToken,
      "x-client-id": clientId,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch page ${pageNumber}: ${response.statusText}`,
    );
  }

  return await response.json();
}

function transformToV3Format(apiResponse: any, pageNumber: number) {
  const linesMap: Record<number, any> = {};
  const surahStarts: { chapterId: number; startLine: number }[] = [];
  const processedVerses = new Set<string>();

  apiResponse.verses.forEach((verse: any) => {
    // Track Surah starts (Verse 1)
    const verseKeyParts = verse.verse_key.split(":");
    const chapterId = parseInt(verseKeyParts[0]);
    const verseNum = parseInt(verseKeyParts[1]);

    if (verseNum === 1 && !processedVerses.has(verse.verse_key)) {
        let minLine = 999;
        // Find the specific line where this verse starts on THIS page
        // Some verses span pages, so we filter words by page_number if strictly needed, 
        // but apiResponse is usually scoped to page.
        // However, 'words' array in apiResponse might include words from other pages if the verse spans?
        // The API `by_page` usually returns full verses. We must check word.page_number.
        const wordsOnPage = verse.words.filter((w: any) => w.page_number === pageNumber);
        
        if (wordsOnPage.length > 0) {
            wordsOnPage.forEach((w: any) => {
                if (w.line_number < minLine) minLine = w.line_number;
            });
            if (minLine !== 999) {
                surahStarts.push({ chapterId, startLine: minLine });
            }
        }
    }
    processedVerses.add(verse.verse_key);

    verse.words.forEach((word: any) => {
      // Filter words not on this page (important for spanning verses)
      if (word.page_number !== pageNumber) return;

      const lineNum = word.line_number;

      if (!linesMap[lineNum]) {
        linesMap[lineNum] = {
          lineNumber: lineNum,
          words: [],
          isCentered: false, // Default
          lineType: "text",
          metadata: {
            verseId: verse.id,
            verseKey: verse.verse_key,
            chapterId: verse.chapter_id || chapterId,
          },
        };
      }

      linesMap[lineNum].words.push({
        id: word.id,
        position: word.position,
        text: word.text || word.text_qpc_hafs,
        code_v2: word.code_v2,
        pageNumber: word.page_number,
        charType: word.char_type_name,
        surah: chapterId,
        verse: verseNum,
      });
    });
  });

  // Inject Headers and Bismillahs
  surahStarts.forEach(({ chapterId, startLine }) => {
      // Surah 1: Header at startLine - 1 (Verse 1 is Bismillah)
      // Surah 9: Header at startLine - 1 (No Bismillah)
      // Others: Bismillah at startLine - 1, Header at startLine - 2

      if (chapterId === 1 || chapterId === 9) {
          const headerLine = startLine - 1;
          if (headerLine > 0 && !linesMap[headerLine]) {
              linesMap[headerLine] = {
                  lineNumber: headerLine,
                  words: [],
                  isCentered: true,
                  lineType: "header",
                  metadata: { chapterId },
                  surahNumber: chapterId
              };
          }
      } else {
          const bismillahLine = startLine - 1;
          const headerLine = startLine - 2;

          if (bismillahLine > 0 && !linesMap[bismillahLine]) {
              linesMap[bismillahLine] = {
                  lineNumber: bismillahLine,
                  words: [], // Empty words, renderer draws Bismillah
                  isCentered: true,
                  lineType: "bismillah",
                  metadata: { chapterId }
              };
          }
          if (headerLine > 0 && !linesMap[headerLine]) {
              linesMap[headerLine] = {
                  lineNumber: headerLine,
                  words: [], // Empty words, renderer draws Header
                  isCentered: true,
                  lineType: "header",
                  metadata: { chapterId },
                  surahNumber: chapterId
              };
          }
      }
  });

  return Object.values(linesMap).sort(
    (a: any, b: any) => a.lineNumber - b.lineNumber,
  );
}

async function generatePagesForMushaf(
  config: MushafConfig,
  accessToken: string,
  clientId: string,
) {
  console.log(`\n📖 Generating ${config.name}...`);

  const allPages: any[] = [];

  for (let pageNum = 1; pageNum <= 604; pageNum++) {
    try {
      const apiData = await fetchPageData(
        pageNum,
        config.id,
        config.wordFields,
        accessToken,
        clientId,
      );

      const v3Data = transformToV3Format(apiData, pageNum);
      
      const pageObj: any = {
        pageNumber: pageNum,
        lines: v3Data,
      };

      // Flag Pages 1 and 2 for vertical centering
      if (pageNum === 1 || pageNum === 2) {
          pageObj.isVerticallyCentered = true;
      }

      allPages.push(pageObj);

      process.stdout.write(`\r  ${config.name}: ${pageNum}/604`);

      await sleep(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`  ❌ Error on page ${pageNum}:`, error);
      throw error;
    }
  }

  process.stdout.write(`\r  ${config.name}: Done!                    \n`);

  mkdirSync(config.outputDir, { recursive: true });

  const outputPath = join(config.outputDir, "pages.json");
  writeFileSync(outputPath, JSON.stringify(allPages, null, 2), "utf-8");

  console.log(`  ✅ Saved to ${outputPath}`);
  console.log(`  📊 Total pages: ${allPages.length}`);
}

async function main() {
  console.log("🚀 Starting page data generation for all Mushaf layouts...\n");

  try {
    const { clientId, clientSecret } = loadEnv();
    console.log("✅ Loaded environment variables\n");

    const accessToken = await getAccessToken(clientId, clientSecret);
    console.log("✅ Got access token\n");

    for (const config of MUSHAF_CONFIGS) {
      await generatePagesForMushaf(config, accessToken, clientId);
    }

    console.log("\n✨ All Mushaf layouts generated successfully!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
