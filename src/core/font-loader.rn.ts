// React Native font loader. Mirrors the surface of src/core/font-loader.ts
// (web) but uses expo-font's Font.loadAsync + the `() => require(...)` thunks
// from static/fonts.rn.ts instead of the browser FontFace API.
//
// Module-level dedup keeps Font.loadAsync idempotent across re-renders
// of OpenQuranViewRN. A page font loaded once is never re-fetched, even
// if the user navigates away and back.

import * as Font from "expo-font";
import { staticFonts } from "./static/fonts.rn";
import type { MushafLayout } from "./types";

type AnyThunk = () => unknown;
type PagesEntry = Record<number, AnyThunk>;
type StaticFontsShape = {
  "hafs-v2": PagesEntry;
  "hafs-v4": PagesEntry;
  "hafs-unicode": { digitalkhatt: AnyThunk; ayatquran: AnyThunk };
  surahname: AnyThunk;
};

const fonts = staticFonts as unknown as StaticFontsShape;
const loaded = new Set<string>();

// Family names — these are the strings consumers reference in style.fontFamily.
const FAMILY_PREFIX = "QuranFont";
const FAMILY_UNICODE = "DigitalKhatt";
const FAMILY_AYAT = "AyatMarker";
const FAMILY_SURAH = "SurahNameFont";

const familyFor = (layout: MushafLayout, page: number) =>
  `${FAMILY_PREFIX}-${layout}-p${page}`;

async function loadOnce(family: string, asset: unknown): Promise<void> {
  if (loaded.has(family)) return;
  await Font.loadAsync({ [family]: asset });
  loaded.add(family);
}

/**
 * Loads the per-page QCF font (v2 / v4) or the unicode fonts (hafs-unicode).
 * For hafs-unicode, all pages share DigitalKhatt + AyatMarker; we load them
 * once and return.
 */
export async function loadFont(
  layout: MushafLayout,
  page: number,
): Promise<void> {
  if (layout === "hafs-unicode") {
    await loadOnce(FAMILY_UNICODE, fonts["hafs-unicode"].digitalkhatt());
    await loadOnce(FAMILY_AYAT, fonts["hafs-unicode"].ayatquran());
    return;
  }

  const pages = fonts[layout];
  const pageEntry = pages?.[page];
  if (!pageEntry) {
    throw new Error(`No font asset for ${layout}/p${page}`);
  }
  await loadOnce(familyFor(layout, page), pageEntry());
}

/**
 * Loads the bismillah font. For hafs-{v2,v4} this is page 1's font (the
 * bismillah glyphs are part of the QCF page-1 font). For hafs-unicode the
 * bismillah is rendered with the same DigitalKhatt font already loaded
 * by loadFont — nothing to do here.
 */
export async function loadBismillahFont(layout: MushafLayout): Promise<void> {
  if (layout === "hafs-unicode") return;
  return loadFont(layout, 1);
}

/**
 * Loads the surah-name display font. The TTF is bundled with the app
 * (see static/fonts.rn.ts#surahname), so this is a runtime load via
 * Font.loadAsync rather than a plugin-time auto-link.
 */
export async function loadSurahNameFont(): Promise<void> {
  await loadOnce(FAMILY_SURAH, fonts.surahname());
}

/**
 * Loads the AyatQuran end-of-ayah marker font. For hafs-{v2,v4} the
 * ayah-end glyphs are part of each page's font already loaded by
 * loadFont; for hafs-unicode it's a separate DigitalKhatt-style
 * glyph font. This function is the hafs-unicode path.
 */
export async function loadAyatMarkerFont(): Promise<void> {
  await loadOnce(FAMILY_AYAT, fonts["hafs-unicode"].ayatquran());
}

/**
 * Mirrors src/core/font-loader.ts: surah 1 -> "surah001", surah 114 -> "surah114".
 * Used by the surah-header line in the React view to look up the correct
 * glyph in the SurahNameFont font. The actual lookup is done by the
 * Web Open Font's GSUB table; the family name itself is irrelevant here
 * — only the glyph id encoded in the font matters.
 */
export function surahNumberToFontCode(surahNumber: number): string {
  return `surah${String(surahNumber).padStart(3, "0")}`;
}

/**
 * Exposed for tests: clear the dedup cache. Production code never calls this.
 */
export function __resetFontCacheForTests(): void {
  loaded.clear();
}