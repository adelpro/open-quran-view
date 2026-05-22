import fs from "node:fs";
import path from "node:path";

// Types for glyph path extraction
type GlyphPath = {
  advanceWidth: number;
  leftSideBearing: number;
  path: string; // SVG path d attribute
};

type GlyphMap = Record<number, GlyphPath>; // codepoint -> path data

const FONTS_DIR = path.resolve("src/data/fonts");
const OUTPUT_DIR = path.resolve("src/data/glyph-paths");

const LAYOUTS = ["hafs-v2", "hafs-v4", "hafs-unicode"] as const;

async function extractGlyphPaths(fontPath: string): Promise<GlyphMap> {
  const opentype = await import("opentype.js");
  const font = opentype.load(fontPath);

  const glyphMap: GlyphMap = {};

  for (const glyph of font.glyphs) {
    if (glyph.unicode === undefined) continue;

    const codepoint = glyph.unicode;
    const glyphPath = glyph.getPath(0, 0, 1);

    glyphMap[codepoint] = {
      advanceWidth: glyph.advanceWidth ?? 0,
      leftSideBearing: glyph.leftSideBearing ?? 0,
      path: glyphPath.toSVG(2),
    };
  }

  return glyphMap;
}

async function processLayout(layout: string): Promise<void> {
  const fontDir = path.join(FONTS_DIR, layout);
  const outputDir = path.join(OUTPUT_DIR, layout);

  if (!fs.existsSync(fontDir)) {
    console.warn(`Font directory not found: ${fontDir}, skipping`);
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(fontDir);

  for (const file of files) {
    if (!file.endsWith(".woff2") && !file.endsWith(".ttf") && !file.endsWith(".otf")) {
      continue;
    }

    const fontPath = path.join(fontDir, file);
    const baseName = path.basename(file, path.extname(file));
    const outputPath = path.join(outputDir, `${baseName}-glyphs.json`);

    console.log(`Extracting glyph paths from ${fontPath}...`);

    try {
      const glyphMap = await extractGlyphPaths(fontPath);
      fs.writeFileSync(outputPath, JSON.stringify(glyphMap, null, 2));
      console.log(`  -> ${outputPath} (${Object.keys(glyphMap).length} glyphs)`);
    } catch (err) {
      console.error(`  Failed to extract ${fontPath}: ${err}`);
    }
  }
}

async function main() {
  console.log("Starting glyph path extraction...\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const layout of LAYOUTS) {
    console.log(`Processing layout: ${layout}`);
    await processLayout(layout);
    console.log("");
  }

  console.log("Glyph path extraction complete.");
}

main().catch(console.error);