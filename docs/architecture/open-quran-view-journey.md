# Building Open Quran View: A Journey from Local Files to Quran Foundation API

> How we built a high-performance universal Quran rendering library that supports word-by-word display, multiple mushaf layouts, and extensibility for tafsirs and translations.

---

## The Problem

Displaying Quran pages on the web is deceptively complex. Unlike regular text, the Quran has:

- **Precise layout requirements** - Each page must match the printed mushaf exactly
- **Multiple narrations** - Different Hafs layouts
- **Right-to-left rendering** - Challenges in CSS and positioning
- **Word-level precision** - Clicking individual words for definitions or tafsir
- **Font dependencies** - Special Quranic fonts with thousands of glyphs

When we started building Open Quran View, we wanted to create something that any developer could drop into their project and get a professional Quran reader with minimal effort.

This is the story of how we got there.

---

## The Early Days: Local Files

### The Naive Approach

Our first attempt was straightforward: package all the data directly in the library.

```
open-quran-view/
├── src/
│   └── data/
│       ├── pages/
│       │   ├── page-1.json
│       │   ├── page-2.json
│       │   └── ...
│       └── fonts/
│           ├── page-1.woff2
│           └── ...
```

**What we shipped:**

```json
{
  "page": 1,
  "verses": [
    {
      "verseKey": "1:1",
      "words": [
        { "text": "بِسْمِ", "position": 1, "line": 2 },
        { "text": "اللَّهِ", "position": 2, "line": 2 }
      ]
    }
  ]
}
```

### The Problems Pile Up

This approach seemed perfect in development. Then reality hit:

| Problem | Impact |
|---------|--------|
| **Bundle Size** | 100+ MB for all pages and fonts |
| **Build Times** | 10+ minutes to process all files |
| **Version Updates** | Every mushaf update meant a new npm release |
| **CDN Complexity** | How to serve 604 fonts efficiently? |

The npm package became unwieldy. Developers installing the library faced massive download times, and CI/CD pipelines groaned under the weight.

---

## The Standardization Search

We explored standardized Quran data formats that promised easier distribution:

- **Standardized layouts** across platforms
- **Normalized coordinates** for words and lines
- **Extensible structure** for different mushafs

```json
{
  "version": "1.0",
  "mushaf": "hafs-v2",
  "pages": [...]
}
```

### What Worked

- Consistent data structure
- Platform-agnostic design
- Active community development

---

## The Quran Foundation API Discovery

### Finding the Source

The Quran Foundation API (api.quran.foundation) provides the most complete source of Quranic data available:

```
https://apis.quran.foundation/content/api/v4
```

### Authentication Flow

```typescript
async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://oauth2.quran.foundation/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=content'
  });
  
  const data = await response.json();
  return data.access_token;
}
```

### Available Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/chapters` | Get all 114 surahs with metadata |
| `/juzs` | Get all 30 juz with verse ranges |
| `/verses/by_page/{page}` | Get verses for a specific page |
| `/pages/lookup` | Lookup page boundaries for any verse |
| `/translations` | Get available translations |
| `/tafsirs` | Get available tafsirs |

### Mushaf Options

The API provides access to multiple authoritative mushafs:

| ID | Name | Narrator | Pages | Special Features |
|----|------|----------|-------|------------------|
| 1 | QCF V2 | Hafs via Warsh | 604 | Industry standard |
| 2 | QCF V1 | Hafs via Warsh | 604 | Legacy version |
| 5 | KFGQPC | Hafs | 604 | King Fahd Complex |
| 19 | QCF V4 | Hafs via Shu'bah | 604 | Tajweed colors |

### The Word-by-Word Revolution

This was the game-changer. The API returns complete word-level data:

```json
{
  "verses": [
    {
      "id": 1,
      "verseKey": "1:1",
      "words": [
        {
          "id": 1,
          "position": 1,
          "pageNumber": 1,
          "lineNumber": 2,
          "textQpcHafs": "بِسْمِ",
          "codeV2": "ﱁ",
          "codeV4": "ﱂ"
        },
        {
          "id": 2,
          "position": 2,
          "pageNumber": 1,
          "lineNumber": 2,
          "textQpcHafs": "اللَّهِ",
          "codeV2": "﷽"
        }
      ]
    }
  ]
}
```

Every word includes:

- **Unicode text** (`textQpcHafs`) for fallback rendering
- **Glyph codes** (`codeV2`, `codeV4`) for precise positioning
- **Line numbers** for layout calculations
- **Position in verse** for navigation

---

## The Data Pipeline Architecture

### The Insight

We realized: **fetch once at build time, use forever at runtime**.

