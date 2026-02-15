import type { MushafLayout } from "./types";
import {
  getFontUrl as getFontUrlStatic,
  getUnicodeFontUrl as getUnicodeFontUrlStatic,
} from "./static/fonts";
import { getSurahNameFontUrl as getSurahNameFontUrlStatic } from "./static/data";

let surahNameFontLoaded: boolean = false;
let digitalKhattFontLoaded: boolean = false;
let ayatMarkerFontLoaded: boolean = false;

export function surahNumberToFontCode(surahNumber: number): string {
  return `surah${String(surahNumber).padStart(3, "0")}`;
}

export async function getSurahNameFontBuffer(): Promise<ArrayBuffer> {
  const fontUrl = getSurahNameFontUrlStatic();

  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load surah-name font from ${fontUrl}: ${response.status} ${response.statusText}`,
    );
  }
  return response.arrayBuffer();
}

export async function getSurahNameFontUrl(): Promise<string> {
  return getSurahNameFontUrlStatic();
}

export async function loadSurahNameFont(): Promise<void> {
  if (surahNameFontLoaded) return;

  const fontUrl = await getSurahNameFontUrl();
  const fontFace = new FontFace("SurahNameFont", `url(${fontUrl})`);
  await fontFace.load();

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if ((globalThis as any).fonts) {
    (globalThis as any).fonts.add(fontFace);
  }

  surahNameFontLoaded = true;
}

export async function loadDigitalKhattFont(): Promise<void> {
  if (digitalKhattFontLoaded) return;

  const fontUrl = getUnicodeFontUrlStatic("digitalkhatt");

  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load DigitalKhatt font from ${fontUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const fontFace = new FontFace("DigitalKhatt", buffer);
  await fontFace.load();

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if ((globalThis as any).fonts) {
    (globalThis as any).fonts.add(fontFace);
  }

  digitalKhattFontLoaded = true;
}

export async function loadAyatMarkerFont(): Promise<void> {
  if (ayatMarkerFontLoaded) return;

  const fontUrl = getUnicodeFontUrlStatic("ayatquran");

  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load AyatMarker font from ${fontUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const fontFace = new FontFace("AyatMarker", buffer);
  await fontFace.load();

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if ((globalThis as any).fonts) {
    (globalThis as any).fonts.add(fontFace);
  }

  ayatMarkerFontLoaded = true;
}

export async function getFontBuffer(
  layout: MushafLayout,
  page: number,
): Promise<ArrayBuffer> {
  if (!layout) {
    console.error(
      `OpenQuranView Error: 'layout' is undefined for page ${page}`,
    );
    throw new Error("Layout is required to load fonts.");
  }
  if (!page) {
    console.error(`OpenQuranView Error: 'page' is undefined`);
    throw new Error("Page number is required.");
  }

  const fontUrl = getFontUrlStatic(layout, page);

  const response = await fetch(fontUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to load font. \nExpected: ${fontUrl} \nStatus: ${response.status}`,
    );
  }

  return response.arrayBuffer();
}

export function getFontUrl(layout: MushafLayout, page: number): string {
  return getFontUrlStatic(layout, page);
}

export async function loadFont(
  layout: MushafLayout,
  page: number,
  fontFamily: string = "QuranFont",
): Promise<void> {
  if (layout === "hafs-unicode") {
    await loadDigitalKhattFont();
    await loadAyatMarkerFont();
    return;
  }

  const fontUrl = getFontUrl(layout, page);
  const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
  await fontFace.load();

  if (typeof document !== "undefined" && document.fonts) {
    document.fonts.add(fontFace);
  } else if ((globalThis as any).fonts) {
    (globalThis as any).fonts.add(fontFace);
  }
}

export async function preloadAllFonts(layout: MushafLayout): Promise<void> {
  for (let page = 1; page <= 604; page++) {
    await loadFont(layout, page);
  }
}
