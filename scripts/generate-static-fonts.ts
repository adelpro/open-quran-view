import { readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, "..");
const FONTS_SRC = join(PROJECT_ROOT, "src/data/fonts");
const STATIC_OUT = join(PROJECT_ROOT, "src/core/static");

function getAllFonts(dir: string, baseDir: string = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFonts(fullPath, baseDir));
    } else if (entry.isFile() && /\.(woff2|otf|ttf)$/i.test(entry.name)) {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files;
}

const HELPER_FUNCTIONS = `
export function getFontUrl(layout: MushafLayout, page: number): string {
  const pageStr = String(page);
  const url = staticFonts[layout]?.[pageStr as keyof (typeof staticFonts)[MushafLayout]];
  if (!url) throw new Error(\`Font not found: \${layout}/\${page}\`);
  return url;
}

export function getUnicodeFontUrl(type: "digitalkhatt" | "ayatquran"): string {
  const url = staticFonts["hafs-unicode"]?.[type as keyof (typeof staticFonts)["hafs-unicode"]];
  if (!url) throw new Error(\`Unicode font not found: \${type}\`);
  return url;
}
`;

/** Generates fonts.web.ts – uses new URL(…, import.meta.url).href for Vite/tsup */
function generateWebFonts(): string {
  let output = `import type { MushafLayout } from "../types";\n\n`;
  output += `export const staticFonts = {\n`;

  const layouts = ["hafs-v2", "hafs-v4", "hafs-unicode"];

  for (const layout of layouts) {
    const layoutPath = join(FONTS_SRC, layout);
    if (!statSync(layoutPath, { throwIfNoEntry: false })) continue;

    const fonts = getAllFonts(layoutPath);
    if (fonts.length === 0) continue;

    output += `  "${layout}": {\n`;

    if (layout === "hafs-unicode") {
      for (const font of fonts) {
        // Normalise the key: strip extension and lower-case
        let name = font.replace(/\.(otf|ttf|woff2)$/i, "").toLowerCase();
        // Handle the versioned file name AyatQuran2-PVKGm.ttf → ayatquran
        if (name.startsWith("ayatquran")) name = "ayatquran";
        output += `    ${name}: new URL(\n`;
        output += `      "../../data/fonts/${layout}/${font.replace(/\\/g, "/")}",\n`;
        output += `      import.meta.url,\n`;
        output += `    ).href,\n`;
      }
    } else {
      for (const font of fonts) {
        const pageNum = font.replace(/^p|\.(woff2|ttf|otf)$/gi, "");
        output += `    ${pageNum}: new URL("../../data/fonts/${layout}/${font.replace(/\\/g, "/")}", import.meta.url).href,\n`;
      }
    }

    output += `  },\n`;
  }

  output += `} as const;\n\n`;
  output += `export type StaticFonts = typeof staticFonts;\n`;
  output += HELPER_FUNCTIONS;

  return output;
}

/** Generates fonts.rn.ts – uses require() thunks resolved by Metro */
function generateRnFonts(): string {
  let output = `import type { MushafLayout } from "../types";\n\n`;
  output += `export const staticFonts = {\n`;

  const layouts = ["hafs-v2", "hafs-v4", "hafs-unicode"];

  for (const layout of layouts) {
    const layoutPath = join(FONTS_SRC, layout);
    if (!statSync(layoutPath, { throwIfNoEntry: false })) continue;

    const fonts = getAllFonts(layoutPath);
    if (fonts.length === 0) continue;

    output += `  "${layout}": {\n`;

    if (layout === "hafs-unicode") {
      for (const font of fonts) {
        let name = font.replace(/\.(otf|ttf|woff2)$/i, "").toLowerCase();
        if (name.startsWith("ayatquran")) name = "ayatquran";
        output += `    ${name}: require("../../data/fonts/${layout}/${font.replace(/\\/g, "/")}"),\n`;
      }
    } else {
      for (const font of fonts) {
        const pageNum = font.replace(/^p|\.(woff2|ttf|otf)$/gi, "");
        output += `    ${pageNum}: () => require("../../data/fonts/${layout}/${font.replace(/\\/g, "/")}"),\n`;
      }
    }

    output += `  },\n`;
  }

  output += `} as const;\n\n`;
  output += `export type StaticFonts = typeof staticFonts;\n`;
  output += HELPER_FUNCTIONS;

  return output;
}

mkdirSync(STATIC_OUT, { recursive: true });

// Web variant (keeps backward-compat name fonts.ts as well for tsup)
const webContent = generateWebFonts();
writeFileSync(join(STATIC_OUT, "fonts.web.ts"), webContent, "utf-8");
writeFileSync(join(STATIC_OUT, "fonts.ts"), webContent, "utf-8");
console.log(`Generated ${STATIC_OUT}/fonts.web.ts (and fonts.ts alias)`);

// React Native variant
const rnContent = generateRnFonts();
writeFileSync(join(STATIC_OUT, "fonts.rn.ts"), rnContent, "utf-8");
console.log(`Generated ${STATIC_OUT}/fonts.rn.ts`);
