import type { MushafLayout } from "./types";

type FontCache = Record<MushafLayout, Map<number, string>>;

let fontCache: FontCache = {
  "hafs-v2": new Map(),
  "hafs-v4": new Map(),
  "hafs-unicode": new Map(),
};

async function loadFontUrl(
  layout: MushafLayout,
  page: number,
): Promise<string> {
  const fontPath = `../data/fonts/${layout}/p${page}.woff2?url`;
  return new URL(fontPath, import.meta.url).href;
}

export async function getFontBuffer(
  layout: MushafLayout,
  page: number,
): Promise<ArrayBuffer> {
  const fontPath = `../data/fonts/${layout}/p${page}.woff2?raw`;
  const module = await import(/* @vite-ignore */ fontPath);
  const fontData = module.default as string;
  const uint8Array = new Uint8Array(fontData.length);
  for (let i = 0; i < fontData.length; i++) {
    uint8Array[i] = fontData.charCodeAt(i);
  }
  return uint8Array.buffer;
}

export async function getFontUrl(
  layout: MushafLayout,
  page: number,
): Promise<string> {
  const cached = fontCache[layout].get(page);
  if (cached) {
    return cached;
  }

  const buffer = await getFontBuffer(layout, page);
  const blob = new Blob([buffer], { type: "font/woff2" });
  const url = URL.createObjectURL(blob);
  fontCache[layout].set(page, url);
  return url;
}

export async function loadFont(
  layout: MushafLayout,
  page: number,
): Promise<void> {
  const fontUrl = await getFontUrl(layout, page);
  const fontFace = new FontFace("QuranFont", `url(${fontUrl})`);
  await fontFace.load();
  const fonts = (globalThis as unknown as { fonts: FontFaceSet }).fonts;
  if (fonts) {
    fonts.add(fontFace);
  }
}

export async function preloadAllFonts(layout: MushafLayout): Promise<void> {
  for (let page = 1; page <= 604; page++) {
    await loadFont(layout, page);
  }
}

export function clearFontCache(layout?: MushafLayout): void {
  if (layout) {
    fontCache[layout].clear();
  } else {
    fontCache["hafs-v2"].clear();
    fontCache["hafs-v4"].clear();
    fontCache["hafs-unicode"].clear();
  }
}
