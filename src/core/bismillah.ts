import type { Word, MushafLayout } from "./types";
import { loadPage } from "./data-loader";

let bismillahCache: Record<MushafLayout, Word[] | null> = {
  "hafs-v2": null,
  "hafs-v4": null,
  "hafs-unicode": null,
};

export async function getBismillahWords(layout: MushafLayout): Promise<Word[]> {
  if (bismillahCache[layout] !== null) {
    return bismillahCache[layout]!;
  }

  const page1 = await loadPage(layout, 1);
  if (!page1 || !page1.lines || page1.lines.length === 0) {
    bismillahCache[layout] = [];
    return [];
  }

  const firstVerseWords = page1.lines
    .flatMap((l) => l.words)
    .filter((w) => w.surah === 1 && w.verse === 1 && w.charType !== "end");

  if (firstVerseWords.length === 0) {
    bismillahCache[layout] = [];
    return [];
  }

  bismillahCache[layout] = firstVerseWords;
  return firstVerseWords;
}

export function clearBismillahCache(layout?: MushafLayout): void {
  if (layout) {
    bismillahCache[layout] = null;
  } else {
    bismillahCache = {
      "hafs-v2": null,
      "hafs-v4": null,
      "hafs-unicode": null,
    };
  }
}
