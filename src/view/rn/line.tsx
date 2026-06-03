/**
 * line.tsx
 *
 * A single page line rendered with <View> using flexDirection: 'row-reverse'
 * to match the web CSS flex layout. Handles three line types:
 *  - 'text'     → words rendered left-to-right within an RTL row
 *  - 'header'   → surah name (decorative frame is RN-unfriendly, so we use
 *                a styled <View> with a centered <Text>)
 *  - 'bismillah'→ bismillah words rendered with the Bismillah font
 *
 * The highlighted-verse overlay is computed from per-word onLayout callbacks
 * that push each word's measured x/width into a Map; once all words report,
 * the parent state calculates the overlay rect.
 */
import React, { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import type {
  LineLayout,
  Word,
  WordClickedData,
  WordLayout,
  WordLocation,
} from "../../core";
import { surahNumberToFontCode } from "../../core/font-loader.rn";
import { Word as WordView } from "./word";

const TARGET_MARKER = "ﲡ";

export type LineProps = {
  line: LineLayout;
  isCenteredLine: boolean;
  theme: "light" | "dark";
  fontSizeWord: number;
  fontSizeSurahHeader: number;
  bismillahWords: Word[];
  mushafLayout: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  lineHeight: number;
  paddingLeft: number;
  paddingRight: number;
  onWordClick?: (word: WordClickedData) => void;
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
};

function LineImpl({
  line,
  isCenteredLine,
  theme,
  fontSizeWord,
  fontSizeSurahHeader,
  bismillahWords,
  mushafLayout,
  lineHeight,
  paddingLeft,
  paddingRight,
  onWordClick,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  verseHighlightColor = "rgba(135, 206, 250, 0.25)",
}: LineProps) {
  // Map of word index → measured x position + width, for the highlight overlay.
  const measurementsRef = useRef<Map<number, { x: number; width: number }>>(
    new Map(),
  );
  // Bump this counter on every measurement flush so the overlay re-renders.
  const [overlayTick, setOverlayTick] = useState(0);

  const handleMeasure = useCallback(
    (index: number, x: number, width: number) => {
      const prev = measurementsRef.current.get(index);
      if (prev && prev.x === x && prev.width === width) return;
      measurementsRef.current.set(index, { x, width });
      setOverlayTick((t) => t + 1);
    },
    [],
  );

  const overlayStyle = useMemo<ViewStyle | null>(() => {
    if (!highlightedVerse) return null;
    const words = line.words;
    const indices = words
      .map((w, i) =>
        w.surah === highlightedVerse.surah && w.verse === highlightedVerse.verse
          ? i
          : -1,
      )
      .filter((i) => i !== -1);
    if (indices.length === 0) return null;

    const firstIdx = indices[0];
    const lastIdx = indices[indices.length - 1];

    const first = measurementsRef.current.get(firstIdx);
    const last = measurementsRef.current.get(lastIdx);
    if (!first || !last) return null; // not yet measured

    // In RTL, the lowest-index word sits on the right; the highest on the left.
    const rightEdge = first.x + first.width;
    const leftEdge = last.x;

    const isStartOfSegment =
      firstIdx === 0 ||
      words[firstIdx - 1].verse !== highlightedVerse.verse;
    const isEndOfSegment =
      lastIdx === words.length - 1 ||
      words[lastIdx + 1].verse !== highlightedVerse.verse;

    return {
      position: "absolute",
      left: leftEdge,
      width: rightEdge - leftEdge,
      top: 2,
      height: lineHeight - 4,
      backgroundColor: verseHighlightColor,
      borderTopLeftRadius: isEndOfSegment ? 8 : 0,
      borderBottomLeftRadius: isEndOfSegment ? 8 : 0,
      borderTopRightRadius: isStartOfSegment ? 8 : 0,
      borderBottomRightRadius: isStartOfSegment ? 8 : 0,
      zIndex: 0,
    };
  }, [
    highlightedVerse,
    line.words,
    overlayTick,
    lineHeight,
    verseHighlightColor,
  ]);

  const containerStyle: ViewStyle = {
    position: "absolute",
    left: paddingLeft,
    right: paddingRight,
    top: Math.max(0, line.y - lineHeight / 2),
    height: lineHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: isCenteredLine ? "center" : "space-between",
    paddingVertical: 1,
    overflow: "hidden",
  };

  const wordRowStyle: ViewStyle = {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: isCenteredLine ? "center" : "space-between",
    gap: 1,
  };

  const renderWord = (word: WordLayout, index: number) => {
    const isAyahEnd =
      mushafLayout === "hafs-unicode" && word.charType === "end";
    const isWordHighlighted = highlightedWords.some(
      (hw) =>
        hw.surah === word.surah &&
        hw.verse === word.verse &&
        hw.position === word.position,
    );
    const isVerseHighlighted =
      highlightedVerse !== null &&
      highlightedVerse.surah === word.surah &&
      highlightedVerse.verse === word.verse;
    const isTarget = word.text?.includes(TARGET_MARKER) ?? false;

    return (
      <WordView
        key={word.id}
        word={word}
        index={index}
        fontSize={fontSizeWord}
        lineHeight={lineHeight}
        isAyahEnd={isAyahEnd}
        isCenteredLine={isCenteredLine}
        isTargetMarker={isTarget}
        isWordHighlighted={isWordHighlighted}
        isVerseHighlighted={isVerseHighlighted}
        mushafLayout={mushafLayout}
        theme={theme}
        wordHighlightColor={wordHighlightColor}
        onWordClick={onWordClick}
        onMeasure={handleMeasure}
      />
    );
  };

  if (line.lineType === "header") {
    return (
      <View style={containerStyle}>
        <View
          style={{
            flex: 1,
            height: lineHeight,
            borderWidth: 1,
            borderColor: theme === "dark" ? "#34495e" : "#2c3e50",
            borderRadius: 6,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme === "dark" ? "#16213e" : "#fafafa",
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: "SurahNameFont",
              fontSize: fontSizeSurahHeader,
              fontWeight: "bold",
              color: "#2c3e50",
              textAlign: "center",
              includeFontPadding: false,
            }}
          >
            {line.surahNumber
              ? surahNumberToFontCode(line.surahNumber)
              : "surah000"}
          </Text>
        </View>
      </View>
    );
  }

  if (line.lineType === "bismillah") {
    return (
      <View style={containerStyle}>
        {overlayStyle && <View pointerEvents="none" style={overlayStyle} />}
        <View style={wordRowStyle}>
          {bismillahWords.map((w, i) => (
            <BismillahWord
              key={w.id}
              word={w}
              fontSize={fontSizeWord}
              lineHeight={lineHeight}
              fontFamily="BismillahFont"
              color={theme === "dark" ? "#fff" : "#34495e"}
              onWordClick={onWordClick}
            />
          ))}
        </View>
      </View>
    );
  }

  // 'text' / 'empty'
  return (
    <View style={containerStyle}>
      {overlayStyle && <View pointerEvents="none" style={overlayStyle} />}
      <View style={wordRowStyle}>{line.words.map(renderWord)}</View>
    </View>
  );
}

type BismillahWordProps = {
  word: Word;
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  color: string;
  onWordClick?: (word: WordClickedData) => void;
};

function BismillahWord({
  word,
  fontSize,
  lineHeight,
  fontFamily,
  color,
  onWordClick,
}: BismillahWordProps) {
  const [pressed, setPressed] = useState(false);
  const handlePress = useCallback(() => {
    onWordClick?.({
      id: word.id,
      surahNumber: 1,
      ayahNumber: 0,
      position: word.position,
      text: word.text,
      charType: word.charType,
    });
  }, [onWordClick, word]);

  return (
    <View
      style={{
        height: lineHeight,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: pressed ? "#e0e0e0" : "transparent",
      }}
      onTouchEnd={handlePress}
      onTouchStart={() => setPressed(true)}
      onTouchCancel={() => setPressed(false)}
    >
      <Text
        allowFontScaling={false}
        style={{
          fontFamily,
          fontSize,
          color,
          lineHeight,
          includeFontPadding: false,
        }}
        onPress={handlePress}
      >
        {word.text || `[${word.id}]`}
      </Text>
    </View>
  );
}

export const Line = React.memo(LineImpl);