Instead of calling the API every time a user loads a page, we generate static files during the build process. This gives us:

- ✅ Zero runtime API calls
- ✅ Instant page loading
- ✅ Offline capability
- ✅ Predictable performance

### The Pipeline

```
Quran Foundation API
        │
        ▼
┌─────────────────┐
│  1. Metadata    │───► src/data/metadata/
│  (surahs, juz) │     ├── surahs.json
└─────────────────┘     └── juz.json
        │
        ▼
┌─────────────────┐
│  2. Page Data  │───► src/data/pages/
│  (604 pages)   │     ├── hafs-v2/pages.json
└─────────────────┘     ├── hafs-v4/pages.json
        │              └── hafs-unicode/pages.json
        ▼
┌─────────────────┐
│  3. Download   │───► src/data/fonts/
│  Fonts         │     ├── hafs-v2/ (604 .woff2)
└─────────────────┘     └── hafs-v4/ (604 .woff2)
        │
        ▼
┌─────────────────────┐
│  4. Static Assets   │───► src/core/static/
│  (URL mappings)     │     ├── fonts.ts (1200+ entries)
└─────────────────────┘     └── data.ts
```

### Step 1: Fetch Metadata

```bash
yarn generate:metadata
```

Generates:

```json
// surahs.json
[
  {
    "id": 1,
    "nameSimple": "Al-Fatihah",
    "nameArabic": "ٱلْفَاتِحَة",
    "versesCount": 7,
    "revelationPlace": "makkah",
    "pages": [1, 1]
  }
  // ... 113 more
]
```

### Step 2: Fetch Page Data

```bash
yarn generate:pages
```

For each mushaf, fetches all 604 pages with word-level data.

### Step 3: Download Fonts

```bash
yarn generate:fonts
```

Downloads fonts from:

- V2: `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p{N}.woff2`
- V4: `https://verses.quran.foundation/fonts/quran/hafs/v4/colrv1/woff2/p{N}.woff2`

### Step 4: Generate Static Assets

```bash
yarn generate:static
```

Creates TypeScript files with pre-resolved URLs:

```typescript
// src/core/static/fonts.ts
export const staticFonts = {
  "hafs-v2": {
    1: new URL("../../data/fonts/hafs-v2/p1.woff2", import.meta.url).href,
    2: new URL("../../data/fonts/hafs-v2/p2.woff2", import.meta.url).href,
    // ... 604 entries
  }
} as const;
```

---

## The Font Challenge

### The Problem We Didn't See Coming

During development, fonts loaded perfectly. In production, they failed:

```
GET https://app.com/node_modules/open-quran-view/dist/data/fonts/p1.woff2 404
```

**What happened?**

The `import.meta.url` in development resolved to the source file. In production builds, paths changed. We had fonts in our package, but browsers couldn't find them.

### The Deeper Problem: Modern Bundlers

Even when we tried dynamic URL generation, modern bundlers (Vite, Webpack, Rollup) optimize aggressively. They see 604 hardcoded font URLs and think: "This is dead code" or "We can inline these references differently."

The result? Font references get stripped, renamed, or optimized away entirely. The bundler sees:

```typescript
const fonts = {
  1: new URL("../../data/fonts/p1.woff2", import.meta.url).href,
  2: new URL("../../data/fonts/p2.woff2", import.meta.url).href,
  // ... 604 entries
};
```

And optimizes it to something that breaks at runtime.

### The Solution: Static Generated Links

Instead of resolving URLs at runtime, we resolve them at build time and hardcode the exact strings:

```typescript
// Before: Runtime resolution (broken)
const fontUrl = new URL(`../../data/fonts/${layout}/p${page}.woff2`, import.meta.url).href;

// After: Pre-generated static URL (works)
const fontUrl = staticFonts[layout][page];
```

The generated TypeScript file contains hardcoded strings that bundlers cannot optimize away:

```typescript
// src/core/static/fonts.ts (generated)
export const staticFonts = {
  "hafs-v2": {
    1: "/_nuxt/fonts/hafs-v2/p1.woff2",
    2: "/_nuxt/fonts/hafs-v2/p2.woff2",
    3: "/_nuxt/fonts/hafs-v2/p3.woff2",
    // ... 604 entries
  }
} as const;
```

By generating actual URL strings at build time, we bypass bundler optimization entirely.

### How It Works

1. Build script scans `src/data/fonts/`
2. For each font file, generates a static entry
3. TypeScript file contains all 1200+ font URLs
4. At runtime, just lookup the pre-computed URL

---

## The Modular Architecture

### The Philosophy

