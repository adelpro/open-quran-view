import { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import type { LineLayout, MushafLayout, Word, WordLayout } from "../../core";

type Props = {
  line: LineLayout;
  isCenteredLine: boolean;
  theme: "light" | "dark";
  fontSizeSurahHeader: number;
  fontSizeWord: number;
  bismillahWords: Word[];
  mushafLayout: MushafLayout;
  lineHeight: number;
  onWordClick?: (word: {
    id: number;
    surahNumber?: number;
    ayahNumber?: number;
  }) => void;
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
}: Props) {
  const handleWordClick = (word: WordLayout) => {
    onWordClick?.({
      id: word.id,
      surahNumber: word.surah,
      ayahNumber: word.verse,
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
    minWidth: "auto",
    width: "auto",
    cursor: "pointer",
    padding: isAyahEnd ? "0px" : "2px 4px",
    borderRadius: 4,
    transition: "background 0.2s",
    flexShrink: 0,
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
        })
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onWordClick?.({
            id: word.id,
            surahNumber: 1,
            ayahNumber: 0,
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
        top: line.y - lineHeight / 2,
        display: "flex",
        alignItems: "center",
        justifyContent: isCenteredLine ? "center" : "flex-end",
        padding: "2px",
      }}
    >
      {line.lineType === "header" ? (
        (() => {
          const headerFontSize = Math.min(42, Math.max(16, lineHeight - 10));
          const headerLineHeight = Math.max(12, lineHeight - 4);
          return (
            <div
              style={{
                fontSize: headerFontSize,
                fontWeight: "bold",
                color: theme === "dark" ? "#fff" : "#2c3e50",
                fontFamily:
                  '"SurahNameFont", system-ui, -apple-system, sans-serif',
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box",
                paddingInline: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${theme === "dark" ? "#fff" : "#2c3e50"}`,
                height: lineHeight,
                lineHeight: `${headerLineHeight}px`,
                margin: 0,
                paddingBlock: 0,
              }}
            >
              {line.surahNumber
                ? surahNumberToFontCode(line.surahNumber)
                : "surah000"}
            </div>
          );
        })()
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
