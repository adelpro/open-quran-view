# Data Generation Guide

> Step-by-step guide for generating Quran data, fonts, and static assets for open-quran-view.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Data Generation Pipeline](#data-generation-pipeline)
4. [Individual Scripts](#individual-scripts)
5. [Generating Static Assets](#generating-static-assets)
6. [Complete Workflow](#complete-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The data generation process creates the local data files needed by open-quran-view:

```
Quran Foundation API → Local Data Files → Static Assets → Runtime
```

### Data Pipeline

| Step | Source | Output |
|------|--------|--------|
| 1. Fetch Metadata | Quran Foundation API | `src/data/metadata/` |
| 2. Fetch Pages | Quran Foundation API | `src/data/pages/` |
| 3. Download Fonts | verses.quran.foundation | `src/data/fonts/` |
| 4. Generate Static Assets | Local data files | `src/core/static/` |

---

## Prerequisites

### Environment Setup

Create a `.env` file with Quran.com API credentials:

```env
QURAN_CLIENT_ID=your_client_id
QURAN_CLIENT_SECRET=your_client_secret
```

**Get credentials:** Visit [Quran.com API](https://quran.com/api) to register.

### Install Dependencies

```bash
yarn install
```

---

## Data Generation Pipeline

### Step 1: Fetch Metadata

Generates surah and juz metadata from the Quran Foundation API.

```bash
yarn generate:metadata
```

**Output:**

```
src/data/metadata/
├── surahs.json    # 114 surahs with names, revelation info, page ranges
└── juz.json       # 30 juz with verse ranges
```

### Step 2: Fetch Page Data

Generates page data for all three Mushaf layouts from the Quran Foundation API.

```bash
yarn generate:pages
```

**Mushaf Configurations:**

| ID | Name | Word Fields | Output |
|----|------|-------------|--------|
| 1 | Hafs QCF V2 | code_v2,text_qpc_hafs,line_number,page_number,position | hafs-v2 |
| 19 | Hafs QCF V4 Tajweed | code_v2,text_qpc_hafs,line_number,page_number,position | hafs-v4 |
| 5 | Hafs Unicode (QPC Hafs) | text_qpc_hafs,line_number,page_number,position | hafs-unicode |

**Output:**

```
src/data/pages/
├── hafs-v2/pages.json       # 604 pages with QCF v2 glyph codes
├── hafs-v4/pages.json       # 604 pages with QCF v4 glyph codes
└── hafs-unicode/pages.json  # 604 pages with Unicode text
```

### Step 3: Download Fonts

Downloads page-specific Quranic fonts from verses.quran.foundation.

```bash
yarn generate:fonts
```

**Font Sources:**

| Layout | Source URL |
|--------|------------|
| V2 | `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p{PAGE}.woff2` |
| V4 | `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p{PAGE}.woff2` |

**Output:**

```
src/data/fonts/
├── hafs-v2/   # 604 .woff2 files (~25MB)
└── hafs-v4/   # 604 .woff2 files (~30MB)
```

**Note:** Fonts total ~50MB and may take several minutes to download.

---

## Individual Scripts

### fetch-metadata.ts

Generates surah and juz metadata.

```bash
tsx scripts/fetch-metadata.ts
```

**What it does:**

1. Loads credentials from `.env`
2. Fetches all 114 surahs from API
3. Fetches all 30 juz from API
4. Saves to `src/data/metadata/`

### fetch-pages.ts

Generates page data for all Mushaf layouts.

```bash
tsx scripts/fetch-pages.ts
```

**What it does:**

1. Loads credentials from `.env`
2. Gets access token via OAuth
3. For each Mushaf (1, 19, 5):
   - Fetches all 604 pages
   - Transforms API response to internal page format
   - Saves to `src/data/pages/{layout}/pages.json`

### download-fonts.ts

Downloads all font files.

```bash
tsx scripts/download-fonts.ts
```

**What it does:**

1. Downloads 604 fonts for QCF V2
2. Downloads 604 fonts for QCF V4
3. Saves to `src/data/fonts/{layout}/`

### generate-static-fonts.ts

Creates static font URL mappings.

```bash
yarn generate:static:fonts
# or
tsx scripts/generate-static-fonts.ts
```

**What it does:**

1. Scans `src/data/fonts/` for all font files
2. Generates TypeScript file with static URLs
3. Outputs to `src/core/static/fonts.ts`

### generate-static-data.ts

Creates static data URL mappings.

```bash
yarn generate:static:data
# or
tsx scripts/generate-static-data.ts
```

**What it does:**

1. Scans `src/data/pages/` and `src/data/metadata/`
2. Generates TypeScript file with static URLs
3. Outputs to `src/core/static/data.ts`

---

## Generating Static Assets

Static assets are pre-generated URLs that work reliably at runtime.

### Run Both Static Generators

```bash
yarn generate:static
```

This runs:

1. `generate-static-fonts.ts` → `src/core/static/fonts.ts`
2. `generate-static-data.ts` → `src/core/static/data.ts`

### Generated Files

**src/core/static/fonts.ts:**

```typescript
export const staticFonts = {
  "hafs-v2": {
    1: new URL("../../data/fonts/hafs-v2/p1.woff2", import.meta.url).href,
    2: new URL("../../data/fonts/hafs-v2/p2.woff2", import.meta.url).href,
    // ... 604 entries
  },
  "hafs-v4": { /* ... */ },
  "hafs-unicode": { /* ... */ },
} as const;

export function getFontUrl(layout: MushafLayout, page: number): string {
  return staticFonts[layout][page];
}
```

**src/core/static/data.ts:**

```typescript
export const staticData = {
  pages: {
    "hafs-v2": new URL("../../data/pages/hafs-v2/pages.json", import.meta.url).href,
    // ...
  },
  metadata: {
    surahs: new URL("../../data/metadata/surahs.json", import.meta.url).href,
    juz: new URL("../../data/metadata/juz.json", import.meta.url).href,
  },
} as const;
```

---

## Complete Workflow

### Fresh Setup

```bash
# 1. Install dependencies
yarn install

# 2. Generate all data (metadata + pages + fonts)
yarn generate:all

# 3. Generate static assets
yarn generate:static

# 4. Build the package
yarn build
```

### Automated (on install)

```bash
yarn install
```

The `prepare` script runs automatically:

- `yarn generate:all`
- `yarn build`

### Manual Step-by-Step

```bash
# Step 1: Generate metadata
yarn generate:metadata

# Step 2: Generate page data
yarn generate:pages

# Step 3: Download fonts
yarn generate:fonts

# Step 4: Generate static assets
yarn generate:static

# Step 5: Build
yarn build
```

---

## Troubleshooting

### Error: QURAN_CLIENT_ID not set

**Problem:** Missing credentials in `.env`

**Solution:**

```bash
# Create .env file
echo "QURAN_CLIENT_ID=your_id" > .env
echo "QURAN_CLIENT_SECRET=your_secret" >> .env
```

### Error: Network errors during fetch

**Problem:** API rate limiting or network issues

**Solution:** The scripts have built-in delays. If issues persist:

1. Check your internet connection
2. Verify API credentials
3. Try again after a few minutes

### Error: Font download failures

**Problem:** Some fonts fail to download

**Solution:** The download script shows progress. Failures are expected due to:

- Network issues
- Server rate limiting

Re-run to download missing fonts:

```bash
yarn generate:fonts
```

### Generated files not found at runtime

**Problem:** Static assets not generated

**Solution:** Run static asset generation:

```bash
yarn generate:static
```

---

## File Sizes

| Directory | Size | Notes |
|-----------|------|-------|
| `src/data/metadata/` | ~100 KB | Small, committed to git |
| `src/data/pages/hafs-v2/` | ~25 MB | Git-ignored |
| `src/data/pages/hafs-v4/` | ~25 MB | Git-ignored |
| `src/data/fonts/hafs-v2/` | ~25 MB | Git-ignored |
| `src/data/fonts/hafs-v4/` | ~30 MB | Git-ignored |
| **Total** | ~105 MB | Excludes metadata |

---

## Related Documentation

- [API Integration Guide](api-integration.md) - Quran Foundation API details
- [Data Structure](architecture/data-structure.md) - File formats
- [Static Assets Architecture](architecture/static-assets.md) - How static URLs work
- [Mushaf Comparison](guides/mushaf-comparison.md) - Choosing Mushaf layouts
