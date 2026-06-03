/**
 * word.tsx
 *
 * Single word cell in a page line. Mirrors the per-word render function in
 * src/view/react/line.tsx:185-264 but uses <Pressable>+<Text> instead of
 * <span>. The onLayout callback lets the parent <Line> measure each word's
 * x/width for the highlighted-verse overlay.
 */
import React, { memo, useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";

import type { WordClickedData, WordLayout } from "../../core";

export type WordProps = {
  word: WordLayout;
  index: number;
  fontSize: number;
  lineHeight: number;
  isAyahEnd: boolean;
  isCenteredLine: boolean;
  isTargetMarker: boolean;
  isWordHighlighted: boolean;
  isVerseHighlighted: boolean;
  mushafLayout: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  theme: "light" | "dark";
  wordHighlightColor?: string;
  onWordClick?: (word: WordClickedData) => void;
  /** Notifies the parent <Line> of this word's measured x/width for the verse highlight overlay. */
  onMeasure?: (index: number, x: number, width: number) => void;
};

const TARGET_MARKER = "ﲡ";

function getFontFamily(
  mushafLayout: "hafs-v2" | "hafs-v4" | "hafs-unicode",
  isAyahEnd: boolean,
): string {
  if (isAyahEnd) return "AyatMarker";
  if (mushafLayout === "hafs-unicode") return "DigitalKhatt";
  return "QuranFont";
}

function WordImpl({
  word,
  index,
  fontSize,
  lineHeight,
  isAyahEnd,
  isTargetMarker,
  isWordHighlighted,
  isVerseHighlighted,
  mushafLayout,
  theme,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  onWordClick,
  onMeasure,
}: WordProps) {
  const [pressed, setPressed] = useState(false);

  const handlePress = useCallback(() => {
    onWordClick?.({
      id: word.id,
      surahNumber: word.surah,
      ayahNumber: word.verse,
      position: word.position,
      text: word.text,
      charType: word.charType,
    });
  }, [onWordClick, word]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onMeasure?.(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width);
    },
    [onMeasure, index],
  );

  const fontFamily = getFontFamily(mushafLayout, isAyahEnd);
  const color = theme === "dark" ? "#fff" : "#34495e";

  const containerStyle: ViewStyle = {
    height: lineHeight,
    lineHeight,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginHorizontal: isAyahEnd ? 8 : 0,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    backgroundColor: isWordHighlighted
      ? wordHighlightColor
      : pressed
        ? theme === "dark"
          ? "#333"
          : "#e0e0e0"
        : "transparent",
  };

  const textStyle = {
    fontFamily,
    fontSize: isTargetMarker ? fontSize * 0.9 : fontSize,
    color,
    textAlign: "center" as const,
    // includeFontPadding false trims Android's extra top/bottom padding
    includeFontPadding: false,
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onLayout={handleLayout}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={`Surah ${word.surah} verse ${word.verse} position ${word.position}`}
    >
      <Text style={textStyle} allowFontScaling={false} numberOfLines={1}>
        {isAyahEnd ? `﴾${word.verse}﴿` : word.text || `[${word.id}]`}
      </Text>
    </Pressable>
  );
}

export const Word = memo(WordImpl);
