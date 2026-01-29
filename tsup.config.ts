import { defineConfig } from "tsup";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const FONTS_SRC = "src/data/fonts";
const FONTS_DIST = "dist/data/fonts";
const PAGES_SRC = "src/data/pages";
const PAGES_DIST = "dist/data/pages";
const METADATA_SRC = "src/data/metadata";
const METADATA_DIST = "dist/data/metadata";

function copyFonts() {
  if (existsSync(FONTS_SRC)) {
    mkdirSync(FONTS_DIST, { recursive: true });
    copyDir(FONTS_SRC, FONTS_DIST);
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
  },
  format: ["esm"],
  dts: false,
  clean: true,
  splitting: false,
  external: ["react"],
  onSuccess: async () => {
    copyFonts();
    copyData();
    console.log("✓ Data and fonts copied to dist successfully");
  },
});
