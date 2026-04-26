import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  LineLayout,
  MushafLayout,
  Word,
  WordLayout,
  WordClickedData,
  WordLocation,
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
  surahNumberToFontCode: (surahNumber: number) => string;
  getSurahFrameUrl: () => string;
  paddingLeft: number;
  paddingRight: number;
  onWordClick?: (word: WordClickedData) => void;
  highlightedWord?: WordLocation | null;
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
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
  paddingLeft,
  paddingRight,
  highlightedWord = null,
  highlightedVerse = null,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  verseHighlightColor = "rgba(135, 206, 250, 0.25)",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightRange, setHighlightRange] = useState<{
    left: number;
    width: number;
    isStart: boolean;
    isEnd: boolean;
  } | null>(null);

  useLayoutEffect(() => {
    if (!highlightedVerse || !containerRef.current) {
      setHighlightRange(null);
      return;
    }

    const wordsInLine = line.words;
    const highlightedIndices = wordsInLine
      .map((w, i) =>
        w.surah === highlightedVerse.surah && w.verse === highlightedVerse.verse
          ? i
          : -1,
      )
      .filter((i) => i !== -1);

    if (highlightedIndices.length === 0) {
      setHighlightRange(null);
      return;
    }

    const firstIdx = highlightedIndices[0];
    const lastIdx = highlightedIndices[highlightedIndices.length - 1];

    const container = containerRef.current;
    const wordElements = container.querySelectorAll("[data-word-idx]");

    // Find the actual DOM elements for our range
    // Note: index in wordElements might match line.words index
    const firstEl = Array.from(wordElements).find(
      (el) => (el as HTMLElement).dataset.wordIdx === firstIdx.toString(),
    ) as HTMLElement;
    const lastEl = Array.from(wordElements).find(
      (el) => (el as HTMLElement).dataset.wordIdx === lastIdx.toString(),
    ) as HTMLElement;

    if (firstEl && lastEl) {
      // In RTL, the "first" word (lowest index) is on the right
      // the "last" word (highest index) is on the left
      const rightEdge = firstEl.offsetLeft + firstEl.offsetWidth;
      const leftEdge = lastEl.offsetLeft;

      // We can't easily know if it's the absolute end without metadata,
      // but we can use the existing line segment logic.
      const isStartOfSegment =
        firstIdx === 0 ||
        wordsInLine[firstIdx - 1].verse !== highlightedVerse.verse;
      const isEndOfSegment =
        lastIdx === wordsInLine.length - 1 ||
        wordsInLine[lastIdx + 1].verse !== highlightedVerse.verse;

      setHighlightRange({
        left: leftEdge,
        width: rightEdge - leftEdge,
        isStart: isStartOfSegment,
        isEnd: isEndOfSegment,
      });
    }
  }, [highlightedVerse, line.words, paddingLeft, paddingRight]);
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
        ? '"DigitalKhatt", "Amiri", system-ui, -apple-system, sans-serif'
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

  const renderWord = (word: WordLayout, index: number) => {
    const isWordHighlighted =
      highlightedWord &&
      highlightedWord.surah === word.surah &&
      highlightedWord.verse === word.verse &&
      highlightedWord.position === word.position;

    const isVerseHighlighted =
      highlightedVerse &&
      highlightedVerse.surah === word.surah &&
      highlightedVerse.verse === word.verse;

    const isAyahEnd =
      mushafLayout === "hafs-unicode" && word.charType === "end";

    // The specific marker you identified (U+FCA1)
    const TARGET_MARKER = "\uFCA1";
    const isTarget = word.text && word.text.includes(TARGET_MARKER);

    // Layout Logic: If it's the marker, we treat it as a centered block
    const markerStyles: CSSProperties = isTarget
      ? {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "1.2em",
          margin: "0",
          borderRadius: "4px",
          position: "relative",
          verticalAlign: "middle",
        }
      : {
          position: "relative",
          display: "inline-block",
        };

    const highlightStyles: CSSProperties = isVerseHighlighted
      ? {
          // Per-word background is removed in favor of the absolute segment layer
          // but we keep it slightly visible for fallback or keep it transparent
          backgroundColor: "transparent",
          zIndex: 1,
        }
      : {};

    return (
      <span
        key={word.id}
        data-word-idx={index}
        role="button"
        tabIndex={0}
        onClick={() => handleWordClick(word)}
        onKeyDown={(event) => handleKeyDown(event, word)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          ...getWordStyle(isAyahEnd),
          ...markerStyles,
          backgroundColor: isWordHighlighted ? "red" : "blue",
          ...highlightStyles,
        }}
      >
        <span
          style={{
            // Fixes issues where the font might overlap adjacent words
            whiteSpace: "nowrap",
            fontSize: isTarget ? fontSizeWord * 0.9 : fontSizeWord,
            display: "inline-flex",
            alignItems: "center",
            fontFamily: isAyahEnd
              ? undefined
              : mushafLayout === "hafs-unicode"
                ? '"DigitalKhatt", "Amiri", system-ui'
                : "inherit",
          }}
        >
          {isAyahEnd ? `﴾${word.verse}﴿` : word.text || `[${word.id}]`}
        </span>
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
      ref={containerRef}
      style={{
        position: "absolute",
        left: paddingLeft,
        right: paddingRight,
        height: lineHeight,
        top: Math.max(0, line.y - lineHeight / 2),
        display: "flex",
        alignItems: "center",
        justifyContent: isCenteredLine ? "center" : "space-between",
        padding: "1px",
        overflow: "hidden",
      }}
    >
      {/* Absolute highlight layer */}
      {highlightRange && (
        <div
          style={{
            position: "absolute",
            left: highlightRange.left,
            width: highlightRange.width,
            height: lineHeight - 4,
            top: 2,
            backgroundColor: verseHighlightColor,
            borderTopRightRadius: highlightRange.isStart ? 8 : 0,
            borderBottomRightRadius: highlightRange.isStart ? 8 : 0,
            borderTopLeftRadius: highlightRange.isEnd ? 8 : 0,
            borderBottomLeftRadius: highlightRange.isEnd ? 8 : 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {line.lineType === "header" ? (
        <span
          style={{
            position: "relative",
            width: "100%",
            height: "auto",
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
