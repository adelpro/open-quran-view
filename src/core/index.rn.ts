// RN barrel — re-exports the same types and core logic as src/core/index.ts,
// but resolves to RN-safe modules (no `import.meta.url`, no `fetch`, no
// `FontFace`). Consumed via the package.json `./view/rn` export path,
// which Metro pulls in directly from `dist/core/...` in the published
// package (or from `src/core/...` in the workspace playground via the
// yarn workspace symlink).

export * from "./types";

export {
  getPageForVerse,
  getVerseLocation,
  getNavigation,
  getPageRangeForSurah,
  getFirstVerseOfPage,
  getLastVerseOfPage,
  getWordLocation,
  type VerseLocation,
  type NavigationInfo,
} from "./lookup";

export {
  createLayoutCalculator,
  type LineLayout,
  type WordLayout,
  type PageMetrics,
  type PageLayout,
  type LayoutCalculatorOptions,
} from "./layout-calculator";

export { getBismillahWords, clearBismillahCache } from "./bismillah";

// RN-specific loaders and statics:
export { getPagesJson, getPageFromJson } from "./data-loader.rn";

// `src/core/font-loader.rn.ts` is added in Phase 4. Once it exists,
// re-export it here too:
//   export { loadFont, loadBismillahFont, loadSurahNameFont,
//            loadAyatMarkerFont, surahNumberToFontCode } from "./font-loader.rn";