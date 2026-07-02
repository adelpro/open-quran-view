// Generates src/core/static/fonts.rn.ts — RN-side font loader.
//
// Each layout key exposes a single `forPage(page)` function rather than a
// pre-baked `() => require("…/pNNN.ttf")` thunk per page. The function
// builds the require() argument at runtime and dispatches it through a
// Function constructor so Metro's static analyzer cannot follow the path.
// Only the TTFs actually fetched at runtime enter the bundle dependency
// graph.
//
// Previously this file emitted 604 static thunks per layout, which caused
// Metro to bundle the full ~200 MB of hafs-v2 / hafs-v4 TTFs into every
// consumer's initial bundle. The playground (and any consumer that only
// renders a single page at startup) now starts from a tiny bundle and
// pays the font cost only when navigation reaches a new page.
//
// The static `digitalkhatt` / `ayatquran` / `surahname` entries stay as
// one-shot thunks — there are only 3 of them and they're always loaded
// together at app startup.

import { readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = join(__dirname, "..");
const FONTS_SRC = join(PROJECT_ROOT, "src/data/fonts");
const SHARED_SRC = join(PROJECT_ROOT, "src/data/shared");
const STATIC_OUT = join(PROJECT_ROOT, "src/core/static");

// hafs-{v2,v4}-ttf → per-page loaders, keyed by the *layout name* (hafs-v2 / hafs-v4)
// so consumers can index `staticFonts[layout].forPage(p)` with the standard
// MushafLayout enum. The directory name is an implementation detail.
// hafs-unicode     → 2 keys: digitalkhatt (otf), ayatquran (ttf, special-cased)
const PAGE_LAYOUTS: Array<[layoutKey: string, dirName: string]> = [
  ["hafs-v2", "hafs-v2-ttf"],
  ["hafs-v4", "hafs-v4-ttf"],
];

function pageNumFromName(filename: string): number | null {
  const m = filename.match(/^p(\d+)\.ttf$/i);
  if (!m) return null;
  return Number(m[1]);
}

function buildPagesBlock(
  layoutKey: string,
  dirName: string,
): string {
  const dir = join(FONTS_SRC, dirName);
  if (!statSync(dir, { throwIfNoEntry: false })) {
    throw new Error(
      `RN font directory missing: ${dir}. Run scripts/download-fonts.ts or scripts/convert-woff2-to-ttf.ts first.`,
    );
  }
  const entries = readdirSync(dir)
    .map((name) => ({ name, page: pageNumFromName(name) }))
    .filter((e): e is { name: string; page: number } => e.page !== null)
    .sort((a, b) => a.page - b.page);

  if (entries.length === 0) {
    throw new Error(`No p*.ttf files found in ${dir}`);
  }

  // Sanity check: a single dynamic loader replaces what used to be 604
  // per-page entries. Verify we still see the expected number of pages so
  // a half-generated font directory fails loud rather than silently
  // emitting a loader for fewer pages than the published package claims.
  if (entries.length < 100) {
    throw new Error(
      `Expected ≥100 page TTFs in ${dir}, found ${entries.length}. ` +
        `Refusing to emit a dynamic loader with a suspiciously small page set.`,
    );
  }

  // Emit a single runtime loader. The require() is wrapped in a
  // Function constructor so Metro's static analyzer cannot follow it;
  // only the page actually requested enters the dependency graph. The
  // path prefix is rewritten by tsup.config.ts#copyRnStaticModules when
  // the file is copied to dist/view/rn/static/ (../../data/ →
  // ../../../data/) so the require resolves from the deeper dist tree.
  //
  // We deliberately keep `num` as a runtime concat rather than a static
  // template so the rewritten prefix (when copied) stays correct.
  //
  // Why new Function and not eval: Metro (>=0.81, the Expo SDK 53
  // default) has a static analyzer that scans string literals passed to
  // eval() for require() calls and walks those paths even when the
  // argument is partially runtime-built. It treats the literal-prefix
  // "../../data/fonts/<dir>/p" + ".ttf" as a discoverable require
  // target. Metro does NOT decompile the body of a Function constructed
  // via the Function constructor, so the require here is invisible to
  // the static analyzer.
  return (
    `  "${layoutKey}": {\n` +
    `    // Dynamic per-page loader. The require is called inside a Function\n` +
    `    // constructor so Metro's static analyzer cannot follow it — only\n` +
    `    // the TTF for the page actually rendered enters the dependency graph.\n` +
    `    forPage: (page: number): unknown => {\n` +
    `      const num = String(page).padStart(3, "0");\n` +
    `      const dynamicRequire: (p: string) => unknown = new Function(\n` +
    `        "p",\n` +
    `        "return require(p);",\n` +
    `      ) as (p: string) => unknown;\n` +
    `      return dynamicRequire(\n` +
    `        "../../data/fonts/${dirName}/p" + num + ".ttf",\n` +
    `      );\n` +
    `    },\n` +
    `  },`
  );
}

function buildUnicodeBlock(): string {
  // Walk src/data/fonts/hafs-unicode/ and emit the 2 keys we care about.
  // Mirrors the lowercase + special-case logic from scripts/generate-static-fonts.ts.
  const dir = join(FONTS_SRC, "hafs-unicode");
  if (!statSync(dir, { throwIfNoEntry: false })) {
    throw new Error(`hafs-unicode font directory missing: ${dir}`);
  }

  const wanted: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const lower = name.replace(/\.(otf|ttf)$/i, "").toLowerCase();
    let key: string;
    if (lower === "ayatquran2-pvkgm") key = "ayatquran";
    else if (lower === "digitalkhatt") key = "digitalkhatt";
    else continue; // skip anything else
    wanted[key] = name;
  }

  if (!wanted.digitalkhatt || !wanted.ayatquran) {
    throw new Error(
      `hafs-unicode must contain digitalkhatt.* and AyatQuran2-PVKGm.ttf; got ${JSON.stringify(wanted)}`,
    );
  }

  return (
    `  "hafs-unicode": {\n` +
    `    digitalkhatt: () => require("../../data/fonts/hafs-unicode/${wanted.digitalkhatt}"),\n` +
    `    ayatquran: () => require("../../data/fonts/hafs-unicode/${wanted.ayatquran}"),\n` +
    `  },`
  );
}

