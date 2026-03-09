# Data Structure & File Structure

> Complete reference for the project directory structure, data organization, and file formats.

---

## Project Root Structure

```
open-quran-view/
├── src/                          # Source code
│   ├── core/                     # Framework-agnostic core module
│   │   ├── index.ts              # Main exports
│   │   ├── types.ts              # TypeScript type definitions
│   │   ├── data-loader.ts        # Data loading with caching
│   │   ├── font-loader.ts        # Font URL generation
│   │   ├── lookup.ts             # Navigation & verse lookup
│   │   └── static/               # Generated static assets (v0.2.0+)
│   │       ├── fonts.ts           # Static font URLs
│   │       └── data.ts            # Static data URLs
│   ├── view/                     # View implementations
│   │   ├── react/                # React components
│   │   │   ├── index.tsx
│   │   │   └── adapter.ts
│   │   └── web/                  # Web Components
│   │       └── index.ts
│   ├── data/                     # Generated data (git-ignored)
│   │   ├── pages/                # Page data per layout
│   │   ├── metadata/             # Surah and juz metadata
│   │   └── fonts/                # Font files per layout
│   ├── core.test.ts              # Test suite
│   └── test/                     # Test utilities
│       └── setup.ts
├── docs/                         # Documentation
│   ├── index.md                  # Documentation entry point
│   ├── api/
│   │   └── views.md              # Views module API reference
│   ├── architecture/
│   │   ├── data-structure.md     # This file
│   │   └── static-assets.md      # Static assets architecture
│   └── guides/
│       ├── api-integration.md     # Quran Foundation API guide
│       ├── data-generation.md     # Data generation scripts
│       ├── mushaf-comparison.md  # Mushaf versions comparison
│       └── font-loading.md       # Font loading strategy
├── playground/                   # Development playground
├── dist/                         # Build output (generated)
├── package.json
├── .yarnrc.yml
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Data Directory Structure

```
src/data/
├── pages/                        # Quran page data
│   ├── hafs-v2/
│   │   └── pages.json           # 604 pages (QCF V2)
│   ├── hafs-v4/
│   │   └── pages.json           # 604 pages (QCF V4 Tajweed)
│   └── hafs-unicode/
│       └── pages.json           # 604 pages (Unicode)
├── metadata/                     # Quran metadata
│   ├── surahs.json              # 114 surahs
│   └── juz.json                 # 30 juz (60 entries)
└── fonts/                        # Font files (woff2)
    ├── hafs-v2/                  # 604 files
    │   ├── p1.woff2
    │   ├── p2.woff2
    │   └── ... (p1-p604)
    └── hafs-v4/                  # 604 files
        ├── p1.woff2
        ├── p2.woff2
        └── ... (p1-p604)
```

---

## Pages Data Format

### File: `src/data/pages/{layout}/pages.json`

**Structure:** Array of 604 Page objects

```typescript
type PagesJSON = Page[];
```

### Page Object

```typescript
{
  pageNumber: number,       // 1-604
  lines: Line[]             // 15 lines per page
}
```

### Line Object

```typescript
{
  lineNumber: number,       // 1-15
  words: Word[],            // Words on this line
  metadata: {
    verseId: number,        // Unique verse ID
    verseKey: string,        // "surah:verse"
    chapterId: number       // Chapter number
  }
}
```

### Word Object

```typescript
{
  id: number,               // Unique word ID
  position: number,         // Position in verse
  text: string,             // Arabic text
  code_v2?: string,        // QCF glyph (glyph layouts)
  pageNumber: number,       // Page number
  charType: string,         // "word", "end", "pause", etc.
  surah: number,            // Chapter (from verseKey)
  verse: number             // Verse number
}
```

### Complete Example (Page 1, Line 2)

```json
{
  "pageNumber": 1,
  "lines": [
    {
      "lineNumber": 2,
      "words": [
        {
          "id": 1,
          "position": 1,
          "text": "بِسْمِ",
          "code_v2": "ﱁ",
          "pageNumber": 1,
          "charType": "word",
          "surah": 1,
          "verse": 1
        },
        {
          "id": 2,
          "position": 2,
          "text": "ٱللَّهِ",
          "code_v2": "﷽",
          "pageNumber": 1,
          "charType": "word",
          "surah": 1,
          "verse": 1
        }
      ],
      "metadata": {
        "verseId": 1,
        "verseKey": "1:1",
        "chapterId": 1
      }
    }
  ]
}
```

---

## Metadata Format

### File: `src/data/metadata/surahs.json`

**Structure:** Array of 114 Surah objects

```typescript
type SurahsJSON = Surah[];
```

**Example (Al-Fatihah):**

```json
{
  "id": 1,
  "nameSimple": "Al-Fatihah",
  "nameComplex": "The Opening",
  "nameArabic": "ٱلْفَاتِحَة",
  "versesCount": 7,
  "revelationPlace": "makkah",
  "revelationOrder": 5,
  "bismillahPre": false,
  "pages": [1, 1],
  "translatedName": {
    "languageName": "english",
    "name": "The Opening"
  }
}
```

### File: `src/data/metadata/juz.json`

**Structure:** Array of 60 Juz entries (each juz appears twice)

```typescript
type JuzJSON = Juz[];
```

**Example (Juz 1 - first entry):**

```json
{
  "id": 1,
  "juzNumber": 1,
  "firstVerseId": 1,
  "lastVerseId": 148,
  "versesCount": 148,
  "verseMapping": {
    "1": "1",
    "2": "1",
    "3": "1",
    ...
  }
}
```

**Note:** Each juz appears twice in the array:

- First 30 entries: `id` = 1-30 (first half of Quran)
- Last 30 entries: `id` = 61-90 (second half of Quran)

| Index Range | Juz Numbers | Description |
|-------------|-------------|-------------|
| 0-29 | 1-30 | First copy of juzs |
| 30-59 | 1-30 | Second copy of juzs |

---

## Font Files

### Directory: `src/data/fonts/{layout}/`

**Files:** 604 `.woff2` files per layout

| Layout | Directory | Count | Example |
|--------|-----------|-------|---------|
| `hafs-v2` | `fonts/hafs-v2/` | 604 | `p1.woff2`, `p180.woff2`, `p604.woff2` |
| `hafs-v4` | `fonts/hafs-v4/` | 604 | `p1.woff2`, `p180.woff2`, `p604.woff2` |

### Font Resources

For Quranic font development and alternative implementations, see:

- [DigitalKhatt](https://github.com/DigitalKhatt) - Advanced font typesetting for Quranic scripts
- [Ayat Quran 286](https://www.fontspace.com/ayat-quran-286-font-f111904) - Aya marker font reference

### File Naming Convention

```
p{pageNumber}.woff2
```

| Page | Filename |
|------|----------|
| 1 | `p1.woff2` |
| 100 | `p100.woff2` |
| 604 | `p604.woff2` |

### Font URL Pattern

```typescript
import { getFontUrl } from 'open-quran-view/core/static/fonts';