We wanted to support any view layer (React, Vue, Angular, vanilla JS) without duplicating logic.

```
┌─────────────────────────────────────────────────────────┐
│                    open-quran-view                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │                   Core Layer                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │   │
│  │  │ Data Loader │  │ Font Loader │  │ Lookup  │  │   │
│  │  │             │  │             │  │         │  │   │
│  │  │ • Caching   │  │ • Fallbacks │  │ • Verse │  │   │
│  │  │ • Fetching  │  │ • Preload  │  │ • Page  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │                   View Layer                    │   │
│  │  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │   React     │  │ Web Component│               │   │
│  │  │  Component  │  │             │               │   │
│  │  └─────────────┘  └─────────────┘               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Core Responsibilities

**Data Loading:**

```typescript
class DataLoader {
  private cache: Map<string, any> = new Map();
  
  async getPage(layout: MushafLayout, page: number): Promise<PageData> {
    const key = `${layout}-${page}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const data = await this.fetchPage(layout, page);
    this.cache.set(key, data);
    return data;
  }
}
```

**Font Loading:**

```typescript
class FontLoader {
  private loadedFonts: Map<string, FontFace> = new Map();
  
  async loadFont(layout: MushafLayout, page: number): Promise<FontFace> {
    const key = `${layout}-${page}`;
    if (this.loadedFonts.has(key)) {
      return this.loadedFonts.get(key);
    }
    
    const url = getFontUrl(layout, page);
    const fontFace = new FontFace(`Quran-${layout}-${page}`, `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    this.loadedFonts.set(key, fontFace);
    
    return fontFace;
  }
}
```

### View Responsibilities

**Rendering:**

- Uthmani font glyph rendering
- Absolute positioning
- Theme support (light/dark)
- Responsive sizing

**Events:**

```typescript
interface WordInfo {
  id: number;
  surahNumber?: number;
  ayahNumber?: number;
  text?: string;
}

// Event payload
{
  detail: {
    word: WordInfo,
    page: number,
    layout: 'hafs-v2'
  }
}
```

### Adding New Views

Want to add Vue support? Simply implement the view interface:

```typescript
import { Core, MushafLayout, PageData } from 'open-quran-view/core';

class QuranViewerVue {
  private core: Core;
  
  renderPage(page: number) {
    const data = this.core.getPageData(page);
    // Vue-specific rendering logic
  }
}
```

All the complex data fetching, font loading, and navigation logic is already handled by the core.

---

## One Component, Two Flavors

### React Component

```tsx
import { OpenQuranView } from 'open-quran-view/view';

function App() {
  return (
    <OpenQuranView
      page={1}
      width={600}
      height={850}
      mushafLayout="hafs-v2"
      theme="light"
      onWordClick={(word) => console.log(word)}
      onPageChange={(page) => console.log(page)}
    />
  );
}
```

### Web Component

```html
<script type="module">
  import { registerOpenQuranView } from 'open-quran-view/view/web';
  registerOpenQuranView();
</script>

<open-quran-view
  page="1"
  mushaf-layout="hafs-v2"
  width="600"
  height="850"
  theme="light"
></open-quran-view>
```

### Consistent API

Both versions expose the same functionality:

| Feature | React Prop | Web Attribute |
|---------|------------|---------------|
| Page number | `page={1}` | `page="1"` |
| Layout | `mushafLayout="hafs-v2"` | `mushaf-layout="hafs-v2"` |
| Load event | `onLoad={handler}` | `load` event |
| Word click | `onWordClick={handler}` | `wordclick` event |
| Page change | `onPageChange={handler}` | `pagechange` event |

---

## Multiple Mushaf Support

### hafs-v2: The Standard

Our default mushaf, widely used in print and digital applications:

```tsx
<OpenQuranView mushafLayout="hafs-v2" />
```

- Narrator: Hafs from Asim via the way of Warsh
- Glyph type: QCF V2
- Pages: 604

### hafs-v4: With Tajweed

For those who want color-coded tajweed (Quran recitation rules):

```tsx
<OpenQuranView mushafLayout="hafs-v4" />
```

- Narrator: Hafs from Asim via the way of Shu'bah
- Glyph type: QCF V4 with Tajweed colors
- Pages: 604

### hafs-unicode: Universal Support

For environments where Quranic fonts aren't available:

```tsx
<OpenQuranView mushafLayout="hafs-unicode" />
```

- Uses Unicode text instead of glyph codes
- Includes DigitalKhat as a fallback font option
- Lower file size

---

## Extensibility: Tafsirs and Translations

### The Opportunity

The Quran Foundation API provides rich data beyond just text:

```
/translations      → Get available translations
/tafsirs          → Get available tafsirs
/verses/{id}/tafsirs → Get tafsir for a specific verse
```

### Word-by-Word Display

Each word in our data structure is individually addressable:

```typescript
interface WordInfo {
  id: number;           // Unique identifier
  surahNumber: number;  // Chapter (1-114)
  ayahNumber: number;   // Verse in chapter
  position: number;     // Position in verse
  text: string;         // Arabic text
}
```

### Building Tafsir Support

```tsx
<OpenQuranView
  page={1}
  onWordClick={(word) => {
    fetchTafsir(word.surahNumber, word.ayahNumber)
      .then(tafsir => showTafsirModal(tafsir));
  }}
