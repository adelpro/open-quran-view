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
  loadSurahNameFont,
  loadAyatMarkerFont,
  surahNumberToFontCode,
  getFontUrl,
  getFontBuffer,
} from "./font-loader";

export { getSurahFrameUrl } from "./static/data";

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
