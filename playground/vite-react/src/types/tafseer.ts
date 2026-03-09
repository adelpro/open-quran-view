export type WordTafseer = {
  text: string;
  tafseer: string;
  verse: number;
  surah: number;
  position: number;
};

export type VerseTafseer = {
  tafseer: string;
  verse: number;
  surah: number;
};

export type WordMap = Record<string, WordTafseer | VerseTafseer>;

export type SelectedTafseer = {
  tafseer: string;
  verse: number;
  surah: number;
  position?: number;
  text?: string;
};
