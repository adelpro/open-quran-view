import React from "react";
import { View } from "react-native";
import type { MushafLayout, PageLayout, WordClickedData } from "../../core";
import { Line } from "./line";

export type PageProps = {
  layout: PageLayout;
  mushafLayout: MushafLayout;
  fontSize: number;
  selectedWordId: number | null;
  onWordPress?: (data: WordClickedData) => void;
};

/**
 * Renders a single Mushaf page as a stack of absolutely-positioned
 * lines. The page has explicit width/height from the layout
 * calculator's metrics.
 */
export const Page: React.FC<PageProps> = ({
  layout,
  mushafLayout,
  fontSize,
  selectedWordId,
  onWordPress,
}) => (
  <View
    style={{
      width: layout.metrics.pageWidth,
      height: layout.metrics.pageHeight,
      position: "relative",
    }}
  >
    {layout.lines.map((line) => (
      <Line
        key={line.lineNumber}
        line={line}
        fontSize={fontSize}
        mushafLayout={mushafLayout}
        selectedWordId={selectedWordId}
        onWordPress={onWordPress}
      />
    ))}
  </View>
);