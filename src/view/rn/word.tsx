import React, { memo, useCallback } from "react";
import { Pressable, Text } from "react-native";
import type { WordClickedData, WordLayout } from "../../core";

export type WordProps = {
  word: WordLayout;
  fontSize: number;
  lineHeight: number;
  isAyahEnd: boolean;
  isSelected: boolean;
  selectionColor?: string;
  mushafLayout: string;
  onWordPress?: (data: WordClickedData) => void;
};

const familyFor = (
  layout: string,
  pageNumber: number,
  isAyahEnd: boolean,
): string => {
  if (isAyahEnd) return "AyatMarker";
  if (layout === "hafs-unicode") return "DigitalKhatt";
  return `QuranFont-${layout}-p${pageNumber}`;
};

const WordImpl = ({
  word,
  fontSize,
  lineHeight,
  isAyahEnd,
  isSelected,
  selectionColor,
  mushafLayout,
  onWordPress,
}: WordProps) => {
  const family = familyFor(mushafLayout, word.pageNumber, isAyahEnd);

  const handlePress = useCallback(() => {
    onWordPress?.({
      id: word.id,
      surahNumber: word.surah,
      ayahNumber: word.verse,
      position: word.position,
      text: word.text,
      charType: word.charType,
    });
  }, [onWordPress, word]);

  return (
    <Pressable
      onPress={handlePress}
      style={{
        position: "absolute",
        left: word.x,
        top: word.y,
        width: word.width,
        height: lineHeight,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isSelected
          ? (selectionColor ?? "rgba(255,215,0,0.5)")
          : "transparent",
      }}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          fontFamily: family,
          fontSize,
          includeFontPadding: false,
        }}
      >
        {isAyahEnd ? `﴾${word.verse}﴿` : (word.text || `[${word.id}]`)}
      </Text>
    </Pressable>
  );
};

/**
 * Renders a single Quran word at the absolute (x, y) position provided
 * by the layout calculator. Position is set via `position: "absolute"`
 * on the wrapping Pressable; the inner Text is centered inside.
 *
 * Memoized so that re-renders of the surrounding Page/Line don't
 * re-render every word when only the page/size changes.
 */
export const WordView = memo(WordImpl);