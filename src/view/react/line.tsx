import { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type {
  LineLayout,
  MushafLayout,
  Word,
  WordLayout,
  WordClickedData,
} from "../../core";

type Props = {
  line: LineLayout;
  isCenteredLine: boolean;
  theme: "light" | "dark";
  fontSizeSurahHeader: number;
  fontSizeWord: number;
  bismillahWords: Word[];
  mushafLayout: MushafLayout;
  lineHeight: number;
  onWordClick?: (word: WordClickedData) => void;
  surahNumberToFontCode: (surahNumber: number) => string;
  getSurahFrameUrl: () => string;
};

export default function Line({
  line,
  isCenteredLine,
  theme,
  fontSizeWord,
  bismillahWords,
  mushafLayout,
  lineHeight,
  onWordClick,
  surahNumberToFontCode,
  getSurahFrameUrl,
  fontSizeSurahHeader,
}: Props) {
  const handleWordClick = (word: WordLayout) => {
    onWordClick?.({
      id: word.id,
      surahNumber: word.surah,
      ayahNumber: word.verse,
      position: word.position,
      text: word.text,
      charType: word.charType,
    });
  };

  const handleKeyDown = (event: KeyboardEvent, word: WordLayout) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleWordClick(word);
    }
  };

  const wordContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: "1px",
    justifyContent: isCenteredLine ? "center" : "space-between",
    gap: "1px",
    overflow: "hidden",
  };

  const getWordStyle = (isAyahEnd: boolean): CSSProperties => ({
    fontFamily: isAyahEnd
      ? '"AyatMarker", "DigitalKhatt", system-ui'
      : mushafLayout === "hafs-unicode"
        ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif'
        : '"QuranFont", system-ui, -apple-system, sans-serif',
    fontSize: fontSizeWord,
    color: theme === "dark" ? "#fff" : "#34495e",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: lineHeight,
    lineHeight: `${lineHeight}px`,
    verticalAlign: "middle",
    width: "auto",
    cursor: "pointer",
    padding: isAyahEnd ? "0px" : "1px 4px",
    margin: isAyahEnd ? "0px 8px" : "0px",
    borderRadius: 4,
    transition: "background 0.2s",
    flexShrink: 1,
    minWidth: 0,
  });

  const handleMouseEnter = (event: MouseEvent<HTMLSpanElement>) => {
    event.currentTarget.style.background =
      theme === "dark" ? "#333" : "#e0e0e0";
  };

  const handleMouseLeave = (event: MouseEvent<HTMLSpanElement>) => {
    event.currentTarget.style.background = "transparent";
  };

  const renderWord = (word: WordLayout) => {
    const isAyahEnd =
      mushafLayout === "hafs-unicode" && word.charType === "end";

    return (
      <span
        key={word.id}
        role="button"
        tabIndex={0}
        onClick={() => handleWordClick(word)}
        onKeyDown={(event) => handleKeyDown(event, word)}
        style={getWordStyle(isAyahEnd)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isAyahEnd ? `﴾${word.verse}﴿` : word.text || `[${word.id}]`}
      </span>
    );
  };

  const renderBismillahWord = (word: Word) => (
    <span
      key={word.id}
      role="button"
      tabIndex={0}
      onClick={() =>
        onWordClick?.({
          id: word.id,
          surahNumber: 1,
          ayahNumber: 0,
          position: word.position,
          text: word.text,
          charType: word.charType,
        })
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onWordClick?.({
            id: word.id,
            surahNumber: 1,
            ayahNumber: 0,
            position: word.position,
            text: word.text,
            charType: word.charType,
          });
        }
      }}
      style={{
        fontFamily:
          mushafLayout === "hafs-unicode"
            ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif'
            : line.lineType === "bismillah"
              ? '"BismillahFont", system-ui, -apple-system, sans-serif'
              : '"QuranFont", system-ui, -apple-system, sans-serif',
        fontSize: fontSizeWord,
        color: theme === "dark" ? "#fff" : "#34495e",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: lineHeight,
        lineHeight: `${lineHeight}px`,
        verticalAlign: "middle",
        minWidth: "auto",
        width: "auto",
        cursor: "pointer",
        padding: "2px 4px",
        borderRadius: 4,
        transition: "background 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {word.text || `[${word.id}]`}
    </span>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        height: lineHeight,
        top: Math.max(0, line.y - lineHeight / 2),
        display: "flex",
        alignItems: "center",
        justifyContent: isCenteredLine ? "center" : "space-between",
        padding: "1px",
        overflow: "hidden",
      }}
    >
      {line.lineType === "header" ? (
        <span
          style={{
            position: "relative",
            width: "100%",
            height: "auto",
            marginTop: 5,
            marginBottom: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: `url(${getSurahFrameUrl()})`,
            backgroundSize: "100% 100%",
          }}
        >
          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontSize: fontSizeSurahHeader,
              fontWeight: "bold",
              color: theme === "dark" ? "#2c3e50" : "#2c3e50",
              fontFamily:
                '"SurahNameFont", system-ui, -apple-system, sans-serif',
              textAlign: "center",
            }}
          >
            {line.surahNumber
              ? surahNumberToFontCode(line.surahNumber)
              : "surah000"}
          </span>
        </span>
      ) : line.lineType === "bismillah" ? (
        <div style={wordContainerStyle}>
          {bismillahWords.map(renderBismillahWord)}
        </div>
      ) : (
        <div style={wordContainerStyle}>{line.words.map(renderWord)}</div>
      )}
    </div>
  );
}
