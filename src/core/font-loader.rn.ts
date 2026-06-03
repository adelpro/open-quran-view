/**
 * font-loader.rn.ts
 *
 * React Native implementation of the font-loader surface.
 * Uses expo-font's Font.loadAsync() instead of the browser FontFace API.
 *
 * The QCF V2/V4 per-page fonts are loaded lazily via static require() thunks
 * (see static/fonts.rn.ts) so Metro only bundles assets actually navigated to.
 *
 * Small always-needed fonts (digitalkhatt, AyatQuran, surah-name) are
 * auto-linked at build time via react-native.config.js and do NOT need
 * Font.loadAsync — they are available from the native font registry.
 */
import * as Font from "expo-font";

import type { MushafLayout } from "./types";
import { staticFonts } from "./static/fonts.rn";

// ─── Dedup guards ────────────────────────────────────────────────────────────
const loadedFonts = new Set<string>();

// ─── Helper ──────────────────────────────────────────────────────────────────

function dedupeKey(name: string) {
  return name;
}

async function loadIfNeeded(
  fontFamily: string,
  asset: ReturnType<typeof require>,
): Promise<void> {
  const key = dedupeKey(fontFamily);
  if (loadedFonts.has(key)) return;
  await Font.loadAsync({ [fontFamily]: asset });
  loadedFonts.add(key);
}

// ─── Public API (mirrors font-loader.ts surface) ─────────────────────────────

export function surahNumberToFontCode(surahNumber: number): string {
  return `surah${String(surahNumber).padStart(3, "0")}`;
}

/**
 * Loads the surah name display font (SurahNameFont).
 * On RN this font is auto-linked; Font.loadAsync is a no-op safety wrapper.
 */
export async function loadSurahNameFont(): Promise<void> {
  const asset = (staticFonts["hafs-unicode"] as Record<string, unknown>)
    ?.surahname;
  if (!asset) return; // auto-linked — skip
  await loadIfNeeded("SurahNameFont", asset);
}

/**
 * Loads the DigitalKhatt Unicode font used for hafs-unicode layout.
 * On RN this font is auto-linked via react-native.config.js.
 */
export async function loadDigitalKhattFont(): Promise<void> {
  // Auto-linked — available natively. No-op to stay API-compatible.
}

/**
 * Loads the AyatMarker font used for verse-end markers in hafs-unicode.
 * On RN this font is auto-linked via react-native.config.js.
 */
export async function loadAyatMarkerFont(): Promise<void> {
  // Auto-linked — available natively. No-op to stay API-compatible.
}

/**
 * Returns the asset reference for a QCF V2/V4 per-page font.
 * The returned value is a Metro asset that can be passed to Font.loadAsync.
 */
export function getFontAsset(
  layout: MushafLayout,
  page: number,
): ReturnType<typeof require> {
  if (layout === "hafs-unicode") {
    throw new Error(
      "hafs-unicode uses auto-linked fonts; no per-page asset needed.",
    );
  }
  const thunkMap = staticFonts[layout] as Record<
    number,
    () => ReturnType<typeof require>
  >;
  const thunk = thunkMap?.[page];
  if (!thunk) throw new Error(`Font asset not found: ${layout}/p${page}`);
  return thunk();
}

/**
 * In RN, fonts are loaded via Font.loadAsync, not by URL.
 * Returns a placeholder string so call-sites that rely on getFontUrl still compile.
 */
export function getFontUrl(_layout: MushafLayout, _page: number): string {
  return "[rn-asset]"; // Metro resolves assets, not URLs
}

/**
 * Not applicable in RN — fonts are registered as native assets, not ArrayBuffers.
 */
export async function getFontBuffer(
  _layout: MushafLayout,
  _page: number,
): Promise<ArrayBuffer> {
  throw new Error("getFontBuffer is not available in React Native.");
}

/**
 * Not applicable in RN.
 */
export async function getSurahNameFontBuffer(): Promise<ArrayBuffer> {
  throw new Error("getSurahNameFontBuffer is not available in React Native.");
}

/**
 * Not applicable in RN.
 */
export async function getSurahNameFontUrl(): Promise<string> {
  return "[rn-asset]";
}

/**
 * Loads the per-page QCF font for a given layout and page number.
 * For hafs-unicode, small fonts are auto-linked — this is a no-op.
 */
export async function loadFont(
  layout: MushafLayout,
  page: number,
): Promise<void> {
  if (layout === "hafs-unicode") return; // auto-linked
  const asset = getFontAsset(layout, page);
  await loadIfNeeded(`QuranFont-${layout}-${page}`, asset);
}

/**
 * Loads the Bismillah font (page 1 font) for the given layout.
 */
export async function loadBismillahFont(layout: MushafLayout): Promise<void> {
  if (layout === "hafs-unicode") return;
  const asset = getFontAsset(layout, 1);
  await loadIfNeeded(`BismillahFont-${layout}`, asset);
}
