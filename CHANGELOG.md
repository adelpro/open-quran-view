# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Conventional Commits](https://conventionalcommits.org/).

## [Unreleased]

### Added

- Screenshots for Hafs Unicode Digital Khatt and Hafs V2 Tajweed mushaf styles
- Comprehensive documentation structure with guides for API integration, data generation, and font loading
- New architecture documentation: Open Quran View Journey, Static Assets
- Mushaf comparison guide comparing different Quran editions (Hafs V2 Tajweed, Hafs Unicode Digital Khatt, Indo/Pak)

### Changed

- Restructured documentation from artifacts/ to docs/guides/ and docs/architecture/
- Updated README with screenshots, preview links, and improved documentation references
- Renamed script function to `transformPageData` for improved clarity
- Clarified Hafs narration description in architecture documentation

## [0.2.1] - 2026-02-04

### Added

- New architecture article: "Open Quran View Journey" documenting the full story from local files to Quran Foundation API
- Development infrastructure documentation (PNPM workspace, TypeScript, Tsup, Vitest, playgrounds)
- Web Component TypeScript example in README
- Playground commands: `playground:setup`, `playground:react`, `playground:web`

### Changed

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
