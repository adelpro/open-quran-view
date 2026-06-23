import React from "react";
import { View, Text } from "react-native";
import type {
  LineLayout,
  MushafLayout,
  WordClickedData,
} from "../../core";
import { WordView } from "./word";

export type LineProps = {
  line: LineLayout;
  fontSize: number;
  mushafLayout: MushafLayout;
  selectedWordId: number | null;
  onWordPress?: (data: WordClickedData) => void;
};

/**
 * Renders one line of the page. The line is absolutely positioned at
 * (line.x, line.y) with explicit width and height from the layout
 * calculator. The wrapping View clips its children to the line box.
 *
 * Three line kinds:
 *   - "header"   : surah-name display, centered, uses SurahNameFont
 *   - "bismillah" : centered row of bismillah glyphs using page 1's font
 *   - "text"     : the common case, renders each word via WordView
 *   - "empty"    : falls through as an empty View of the line box
 */
export const Line: React.FC<LineProps> = ({
  line,
  fontSize,
  mushafLayout,
  selectedWordId,
  onWordPress,
}) => {
  if (line.lineType === "header") {
    return (
      <View
        style={{
          position: "absolute",
          left: 0,
          top: line.y,
          width: "100%",
          height: line.height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: "SurahNameFont", fontSize: fontSize * 1.2 }}
        >
          {line.surahNumber
            ? `surah${String(line.surahNumber).padStart(3, "0")}`
            : ""}
        </Text>
      </View>
    );
  }

  if (line.lineType === "bismillah") {
    // Bismillah is rendered with page 1's font (the bismillah glyphs are
    // part of QCF page 1). The font family matches the per-page QCF
    // naming so Font.loadAsync(loadBismillahFont) -> loadFont(_, 1) covers it.
    const bismillahFamily = `QuranFont-${mushafLayout}-p1`;
    return (
      <View
        style={{
          position: "absolute",
          left: line.x,
          top: line.y,
          width: line.width,
          height: line.height,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: bismillahFamily, fontSize }}
        >
          ﷽
        </Text>
      </View>
    );
  }

  // "text" and "empty"
  return (
    <View
      style={{
        position: "absolute",
        left: line.x,
        top: line.y,
        width: line.width,
        height: line.height,
      }}
    >
      {line.words.map((word) => (
        <WordView
          key={word.id}
          word={word}
          fontSize={fontSize}
          lineHeight={line.height}
          isAyahEnd={word.charType === "end"}
          isSelected={word.id === selectedWordId}
          mushafLayout={mushafLayout}
          onWordPress={onWordPress}
        />
      ))}
    </View>
  );
};