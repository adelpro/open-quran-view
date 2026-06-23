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
  external: [
    "react",
    "react-native",
    "expo-font",
    "@react-native/assets-registry",
  ],
  onSuccess: async () => {
    copyFonts();
    copySharedData();
    copyData();
    copyAssets();
    copyStatic();
    copyViewReactAssets();
    copyGlyphPaths();
    console.log("✓ Data and fonts copied to dist successfully");
  },
});
