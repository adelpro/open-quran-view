# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Conventional Commits](https://conventionalcommits.org/).

## [0.7.0] - 2026-XX-XX

### Added

- **`open-quran-view/view/rn`** — new React Native entry point exporting `OpenQuranViewRN`. QCF v2/v4 font-based Mushaf renderer for Expo (and bare RN via `expo prebuild`). Per-page fonts are lazy-loaded at runtime via `Font.loadAsync` (expo-font); only pages the user navigates to ship in the binary.

### Notes

- Existing `view` and `view/web` exports are unchanged.
- New RN code lives under `src/view/rn/`, `src/core/font-loader.rn.ts`, `src/core/data-loader.rn.ts`, `src/core/index.rn.ts`, `src/core/static/{fonts,data}.rn.ts`.
- `hafs-v2` / `hafs-v4` per-page fonts are TTF files in `src/data/fonts/hafs-{v2,v4}-ttf/` (committed). They are converted locally from the WOFF2 originals via `scripts/convert-woff2-to-ttf.ts` (uses `wawoff2`). The Quran Foundation API serves TTF directly at `https://verses.quran.foundation/fonts/quran/hafs/v{2,4}/.../p{N}.ttf`; `scripts/download-fonts.ts` can fetch them but is rate-limited (~0.3 files/sec sustained), so local conversion is preferred.
- The three always-loaded fonts — DigitalKhatt (`.otf`), AyatQuran (`.ttf`), SurahName (`.ttf`) — are registered in the consumer's `app.json` via the `expo-font` plugin. No `QCF_BSML.ttf` — the bismillah is rendered with page 1's font, loaded at runtime via `loadBismillahFont`.
- The surah-name v4 font is downloaded from the QUL CDN at `https://static-cdn.tarteel.ai/qul/fonts/surah-names/v4/surah-name-v4.ttf`. License is not explicitly cited on the QUL page; a NOTICE file is tracked as a follow-up.
- New peer deps: `expo-font >=12.0.0`, `react-native >=0.74`. Existing peer: `react >=18`.
- New test dev deps: `react`, `react-dom`, `@testing-library/dom`, `expo-font`, `react-native` (so the dts build and Vitest can resolve them).
- A `react-native` stub at `src/test/react-native-stub.ts` is aliased in `vitest.config.ts` so component tests don't try to parse the real package's Flow type files.
- The static `*.rn.ts` modules are externalized in `tsup.config.ts` via a regex (`/static/(fonts|data).rn/`) so their `() => require(...)` thunks are not inlined into `dist/view/rn/index.js`. Metro resolves them in the consumer's app at runtime.

## [UNRELEASED]

### Fixed

- **Web Component**: Fixed QCF font race condition where page navigation could render glyph placeholders instead of proper Arabic text
- **Web Component**: Added `loadFontForPage()` method to ensure fonts are loaded before rendering on page change
- **Web Component**: Fixed verse end markers in hafs-unicode layout rendering as raw glyphs (like ﴾6﴿) instead of proper Arabic-Indic numerals

## [0.5.0] - 2026-05-22

### Features

- Add `ratio` prop (boolean | number, default `true`)
  - `true`: Uses mushaf ratio (0.7) to derive missing dimension
  - `false`: Fills container dimensions without ratio derivation
  - number: Custom ratio value (e.g., `0.8`)
- Add `fit` prop (`"width" | "height"`, default `"width"`)
  - `"width"`: Fill container width, derive height
  - `"height"`: Fill container height, derive width
  - Only applies when neither `width` nor `height` is provided

### Refactored

- Font size calculation now uses `min(fontSizeFromHeight, fontSizeFromWidth)` to prevent text overflow when dimensions don't match 0.7 ratio

### Fixed

- Resolved text overflow issue when providing custom width/height that violates the default 0.7 ratio

### Docs

- Updated API documentation with `ratio` and `fit` props
- Added Prop Validation Warnings section
- Added Font Size Calculation explanation
- Updated web component documentation with new attributes

## [0.4.7] - 2026-04-29

### Refactored

- Update width and height calculation

## [0.4.6] - 2026-04-26

### Features

- Add a new prop to handle navigations show hide

### Refactored

- Fixing word highlight
- Debuging word highlighting

### Fixed

- Fix word highlight overwritten by aya highlight

## [0.4.1] - 2026-04-25

### Changed

- Improved verse highlighting with precise segment shapes
- Added absolute-positioned highlight layer to bridge word gaps in justified text
- Ported precise highlighting logic to both React and Web Component views
- Fixed highlight selection to perfectly match ayah bounds even when starting or ending mid-line

## [0.4.0] - 2026-04-25

### Added

- Word-level highlighting (`highlightedWords`) for both React and Web Component views
- Verse-level background highlighting (`highlightedVerse`)
- Customizable highlight colors for words and verses
- Optimized `applyHighlights()` method for Web Component to enable real-time updates (e.g., audio sync)
- Comprehensive usage examples for audio synchronization and search results

## [0.3.0] - 2026-04-25

### Added

- Fullscreen mode for immersive Quran reading experience
  - Fullscreen toggle button in navigation controls with expand/collapse icons
  - Keyboard shortcut: press `F` to toggle fullscreen
  - Auto-hide navigation controls after 3 seconds of inactivity in fullscreen
  - Show controls on mouse move with smooth fade animation
  - Arrow key navigation (← → for prev/next page)
- Word and verse tafseer (explanation) display on word click
- Script to scrape Quran word-level tafseer and align it with pages.json

### Changed

- Migrated from pnpm to yarn package manager
- Added axios, cheerio and @types/cheerio dependencies for data scraping

### Removed

- Removed pnpm lock file in favor of yarn.lock

## [0.2.1] - 2026-02-04

### Added

- Screenshots for Hafs Unicode Digital Khatt and Hafs V2 Tajweed mushaf styles
- Comprehensive documentation structure with guides for API integration, data generation, and font loading
- New architecture documentation: Open Quran View Journey, Static Assets
- Mushaf comparison guide comparing different Quran editions (Hafs V2 Tajweed, Hafs Unicode Digital Khatt, Indo/Pak)
- New architecture article: "Open Quran View Journey" documenting the full story from local files to Quran Foundation API
- Development infrastructure documentation (PNPM workspace, TypeScript, Tsup, Vitest, playgrounds)
- Web Component TypeScript example in README
- Playground commands: `playground:setup`, `playground:react`, `playground:web`

### Changed

- Restructured documentation from artifacts/ to docs/guides/ and docs/architecture/
- Updated README with screenshots, preview links, and improved documentation references
- Renamed script function to `transformPageData` for improved clarity
- Clarified Hafs narration description in architecture documentation
- Updated README with Web Component TypeScript example
- Added playground commands to Development section

## [0.2.0] - 2026-02-04

### Added

- Static asset generation scripts (`generate-static-fonts.ts`, `generate-static-data.ts`)
- Static file URL generation for fonts and metadata
- `prepare` lifecycle for automatic asset generation
- Documentation for Quran Foundation API integration
- Data generation guide with complete pipeline documentation
- Static assets architecture documentation

### Fixed

- Font loading issues by including static files in build output
- Vite configuration for font MIME types and headers

### Changed

- Build workflow to include `core/static` directory in distribution
- Updated documentation to reference Quran Foundation API instead of QUL
- Removed all QUL (Quranic Universal Library) references from docs and README

## [0.1.0] - 2026-01-XX

Initial release.
