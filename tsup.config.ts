import { defineConfig } from "tsup";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const FONTS_SRC = "src/data/fonts";
const FONTS_DIST = "dist/data/fonts";
const SHARED_SRC = "src/data/shared";
const SHARED_DIST = "dist/data/shared";
const PAGES_SRC = "src/data/pages";
const PAGES_DIST = "dist/data/pages";
const METADATA_SRC = "src/data/metadata";
const METADATA_DIST = "dist/data/metadata";
const STATIC_SRC = "src/core/static";
const STATIC_DIST = "dist/core/static";
const ASSETS_SRC = "src/data/assets";
const ASSETS_DIST = "dist/data/assets";
const VIEW_REACT_SRC = "src/view/react";
const VIEW_REACT_DIST = "dist/view/react";
const GLYPH_PATHS_SRC = "src/data/glyph-paths";
const GLYPH_PATHS_DIST = "dist/data/glyph-paths";

function copyFonts() {
  if (existsSync(FONTS_SRC)) {
    mkdirSync(FONTS_DIST, { recursive: true });
    copyDir(FONTS_SRC, FONTS_DIST);
  }
}

// RN-only: copy the TTF directories (hafs-v2-ttf/, hafs-v4-ttf/) into
// dist/data/fonts/ so the published package contains the assets Metro
// will resolve from src/core/static/fonts.rn.ts (after tsup compiles it).
function copyTtfFonts() {
  for (const dir of ["hafs-v2-ttf", "hafs-v4-ttf"]) {
    const src = join(FONTS_SRC, dir);
    if (existsSync(src)) {
      const dst = join(FONTS_DIST, dir);
      copyDir(src, dst);
    }
  }
}

// RN-only: copy the surah-name TTF alongside the existing WOFF2 in
// dist/data/shared/ so the expo-font plugin in the consumer's app.json
// can register it (see Phase 7).
function copySurahNameTtf() {
  const src = join(SHARED_SRC, "surah-name-v4.ttf");
  if (existsSync(src)) {
    mkdirSync(SHARED_DIST, { recursive: true });
    copyFileSync(src, join(SHARED_DIST, "surah-name-v4.ttf"));
  }
}

function copySharedData() {
  if (existsSync(SHARED_SRC)) {
    mkdirSync(SHARED_DIST, { recursive: true });
    copyDir(SHARED_SRC, SHARED_DIST);
  }
}

function copyData() {
  if (existsSync(PAGES_SRC)) {
    mkdirSync(PAGES_DIST, { recursive: true });
    copyDir(PAGES_SRC, PAGES_DIST);
  }
  if (existsSync(METADATA_SRC)) {
    mkdirSync(METADATA_DIST, { recursive: true });
    copyDir(METADATA_SRC, METADATA_DIST);
  }
}

function copyStatic() {
  if (existsSync(STATIC_SRC)) {
    mkdirSync(STATIC_DIST, { recursive: true });
    copyDir(STATIC_SRC, STATIC_DIST);
  }
}

function copyAssets() {
  if (existsSync(ASSETS_SRC)) {
    mkdirSync(ASSETS_DIST, { recursive: true });
    copyDir(ASSETS_SRC, ASSETS_DIST);
  }
}

function copyGlyphPaths() {
  if (existsSync(GLYPH_PATHS_SRC)) {
    mkdirSync(GLYPH_PATHS_DIST, { recursive: true });
    copyDir(GLYPH_PATHS_SRC, GLYPH_PATHS_DIST);
  }
}

function copyViewReactAssets() {
  if (existsSync(VIEW_REACT_SRC)) {
    mkdirSync(VIEW_REACT_DIST, { recursive: true });
    const entries = readdirSync(VIEW_REACT_SRC, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isFile() &&
        (entry.name.endsWith(".svg") ||
          entry.name.endsWith(".png") ||
          entry.name.endsWith(".jpg"))
      ) {
        const srcPath = join(VIEW_REACT_SRC, entry.name);
        const destPath = join(VIEW_REACT_DIST, entry.name);
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

function copyDir(src: string, dest: string) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "view/index": "src/view/react/index.tsx",
    "view/react/index": "src/view/react/index.tsx",
    "view/web/index": "src/view/web/index.ts",
    "view/rn/index": "src/view/rn/index.tsx",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  // `noExternal` is set to `[]` (default) so every import is bundled.
  // The view/rn tree uses `() => require(...)` thunks in the static
  // *.rn.ts modules; those thunks reference TTF / OTF / JSON files
  // (large binaries). Bundling them into dist/view/rn/index.js bloats
  // the published package from KBs to 70+ MB. We tell esbuild to
  // treat those extensions as `empty` (i.e. don't load them at all
  // — the require() call is left for Metro to resolve at runtime in
  // the consumer's app). The actual assets are still copied to
  // dist/data/ by copyData / copyTtfFonts in onSuccess.
  loader: {
    ".ttf": "empty",
    ".otf": "empty",
    ".woff2": "empty",
  },
  external: [
    "react",
    "react-native",
    "expo-font",
    "@react-native/assets-registry",
    // The static *.rn.ts files use `() => require(...)` to lazy-load
    // TTF / OTF / JSON assets. Those calls are resolved by Metro in the
    // consumer's app at runtime; tsup must NOT follow them, otherwise
    // the whole fonts.rn.ts (with 1208 .ttf require() calls) and
    // data.rn.ts (with three pages.json require() calls) gets inlined
    // into dist/view/rn/index.js, bloating it from KBs to 70+ MB.
    /static\/(fonts|data)\.rn/,
  ],
  onSuccess: async () => {
    copyFonts();
    copyTtfFonts();
    copySurahNameTtf();
    copySharedData();
    copyData();
    copyAssets();
    copyStatic();
    copyViewReactAssets();
    copyGlyphPaths();
    console.log("✓ Data and fonts copied to dist successfully");
  },
});