const url = getFontUrl('hafs-v2', 1);
// Returns: "/data/fonts/hafs-v2/p1.woff2" (at runtime)
```

---

## File Sizes

| Directory | Files | Estimated Size |
|-----------|-------|----------------|
| `data/pages/hafs-v2/` | 1 (pages.json) | ~25 MB |
| `data/pages/hafs-v4/` | 1 (pages.json) | ~25 MB |
| `data/pages/hafs-unicode/` | 1 (pages.json) | ~15 MB |
| `data/fonts/hafs-v2/` | 604 | ~25 MB |
| `data/fonts/hafs-v4/` | 604 | ~30 MB |
| **Total** | ~1,212 | ~120 MB |

---

## Git Ignore Pattern

The `data/` directory is git-ignored and should be generated:

```gitignore
# Generated data
src/data/pages/*
!src/data/pages/.gitkeep
src/data/fonts/*
!src/data/fonts/.gitkeep
!src/data/metadata/surahs.json
!src/data/metadata/juz.json
```

**Note:** Only `metadata/` files are committed. Pages and fonts are generated.

---

## Data Generation Scripts

See [Data Generation Guide](guides/data-generation.md) for complete scripts reference:

| Script | Generates | Output |
|--------|-----------|--------|
| `fetch-metadata.ts` | Surahs, Juz | `metadata/surahs.json`, `metadata/juz.json` |
| `fetch-pages.ts` | Page data | `pages/{layout}/pages.json` |
| `download-fonts.ts` | Font files | `fonts/{layout}/p*.woff2` |
| `generate-static-fonts.ts` | Static URLs | `core/static/fonts.ts` |
| `generate-static-data.ts` | Static URLs | `core/static/data.ts` |

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Mushaf Pages | 604 |
| Total Surahs | 114 |
| Total Juz | 30 |
| Total Juz Entries | 60 (duplicated) |
| Lines per Page | 15 |
| Supported Layouts | 3 |
| Font Files per Layout | 604 |

---

## Layout Comparison

| Feature | hafs-v2 | hafs-v4 | hafs-unicode |
|---------|---------|---------|--------------|
| Font Type | Glyph | Glyph + Color | Unicode |
| Uses code_v2 | ✅ Yes | ✅ Yes | ❌ No |
| Tajweed Colors | ❌ No | ✅ Yes | ❌ No |
| Recommended | ✅ Yes | ⚠️ Optional | ❌ Simple only |
| File Size (pages) | ~25 MB | ~25 MB | ~15 MB |
| File Size (fonts) | ~25 MB | ~30 MB | N/A |

See [Mushaf Versions Comparison](guides/mushaf-comparison.md) for detailed analysis.

---

## Usage Examples

### Loading Pages

```typescript
import { loadPage, loadAllPages } from 'open-quran-view/core';

// Load single page
const page = await loadPage('hafs-v2', 1);
console.log(page.lines.length); // 15

// Load all pages
const allPages = await loadAllPages('hafs-v2');
console.log(allPages.length); // 604
```

### Loading Metadata

```typescript
import { loadSurahs, loadJuzs } from 'open-quran-view/core';

// Load surahs
const surahs = await loadSurahs();
console.log(surahs.length); // 114
console.log(surahs[0].nameSimple); // "Al-Fatihah"

// Load juzs
const juzs = await loadJuzs();
console.log(juzs.length); // 60
console.log(juzs[0].juzNumber); // 1
```

### Getting Font URL

```typescript
import { getFontUrl } from 'open-quran-view/core/static/fonts';

const url = getFontUrl('hafs-v2', 1);
// Returns: "/data/fonts/hafs-v2/p1.woff2" (at runtime)
```

---

## Related Documentation

- [Static Assets Architecture](static-assets.md) - How static URLs are generated
- [API Integration Guide](guides/api-integration.md) - Quran Foundation API details
- [Data Generation Guide](guides/data-generation.md) - Script usage and examples
- [Mushaf Comparison](guides/mushaf-comparison.md) - Choosing the right Mushaf layout
