// React Native entry point for core exports
// Uses RN-specific implementations to avoid browser APIs like import.meta.url

export * from "./types";

export {
  loadPages,
  loadPage,
  loadAllPages,
  loadSurahs,
  loadJuzs,
  getSurah,
  getJuz,
  getSurahByPage,
  clearCache,
} from "./data-loader";

export {
  loadFont,
  loadBismillahFont,
  loadSurahNameFont,
  loadAyatMarkerFont,
  surahNumberToFontCode,
} from "./font-loader.rn";

export {
  createLayoutCalculator,
  type LineLayout,
  type WordLayout,
  type PageMetrics,
  type PageLayout,
  type LayoutCalculatorOptions,
} from "./layout-calculator";

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

export { getBismillahWords, clearBismillahCache } from "./bismillah";