/>
```

### Building Translation Support

```typescript
// Available translations from API
const translations = [
  { id: 20, name: "Sahih International" },
  { id: 161, name: "Muhammad Taqi Usmani" },
  { id: 95, name: "Abdul Haleem" }
];

// Fetch verse with translation
async function getVerseWithTranslation(
  verseKey: string,
  translationId: number
) {
  const response = await fetch(
    `/verses/by_key/${verseKey}?translations=${translationId}`
  );
  return response.json();
}
```

---

## Production Deployment

### The Prepare Script Challenge

When developers install the package, they need fonts and data. We solved this with the `prepare` lifecycle:

```json
{
  "scripts": {
    "prepare": "tsx scripts/generate-all.ts && yarn build"
  }
}
```

### What Happens on Install

```bash
npm install open-quran-view
```

1. **Downloads package**
2. **Runs `prepare` script**
   - Fetches metadata from API
   - Downloads fonts (~50MB)
   - Generates page data
   - Creates static URL files
3. **Builds TypeScript**
4. **Ready to use!**

### Build Output Structure

```
dist/
├── core/
│   ├── static/
│   │   ├── fonts.ts    # Static font URLs
│   │   └── data.ts     # Static data URLs
│   ├── data-loader.ts
│   └── font-loader.ts
├── data/
│   ├── fonts/
│   │   ├── hafs-v2/    # 604 font files
│   │   └── hafs-v4/    # 604 font files
│   ├── pages/
│   │   ├── hafs-v2/pages.json
│   │   └── hafs-v4/pages.json
│   └── metadata/
│       ├── surahs.json
│       └── juz.json
└── view/
    ├── react/          # React component bundle
    └── web/            # Web component bundle
```

---

## Lessons Learned

### 1. Fetch Once, Use Forever

Building data pipelines during build time beats runtime API calls for stability and performance.

### 2. Static Assets Solve Distribution Problems

Pre-generating URLs eliminates the "works in dev, breaks in production" syndrome.

### 3. Modular Architecture Scales

Separating core logic from view rendering made adding new views trivial.

### 4. Word-Level Data Enables Features

Investing in word-by-word data structure unlocked tafsir integration, translations, and interactive features.

### 5. Multiple Mushafs Require Planning

Different mushafs have different glyph systems, fonts, and coordinate systems. The architecture must accommodate all of them.

---

## Future Roadmap

### Near Term

- [ ] Translation overlay support
- [ ] Tafsir panel integration
- [ ] More mushaf layouts (Warsh, Doori)

### Medium Term

- [ ] Recitation audio synchronization
- [ ] Plugin system for custom features
- [ ] SSR support for Next.js

### Long Term

- [ ] Server-side rendering package
- [ ] Mobile React Native support
- [ ] Community mushaf contributions

---

## Conclusion

Building Open Quran View taught us that Quran rendering is deceptively complex. The journey from local files to Quran Foundation API was one of continuous learning.

Key takeaways:

1. **Start simple, then optimize** - Our local files approach worked for prototypes
2. **Choose the right data source** - Quran Foundation API gave us everything we needed
3. **Plan for production from day one** - The font loading issues forced better architecture
4. **Invest in data structure** - Word-level data enabled every feature that came after
5. **Make it easy to use** - One component, two flavors, consistent API

### What Makes Open Quran View Different

- **Full Offline Support** - No internet required. All fonts, data, and layouts are bundled locally
- **Easy Mushaf Switching** - Three built-in layouts (hafs-v2, hafs-v4, hafs-unicode) with easy extensibility for more
- **Truly Modular Architecture** - Core logic (data loading, font loading, navigation) is completely separate from views. Update the core once, all views benefit
- **Multi-View Support** - React component and Web Component included. Easy to add React Native, Angular, Vue, or any framework
- **Multilingual Ready** - Architecture supports any language layout and translation overlays
- **Tafsir Integration** - Word-level data structure makes it simple to fetch and display tafsir on word selection
- **Interactive Events** - Built-in events for word tap, long press, page change, and verse selection
- **Theming** - Full light and dark theme support with easy customization
- **One Component Philosophy** - Drop a single component, get a fully functional Quran viewer

```tsx
// One component, full functionality
<OpenQuranView
  page={1}
  mushafLayout="hafs-v2"
  theme="dark"
  onWordClick={handleWordClick}
  onLongPress={showTafsir}
