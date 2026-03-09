# Static Assets Architecture

> Guide to the static asset system in open-quran-view v0.2.0+

## Overview

Version 0.2.0 introduced a **static asset URL generation system** that resolves font and data loading issues. The system generates TypeScript files with pre-resolved URLs at build time, eliminating runtime `import.meta.url` issues.

## Directory Structure

```
src/
├── core/
│   └── static/
│       ├── fonts.ts      # Generated font URLs (1200+ entries)
│       └── data.ts       # Generated data URLs
├── data/
│   ├── fonts/           # Font source files (woff2)
│   ├── pages/          # Page data JSON
│   ├── metadata/       # Surah and juz JSON
│   └── shared/         # Shared fonts (surah names)
└── scripts/
    └── generate-static-*.ts  # Generation scripts
```

## How It Works

### 1. Generation Phase

Scripts in `scripts/generate-static-*.ts` scan the `data/` directory and generate TypeScript files with resolved URLs:

```typescript
// src/core/static/fonts.ts (generated)
export const staticFonts = {
  "hafs-v2": {
    1: new URL("../../data/fonts/hafs-v2/p1.woff2", import.meta.url).href,
    2: new URL("../../data/fonts/hafs-v2/p2.woff2", import.meta.url).href,
    // ... 604 pages
  },
  "hafs-v4": { /* ... */ },
  "hafs-unicode": { /* ... */ },
} as const;
```

### 2. Build Phase

The `tsup.config.ts` copies both source data and generated static files to `dist/`:

```typescript
onSuccess: async () => {
  copyFonts();      // src/data/fonts → dist/data/fonts
  copyData();       // src/data/pages, metadata → dist/data/*
  copyStatic();     // src/core/static → dist/core/static
}
```

### 3. Runtime Phase

The package imports from `core/static/` URLs, which are now correctly resolved:

```typescript
import { getFontUrl } from 'open-quran-view/core/static/fonts';
import { getPagesUrl } from 'open-quran-view/core/static/data';

const fontUrl = getFontUrl('hafs-v2', 1);
const pagesUrl = getPagesUrl('hafs-v2');
```

## Generated Files

### `src/core/static/fonts.ts`

| Layout | Pages | Format |
|--------|-------|--------|
| `hafs-v2` | 604 | woff2 |
| `hafs-v4` | 604 | woff2 |
| `hafs-unicode` | varies | otf/ttf |

**Exports:**

```typescript
export const staticFonts: { [layout]: { [page]: string } }
export function getFontUrl(layout: MushafLayout, page: number): string
export function getUnicodeFontUrl(type: "digitalkhatt" | "ayatquran"): string
```

### `src/core/static/data.ts`

```typescript
export const staticData = {
  pages: {
    "hafs-unicode": "...",
    "hafs-v2": "...",
    "hafs-v4": "...",
  },
  metadata: {
    juz: "...",
    surahs: "...",
  },
  shared: {
    surahname: "...",
  },
};

export function getPagesUrl(layout: string): string
export function getMetadataUrl(type: "surahs" | "juz"): string
export function getSurahNameFontUrl(): string
```

## Scripts

| Script | Description |
|--------|-------------|
| `yarn generate:static:fonts` | Generates `fonts.ts` from `data/fonts/` |
| `yarn generate:static:data` | Generates `data.ts` from `data/` |
| `yarn generate:all` | Runs all generation scripts |
| `yarn prepare` | Auto-generates + builds on `yarn install` |

## Build Output

```
dist/
├── core/
│   └── static/
│       ├── fonts.ts      # Copied from src/core/static/
│       └── data.ts       # Copied from src/core/static/
├── data/
│   ├── fonts/           # Copied from src/data/fonts/
│   ├── pages/          # Copied from src/data/pages/
│   ├── metadata/       # Copied from src/data/metadata/
│   └── shared/         # Copied from src/data/shared/
└── view/
    ├── react/          # Built React component
    └── web/            # Built Web Component
```

## Package Exports

```json
{
  "exports": {
    "./view": { "types": "...", "import": "..." },
    "./view/react": { "types": "...", "import": "..." },
    "./view/web": { "types": "...", "import": "..." }
  }
}
```

## Troubleshooting

### Fonts Not Loading

Ensure `prepare` script ran during installation:

```bash
# If fonts are missing, regenerate manually
yarn generate:static
yarn build
```

### 404 on Font Files

Verify `dist/data/fonts/` exists and contains font files. The build process should copy them automatically.

### Version Mismatch

Static assets are tied to the package version. After upgrading, reinstall:

```bash
rm -rf node_modules yarn.lock
yarn install
```

## Related Files

- [`tsup.config.ts`](../../tsup.config.ts) - Build configuration
- [`scripts/generate-static-fonts.ts`](../../scripts/generate-static-fonts.ts) - Font generation
- [`scripts/generate-static-data.ts`](../../scripts/generate-static-data.ts) - Data generation
- [`src/core/static/fonts.ts`](../../src/core/static/fonts.ts) - Generated font URLs
- [`src/core/static/data.ts`](../../src/core/static/data.ts) - Generated data URLs
