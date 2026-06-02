# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Conventional Commits](https://conventionalcommits.org/).

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
