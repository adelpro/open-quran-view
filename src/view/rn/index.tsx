import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createLayoutCalculator,
  loadPage,
  type MushafLayout,
  type PageLayout,
  type WordClickedData,
  type WordLocation,
} from "../../core";
import type { OpenQuranViewRNProps, ZoomPanState } from "./types";
import { loadGlyphMap } from "./glyph-loader";
import SkiaPageRenderer from "./page-renderer";

export type { OpenQuranViewRNProps } from "./types";

export type {
  MushafLayout,
  PageLayout,
  WordClickedData,
  WordLocation,
} from "../../core";

/**
 * React Native Skia-based Quran view component
 *
 * Usage:
 * ```tsx
 * import { OpenQuranView } from 'open-quran-view/view/rn';
 *
 * export default function QuranScreen() {
 *   return (
 *     <OpenQuranView
 *       page={1}
 *       width={350}
 *       height={500}
 *       onPageChange={(page) => console.log('Page:', page)}
 *       onWordClick={(word) => console.log('Tapped:', word)}
 *     />
 *   );
 * }
 * ```
 */
export const OpenQuranView: React.FC<OpenQuranViewRNProps> = ({
  page = 1,
  width = 350,
  height = 500,
  theme = "light",
  mushafLayout = "hafs-v2",
  onPageChange,
  onLoad,
  onWordClick,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  verseHighlightColor = "rgba(135, 206, 250, 0.25)",
  enableZoom = true,
  enableSwipe = true,
  maintainRatio = true,
  aspectRatio = 0.7,
}: OpenQuranViewRNProps) => {
  const [currentPage, setCurrentPage] = useState(page);
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  // Refs for tracking state
  const layoutRef = useRef<MushafLayout>(mushafLayout);
  const calculatorRef = useRef<ReturnType<
    typeof createLayoutCalculator
  > | null>(null);
  const pageLoadRef = useRef<number | null>(null);
  const glyphMapsRef = useRef<Map<string, any>>(new Map());
  const lastGestureRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  // Sync layout ref
  useEffect(() => {
    layoutRef.current = mushafLayout;
  }, [mushafLayout]);

  // Load page layout and calculator
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load the calculator (layout configuration)
        if (!calculatorRef.current) {
          calculatorRef.current = createLayoutCalculator({
            pageWidth: width,
            pageHeight: height,
          });
        }

        // Load page data
        if (pageLoadRef.current !== currentPage) {
          const pageData = await loadPage(mushafLayout, currentPage);
          if (!pageData) {
            setError("Failed to load page data");
            setLoading(false);
            return;
          }
          const layoutCalculator = calculatorRef.current;
          const layout = layoutCalculator.calculatePageLayout(pageData);
          setPageLayout(layout);
          pageLoadRef.current = currentPage;
          onLoad?.(layout);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load page:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    loadPageData();
  }, [currentPage, mushafLayout, width, height, onLoad]);

  // Load glyph data for the current layout
  useEffect(() => {
    const loadGlyphs = async () => {
      try {
        // The exact font filename depends on your data structure
        // This is a simplified example - adjust based on your actual structure
        const fontName = mushafLayout;
        if (!glyphMapsRef.current.has(fontName)) {
          const glyphMap = await loadGlyphMap(
            mushafLayout,
            `${fontName}.woff2`,
          );
          glyphMapsRef.current.set(fontName, glyphMap);
        }
      } catch (err) {
        console.warn("Failed to load glyph data:", err);
      }
    };

    loadGlyphs();
  }, [mushafLayout]);

  // Handle page changes
  const handlePageChange = useCallback(
    (newPage: number) => {
      // Clamp to valid range (1-604)
      const validPage = Math.max(1, Math.min(604, newPage));
      if (validPage !== currentPage) {
        setCurrentPage(validPage);
        onPageChange?.(validPage);
      }
    },
    [currentPage, onPageChange],
  );

  // Handle word clicks - delegate to callback
  const handleWordClick = useCallback(
    (word: WordClickedData) => {
      onWordClick?.(word);
    },
    [onWordClick],
  );

  // Handle gestures (pinch zoom, swipe)
  const handleGesture = useCallback(
    (type: string, data: any) => {
      if (type === "zoom" && enableZoom) {
        setZoomPan((prev) => ({
          ...prev,
          scale: Math.max(1, Math.min(4, prev.scale * data.scale)),
        }));
      } else if (type === "swipe" && enableSwipe) {
        // Swipe left = next page, swipe right = previous page
        if (data.direction === "left") {
          handlePageChange(currentPage + 1);
        } else if (data.direction === "right") {
          handlePageChange(currentPage - 1);
        }
      } else if (type === "pan") {
        setZoomPan((prev) => ({
          ...prev,
          translateX: prev.translateX + data.dx,
          translateY: prev.translateY + data.dy,
        }));
      }
    },
    [enableZoom, enableSwipe, currentPage, handlePageChange],
  );

  // Render state
  if (error) {
    return (
      <ErrorPlaceholder
        message={`Error: ${error}`}
        width={width}
        height={height}
      />
    );
  }

  if (loading || !pageLayout) {
    return <LoadingPlaceholder width={width} height={height} />;
  }

  // Render the page with Skia
  return (
    <SkiaPageRenderer
      pageLayout={pageLayout}
      width={width}
      height={height}
      theme={theme}
      mushafLayout={mushafLayout}
      zoomPan={zoomPan}
      onGesture={handleGesture}
      onWordClick={handleWordClick}
      highlightedWords={highlightedWords}
      highlightedVerse={highlightedVerse}
      wordHighlightColor={wordHighlightColor}
      verseHighlightColor={verseHighlightColor}
      glyphMaps={glyphMapsRef.current}
    />
  );
};

/**
 * Simple loading placeholder
 */
function LoadingPlaceholder({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 14,
            color: "#666",
            marginBottom: 12,
          }}
        >
          Loading Quran...
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e0e0e0",
            borderTopColor: "#1976d2",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Error placeholder
 */
function ErrorPlaceholder({
  message,
  width,
  height,
}: {
  message: string;
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffebee",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div style={{ textAlign: "center", color: "#c62828" }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
          Failed to Load
        </div>
        <div style={{ fontSize: 12, color: "#d32f2f" }}>{message}</div>
      </div>
    </div>
  );
}

export default OpenQuranView;
