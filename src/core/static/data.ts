export const staticData = {
  pages: {
    "hafs-unicode": new URL(
      "../../data/pages/hafs-unicode/pages.json",
      import.meta.url,
    ).href,
    "hafs-v2": new URL("../../data/pages/hafs-v2/pages.json", import.meta.url)
      .href,
    "hafs-v4": new URL("../../data/pages/hafs-v4/pages.json", import.meta.url)
      .href,
  },
  metadata: {
    juz: new URL("../../data/metadata/juz.json", import.meta.url).href,
    surahs: new URL("../../data/metadata/surahs.json", import.meta.url).href,
  },
  shared: {
    surahname: new URL("../../data/shared/surah-name-v4.woff2", import.meta.url)
      .href,
  },
  assets: {
    surahFrame: new URL(
      "../../data/assets/surah-frame-wikipedia.svg",
      import.meta.url,
    ).href,
  },
} as const;

export type StaticData = typeof staticData;

export function getPagesUrl(layout: string): string {
  const url = staticData.pages?.[layout as keyof typeof staticData.pages];
  if (!url) throw new Error(`Pages not found: ${layout}`);
  return url;
}

export function getMetadataUrl(type: "surahs" | "juz"): string {
  const url = staticData.metadata?.[type];
  if (!url) throw new Error(`Metadata not found: ${type}`);
  return url;
}

export function getSurahNameFontUrl(): string {
  const url = staticData.shared?.surahname;
  if (!url) throw new Error(`Surah name font not found`);
  return url;
}

export function getSurahFrameUrl(): string {
  const url = staticData.assets?.surahFrame;
  if (!url) throw new Error(`Surah frame SVG not found`);
  return url;
}