/>
```

The library is now used by developers building Quran apps, Islamic education platforms, and research projects. Every time someone renders a Quran page with Open Quran View, they're standing on the shoulders of these lessons learned.

---

## Development Infrastructure

Open Quran View is built with modern tooling to ensure reliability, type safety, and developer experience.

### Monorepo with PNPM Workspace

The project uses PNPM workspaces for efficient dependency management:

```
open-quran-view/
├── package.json              # Root workspace config
├── .yarnrc.yml             # Yarn workspace definition
├── packages/                # (Future) Separate publishable packages
├── playground/              # Development playgrounds
│   ├── vite-react/         # React playground
│   └── vite-web/           # Web Component playground
├── scripts/                 # Build & generation scripts
└── src/                    # Main package source
```

Benefits:

- Shared dependencies across playgrounds
- Fast installs with Yarn workspaces
- Easy to add new packages (e.g., open-quran-view/core, open-quran-view/react)

### TypeScript First

Everything is written in TypeScript with strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "declaration": true
  }
}
```

Type safety ensures:

- Compile-time error catching
- Full IDE autocompletion
- Accurate API documentation generation

### Built with Tsup

We use [tsup](https://tsup.egoist.dev/) for fast, zero-config builds:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    await copyFonts();
    await copyData();
    await copyStatic();
  }
});
```

Benefits:

- Bundle TypeScript without complex configurations
- Generates both ESM and CommonJS formats
- Automatic declaration files (.d.ts)
- Fast incremental builds

### Interactive Playgrounds

The project includes live playgrounds for testing during development:

```bash
yarn playground:setup   # Install dependencies for playgrounds
yarn playground:react   # Run React playground (localhost:5173)
yarn playground:web    # Run Web Component playground (localhost:5174)
```

The playgrounds:

- Import directly from the source code (not built package)
- Hot reload on source changes
- Real-world usage examples
- Easy to test new features before publishing

### Testing with Vitest

We use [Vitest](https://vitest.dev/) for fast, modern testing:

```bash
yarn test              # Run all tests
yarn test:watch        # Watch mode for TDD
yarn test:coverage     # Coverage report
```

Test categories:

- **Unit tests** - Core utilities, data transformation
- **Integration tests** - Font loading, data fetching
- **View tests** - Component rendering, event handling

Example test:

```typescript
// src/core/__tests__/data-loader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataLoader } from '../data-loader';

describe('DataLoader', () => {
  let loader: DataLoader;

  beforeEach(() => {
    loader = new DataLoader();
  });

  it('should cache loaded pages', async () => {
    const page1 = await loader.getPage('hafs-v2', 1);
    const page1Again = await loader.getPage('hafs-v2', 1);
    
    expect(page1).toBe(page1Again);
  });

  it('should throw on invalid mushaf', async () => {
    await expect(loader.getPage('invalid', 1))
      .rejects.toThrow('Unknown mushaf');
  });
});
```

### Development Workflow

```bash
# 1. Clone and install
git clone https://github.com/your-org/open-quran-view.git
cd open-quran-view
yarn install

# 2. Generate data (requires API credentials)
cp .env.example .env
# Add QURAN_CLIENT_ID and QURAN_CLIENT_SECRET
yarn generate:all

# 3. Start development
yarn playground:react

# 4. Make changes to src/
# Playground hot-reloads automatically

# 5. Test your changes
yarn test

# 6. Build for release
yarn build
```

### CI/CD Pipeline

GitHub Actions runs on every push:

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: yarn
      - run: yarn install
      - run: yarn generate:all
      - run: yarn test
      - run: yarn lint
      - run: yarn build
```

---

## Resources

- **Package**: [npmjs.com/package/open-quran-view](https://npmjs.com/package/open-quran-view)
- **Documentation**: [open-quran-view/docs](https://github.com/your-org/open-quran-view/tree/main/docs)
- **API**: [apis.quran.foundation](https://apis.quran.foundation)
- **Repository**: [github.com/your-org/open-quran-view](https://github.com/your-org/open-quran-view)

---

*Written for developers building Islamic applications. Jazakum Allahu Khairan for reading.*
