export type MushafLayout = "hafs-v2" | "hafs-v4" | "hafs-unicode";

export type CharType = "word" | "end" | "pause" | "rub" | "sajdah";

export type WordLocation = {
  surah: number;
  verse: number;
  position: number;
};

export type Word = {
  id: number;
  position: number;
  text: string;
  code_v2?: string;
  pageNumber: number;
  charType: CharType;
} & WordLocation;

export type LineMetadata = {
  verseId: number;
  verseKey: string;
  chapterId: number;
};

export type Line = {
  lineNumber: number;
  words: Word[];
  metadata: LineMetadata;
  isCentered?: boolean;
  lineType?: "text" | "header" | "bismillah";
};

export type Page = {
  pageNumber: number;
  lines: Line[];
  isVerticallyCentered?: boolean;
};

export type TranslatedName = {
  languageName: string;
  name: string;
};

export type Surah = {
  id: number;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  revelationPlace: "makkah" | "madinah";
  revelationOrder: number;
  bismillahPre: boolean;
  pages: [number, number];
  translatedName: TranslatedName;
};

export type Juz = {
  id: number;
  juzNumber: number;
  firstVerseId: number;
  lastVerseId: number;
  versesCount: number;
  verseMapping: Record<string, string>;
};

export function parseVerseKey(verseKey: string): {
  surah: number;
  verse: number;
} {
  const parts = verseKey.split(":");
  if (parts.length !== 2) {
    return { surah: NaN, verse: NaN };
  }
  const surah = Number(parts[0]);
  const verse = Number(parts[1]);
  const surahValid = parts[0] !== "" && !isNaN(surah);
  const verseValid = parts[1] !== "" && !isNaN(verse);
  return {
    surah: surahValid ? surah : NaN,
    verse: verseValid ? verse : NaN,
  };
}

export function createVerseKey(surah: number, verse: number): string {
  return `${surah}:${verse}`;
}
