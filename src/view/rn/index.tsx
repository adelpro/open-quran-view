/**
 * OpenQuranView — React Native entry point.
 *
 * Native equivalent of src/view/react/index.tsx. Uses real <View>/<Text>/
 * <Pressable> primitives — no WebView — and renders an absolutely-positioned
 * <Line> per row of the page layout.
 *
 * Asset strategy:
 *  - Page JSON: lazy-loaded via usePageData → static require() thunks in
 *    src/core/static/data.rn.ts. Each page is a separate Metro asset, so
 *    nothing is loaded into the JS heap until the user navigates to it.
 *  - Fonts: lazy-loaded via useFonts → Font.loadAsync from the per-page
 *    require() thunks in src/core/static/fonts.rn.ts. Small always-needed
 *    fonts (DigitalKhatt, AyatQuran, SurahName) are auto-linked via
 *    react-native.config.js and available natively.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";

import {
  createLayoutCalculator,
  getBismillahWords,
  type MushafLayout,
  type PageLayout,
  type Word,
  type WordClickedData,
  type WordLocation,
} from "../../core";
import { usePageData } from "./hooks/use-page-data";
import { useFonts } from "./hooks/use-fonts";
import { Line } from "./line";
import { NavigationControls } from "./navigation-controls";

const MUSHAF_RATIO = 0.7;

const CENTERED_PAGES_VERTICAL = [1, 2] as const;
const CENTERED_PAGES_HORIZONTAL = [1, 2, 602, 603, 604] as const;
const CENTERED_PAGES_HORIZONTAL_SET = new Set<number>(
  CENTERED_PAGES_HORIZONTAL,
);

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));

export type {
  MushafLayout,
  PageLayout,
  WordClickedData,
  WordLocation,
};

export type OpenQuranViewProps = {
  page?: number;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  mushafLayout?: MushafLayout;
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: WordClickedData) => void;
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
  navigationControls?: boolean;
  ratio?: boolean | number;
  fit?: "width" | "height";
};

export const OpenQuranView: React.FC<OpenQuranViewProps> = ({
  page = 1,
  width: widthProp,
  height: heightProp,
  theme = "light",
  mushafLayout = "hafs-v2",
  ratio = true,
  onPageChange,
  onLoad,
  onWordClick,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor,
  verseHighlightColor,
  navigationControls = false,
  fit = "width",
}) => {
  const window = useWindowDimensions();
  const containerRef = useRef<View>(null);
  const [observedWidth, setObservedWidth] = useState(0);
  const [observedHeight, setObservedHeight] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [bismillahWords, setBismillahWords] = useState<Word[]>([]);

  // ── 1. Resolve container width/height from props + observed size ─────────
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const actualRatio = typeof ratio === "number" ? ratio : MUSHAF_RATIO;

    if (ratio === false) {
      setContainerWidth(widthProp ?? observedWidth ?? window.width);
      setContainerHeight(heightProp ?? observedHeight ?? window.height);
      return;
    }

    if (widthProp && heightProp) {
      setContainerWidth(widthProp);
      setContainerHeight(heightProp);
    } else if (widthProp) {
      setContainerWidth(widthProp);
      setContainerHeight(widthProp / actualRatio);
    } else if (heightProp) {
      const target = heightProp * actualRatio;
      const cap = observedWidth || window.width;
      if (target > cap) {
        setContainerWidth(cap);
        setContainerHeight(cap / actualRatio);
      } else {
        setContainerWidth(target);
        setContainerHeight(heightProp);
      }
    } else {
      // Fall back to window dimensions
      const baseW = observedWidth || window.width;
      const baseH = observedHeight || window.height;
      if (fit === "height") {
        const targetW = baseH * actualRatio;
        if (targetW > baseW) {
          setContainerWidth(baseW);
          setContainerHeight(baseW / actualRatio);
        } else {
          setContainerWidth(targetW);
          setContainerHeight(baseH);
        }
      } else {
        const targetH = baseW / actualRatio;
        if (targetH > baseH) {
          setContainerHeight(baseH);
          setContainerWidth(baseH * actualRatio);
        } else {
          setContainerWidth(baseW);
          setContainerHeight(targetH);
        }
      }
    }
  }, [
    widthProp,
    heightProp,
    observedWidth,
    observedHeight,
    window.width,
    window.height,
    ratio,
    fit,
  ]);

  // ── 2. Page data (lazy require) and fonts ────────────────────────────────
  const pageData = usePageData(mushafLayout, currentPage);
  const fontsState = useFonts(mushafLayout, currentPage);

  // ── 3. Layout calculator (memoized) ──────────────────────────────────────
  const calculator = useMemo(
    () =>
      createLayoutCalculator({
        pageWidth: containerWidth,
        pageHeight: containerHeight,
      }),
    [containerWidth, containerHeight],
  );

  // ── 4. Page layout from the loaded JSON ──────────────────────────────────
  const pageLayout = useMemo<PageLayout | null>(() => {
    if (!pageData.data) return null;
    return calculator.calculatePageLayout(pageData.data);
  }, [pageData.data, calculator]);

  // ── 5. Notify on load ────────────────────────────────────────────────────
  useEffect(() => {
    if (pageLayout) onLoad?.(pageLayout);
  }, [pageLayout, onLoad]);

  // ── 6. Bismillah words ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    getBismillahWords(mushafLayout)
      .then((words) => {
        if (!cancelled) setBismillahWords(words);
      })
      .catch(() => {
        if (!cancelled) setBismillahWords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [mushafLayout]);

  // ── 7. Sync external `page` prop → internal currentPage ──────────────────
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  // ── 8. Navigation handlers ───────────────────────────────────────────────
  const handleNextPage = useCallback(() => {
    const next = Math.min(currentPage + 1, 604);
    setCurrentPage(next);
    onPageChange?.(next);
  }, [currentPage, onPageChange]);

  const handlePrevPage = useCallback(() => {
    const prev = Math.max(currentPage - 1, 1);
    setCurrentPage(prev);
    onPageChange?.(prev);
  }, [currentPage, onPageChange]);

  const handleGoToPage = useCallback(
    (pageNum: number) => {
      const clamped = Math.max(1, Math.min(pageNum, 604));
      setCurrentPage(clamped);
      onPageChange?.(clamped);
    },
    [onPageChange],
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) setObservedWidth(width);
    if (height > 0) setObservedHeight(height);
  }, []);

  const isLoading = pageData.loading || !fontsState.ready;
  const hasError = pageData.error || fontsState.error;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={[
        styles.root,
        {
          backgroundColor: theme === "dark" ? "#1a1a2e" : "#fafafa",
        },
      ]}
    >
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator
            size="large"
            color={theme === "dark" ? "#fff" : "#34495e"}
          />
        </View>
      )}

      {hasError && !isLoading && (
        <View style={styles.errorOverlay} pointerEvents="none">
          {/* Errors are surfaced via the onLoad absence; consumers can read
              the error themselves by wiring onPageChange / a side channel. */}
        </View>
      )}

      {!isLoading && pageLayout && containerWidth > 0 && containerHeight > 0 && (
        <View
          style={{
            width: containerWidth,
            height: containerHeight,
            position: "relative",
          }}
        >
          {navigationControls && !isLoading && pageLayout && (
            <NavigationControls
              currentPage={currentPage}
              totalPages={604}
              onNext={handleNextPage}
              onPrev={handlePrevPage}
              onGoTo={handleGoToPage}
              theme={theme}
              width={containerWidth}
            />
          )}
          {pageLayout.lines.map((line) => {
            const isCenteredLine =
              line.isCentered ||
              CENTERED_PAGES_HORIZONTAL_SET.has(currentPage);

            const lineH = line.height || pageLayout.metrics.lineHeight;
            // /1.7 (slightly smaller than lineHeight/1.5) gives glyphs breathing
            // room so ayah-end markers don't crowd the line box.
            const fontSizeWord = clamp(10, lineH / 1.7, 200);
            const fontSizeSurahHeader = clamp(16, lineH / 1.7, 200);

            return (
              <Line
                key={line.lineNumber}
                line={line}
                isCenteredLine={isCenteredLine}
                theme={theme}
                fontSizeWord={fontSizeWord}
                fontSizeSurahHeader={fontSizeSurahHeader}
                bismillahWords={bismillahWords}
                mushafLayout={mushafLayout}
                lineHeight={lineH}
                onWordClick={onWordClick}
                paddingLeft={pageLayout.metrics.pagePadding.left}
                paddingRight={pageLayout.metrics.pagePadding.right}
                highlightedWords={highlightedWords}
                highlightedVerse={highlightedVerse}
                wordHighlightColor={wordHighlightColor}
                verseHighlightColor={verseHighlightColor}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

export default OpenQuranView;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

// Re-export the layout types for downstream use.
export type { LineLayout, WordLayout, PageMetrics } from "../../core/layout-calculator";
