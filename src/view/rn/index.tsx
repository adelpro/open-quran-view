import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  I18nManager,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { createLayoutCalculator } from "../../core/layout-calculator";
import type { MushafLayout, WordClickedData } from "../../core/types";
import { usePageData } from "./hooks/use-page-data";
import { useFonts } from "./hooks/use-fonts";
import { Page } from "./page";
import { computeSizing } from "./sizing";

// Quran is RTL; force LTR at the root so layout-calculator geometry
// (x from left) maps to the visual left edge. (Mirrors the React view
// at src/view/react/index.tsx:378, which sets direction: "rtl" on
// the container; here we use LTR + LTR-aware geometry because the
// calculator returns positive x from the left edge.)
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

export type OpenQuranViewRNProps = {
  page?: number;
  mushafLayout?: MushafLayout;
  width?: number;
  height?: number;
  ratio?: boolean | number;
  fit?: "width" | "height";
  theme?: "light" | "dark";
  backgroundColor?: string;
  onPageChange?: (page: number) => void;
  onWordPress?: (data: WordClickedData) => void;
  onLoad?: (pageNumber: number) => void;
};

// The official Al-Madinah Mushaf standard medium edition is ~14x20 cm
// (1:1.43 ratio). The constant lives in ./sizing.ts for unit testing.

export const OpenQuranViewRN: React.FC<OpenQuranViewRNProps> = ({
  page = 1,
  mushafLayout = "hafs-v2",
  width: widthProp,
  height: heightProp,
  ratio = true,
  fit = "width",
  theme = "light",
  backgroundColor,
  onPageChange: _onPageChange,
  onWordPress,
  onLoad,
}) => {
  const window = useWindowDimensions();
  const [observed, setObserved] = useState({ width: 0, height: 0 });
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // 1. Resolve container size (mirrors src/view/react/index.tsx:151-220)
  const { containerWidth, containerHeight } = computeSizing({
    widthProp,
    heightProp,
    ratio,
    fit,
    observedWidth: observed.width,
    observedHeight: observed.height,
    windowWidth: window.width,
    windowHeight: window.height,
  });

  // 2. Load page data + fonts in parallel
  const pageData = usePageData(mushafLayout, page);
  const fontsState = useFonts(mushafLayout, page);

  // 3. Compute layout (memoized on container size)
  const calculator = useMemo(
    () =>
      createLayoutCalculator({
        pageWidth: containerWidth,
        pageHeight: containerHeight,
      }),
    [containerWidth, containerHeight],
  );
  const pageLayout = useMemo(() => {
    if (!pageData.data) return null;
    return calculator.calculatePageLayout(pageData.data);
  }, [pageData.data, calculator]);

  // 4. Notify on first valid layout
  useEffect(() => {
    if (pageLayout) onLoad?.(page);
  }, [pageLayout, page, onLoad]);

  // 5. Layout observer — when the host container is sized, snap to it
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) {
      setObserved((o) => (o.width === width ? o : { ...o, width }));
    }
    if (height > 0) {
      setObserved((o) => (o.height === height ? o : { ...o, height }));
    }
  };

  const isLoading = pageData.loading || !fontsState.ready;
  const fontSize = (pageLayout?.metrics.lineHeight ?? 24) / 1.7;

  return (
    <View
      onLayout={handleLayout}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          backgroundColor ?? (theme === "dark" ? "#1a1a2e" : "#fafafa"),
      }}
    >
      {isLoading && (
        <ActivityIndicator
          size="large"
          color={theme === "dark" ? "#fff" : "#34495e"}
        />
      )}
      {!isLoading && pageLayout && pageData.data && (
        <Page
          layout={pageLayout}
          mushafLayout={mushafLayout}
          fontSize={fontSize}
          selectedWordId={selectedWordId}
          onWordPress={(d) => {
            setSelectedWordId(d.id);
            onWordPress?.(d);
          }}
        />
      )}
    </View>
  );
};

export default OpenQuranViewRN;