function buildSurahnameBlock(): string {
  const path = join(SHARED_SRC, "surah-name-v4.ttf");
  if (!statSync(path, { throwIfNoEntry: false })) {
    throw new Error(
      `surah-name-v4.ttf not found at ${path}. Run scripts/download-surah-name.ts first.`,
    );
  }
  return `  surahname: () => require("../../data/shared/surah-name-v4.ttf"),`;
}

function generateFontsRn(): string {
  const blocks: string[] = [];
  for (const [layoutKey, dirName] of PAGE_LAYOUTS) {
    blocks.push(buildPagesBlock(layoutKey, dirName));
  }
  blocks.push(buildUnicodeBlock());
  blocks.push(buildSurahnameBlock());

  return (
    `// AUTO-GENERATED by scripts/generate-static-fonts-rn.ts — do not edit.\n` +
    `//\n` +
    `// Per-layout font loaders for RN. Page-specific TTF assets are loaded\n` +
    `// via a runtime-built require() dispatched through a Function\n` +
    `// constructor so Metro cannot statically walk the entire 604-page\n` +
    `// font graph into the initial bundle. Only the TTF for the page\n` +
    `// actually rendered enters the dependency graph. Shared fonts\n` +
    `// (DigitalKhatt, AyatQuran, SurahName) stay as static one-shot thunks\n` +
    `// because they're always loaded together at app startup.\n` +
    `\n` +
    `export const staticFonts = {\n` +
    blocks.join("\n") +
    `\n} as const;\n`
  );
}

const content = generateFontsRn();
mkdirSync(STATIC_OUT, { recursive: true });
const outputPath = join(STATIC_OUT, "fonts.rn.ts");
writeFileSync(outputPath, content, "utf-8");
console.log(`Generated ${outputPath}`);