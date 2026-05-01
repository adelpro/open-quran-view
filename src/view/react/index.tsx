import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createLayoutCalculator,
  getBismillahWords,
  loadAyatMarkerFont,
  loadBismillahFont,
  loadFont,
  loadPage,
  loadSurahNameFont,
  surahNumberToFontCode,
  getSurahFrameUrl,
  type MushafLayout,
  type PageLayout,
  type Word,
  type WordClickedData,
  type WordLocation,
} from "../../core";
import { NavigationControls } from "./navigation-controls";
import Line from "./line";
import Loading from "./loading";

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));

export const CENTERED_PAGES_VERTICAL = [1, 2] as const;
export const CENTERED_PAGES_HORIZONTAL = [1, 2, 602, 603, 604] as const;
const CENTERED_PAGES_HORIZONTAL_SET = new Set<number>(
  CENTERED_PAGES_HORIZONTAL,
);

export type {
  MushafLayout,
  PageLayout,
  WordClickedData,
  WordLocation,
} from "../../core";

export type OpenQuranViewProps = {
  page?: number;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  mushafLayout?: MushafLayout;
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: WordClickedData) => void;
  className?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
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
  width,
  height,
  theme = "light",
  mushafLayout = "hafs-v2",
  ratio = true,
  onPageChange,
  onLoad,
  onWordClick,
  className,
  fullscreen = false,
  onFullscreenToggle,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor,
  verseHighlightColor,
  navigationControls = false,
  fit = "width",
}: OpenQuranViewProps) => {
  // The official Al-Madinah Mushaf standard medium edition measures ~14x20 cm.
  // 14 / 20 = 0.7, giving a ratio of 1:1.43.
  // Other editions include Large/Premium (~20x28 cm, 0.71 ratio) and Travel/Small (~11.5x18.7 cm, ~0.61 ratio).
  // We use 0.7 to best match the most common widespread physical edition.
  const MUSHAF_RATIO = 0.7;
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<MushafLayout>(mushafLayout);
  const calculatorRef = useRef<ReturnType<
    typeof createLayoutCalculator
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [containerWidth, setContainerWidth] = useState(width || 0);
  const [containerHeight, setContainerHeight] = useState(height || 0);
  const [bismillahWords, setBismillahWords] = useState<Word[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Validate prop combinations and warn about ignored props
  if (process.env.NODE_ENV !== "production") {
    if (width && height && fit !== "width") {
      console.warn(
        `OpenQuranView: Both width and height are provided. The "fit" prop will be ignored.`
      );
    }
    if (fit === "height" && width && !height) {
      console.warn(
        `OpenQuranView: "fit=\"height\"" is ignored when width is provided without height. Using width as provided.`
      );
    }
    if (fit === "width" && height && !width) {
      console.warn(
        `OpenQuranView: "fit=\"width\"" is ignored when height is provided without width. Using height as provided.`
      );
    }
    if (ratio === false && fit !== "width") {
      console.warn(
        `OpenQuranView: The "fit" prop is ignored when ratio={false} because no dimension derivation occurs.`
      );
    }
    if (isFullscreen && (width || height)) {
      console.warn(
        `OpenQuranView: Explicit width/height are ignored in fullscreen mode.`
      );
    }
  }

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    if (ratio === false) {
      // When ratio is disabled, use explicit dimensions if provided
      if (width && height && !isFullscreen) {
        setContainerWidth(width);
        setContainerHeight(height);
        return;
      }
      if (width && !isFullscreen) {
        setContainerWidth(width);
      } else {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const rect = entry.contentRect;
            if (rect.width > 0) setContainerWidth(rect.width);
            if (rect.height > 0) setContainerHeight(rect.height);
          }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
      }
      return;
    }

    // When ratio is enabled, fit only matters when neither dimension is provided
    if (width && !isFullscreen) {
      setContainerWidth(width);
      return;
    }
    if (height && !isFullscreen) {
      setContainerHeight(height);
      return;
    }

    // Neither dimension provided - use fit to decide which to track
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        if (fit === "height") {
          if (rect.height > 0) setContainerHeight(rect.height);
        } else {
          if (rect.width > 0) setContainerWidth(rect.width);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [width, height, ratio, fit, isFullscreen]);

  // Derive missing dimension from provided one to maintain mushaf ratio
  useEffect(() => {
    if (ratio === false) return;

    const actualRatio = typeof ratio === "number" ? ratio : MUSHAF_RATIO;

    if (height && !isFullscreen) {
      const derivedWidth = height * actualRatio;
      const clampedWidth =
        containerWidth > 0 ? Math.min(derivedWidth, containerWidth) : derivedWidth;
      setContainerWidth(clampedWidth);
      setContainerHeight(height);
      return;
    }
    if (containerWidth > 0) {
      setContainerHeight(containerWidth / actualRatio);
    }
  }, [height, containerWidth, isFullscreen, ratio]);

  const handleFullscreenToggle = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          onFullscreenToggle?.(true);
        })
        .catch((err) => {
          console.error("Failed to enter fullscreen:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
          onFullscreenToggle?.(false);
        })
        .catch((err) => {
          console.error("Failed to exit fullscreen:", err);
        });
    }
  }, [onFullscreenToggle]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        onFullscreenToggle?.(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onFullscreenToggle]);

  useEffect(() => {
    setIsFullscreen(fullscreen);
  }, [fullscreen]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleLoadPage = useCallback(
    async (pageNum: number) => {
      if (!calculatorRef.current || !containerRef.current) return;

      setLoading(true);
      try {
        await loadFont(layoutRef.current, pageNum);
        const quranPage = await loadPage(layoutRef.current, pageNum);
        if (!quranPage) return;

        const calculatedLayout =
          calculatorRef.current.calculatePageLayout(quranPage);

        setPageLayout(calculatedLayout);
        setCurrentPage(pageNum);
        onLoad?.(calculatedLayout);
      } catch (error) {
        console.error("Failed to load page:", error);
      } finally {
        setLoading(false);
      }
    },
    [onLoad],
  );

  // Init layout calculator
  useEffect(() => {
    calculatorRef.current = createLayoutCalculator({
      pageWidth: containerWidth,
      pageHeight: containerHeight,
    });

    handleLoadPage(page);
    loadSurahNameFont();

    return () => {
      calculatorRef.current = null;
    };
  }, [containerWidth, containerHeight, page, handleLoadPage]);

  useEffect(() => {
    layoutRef.current = mushafLayout;
    handleLoadPage(page);

    if (mushafLayout === "hafs-unicode") loadAyatMarkerFont();
  }, [mushafLayout, page, handleLoadPage]);

  useEffect(() => {
    loadBismillahFont(mushafLayout);
    getBismillahWords(mushafLayout).then(setBismillahWords);
  }, [mushafLayout]);

  const handleNextPage = useCallback(async () => {
    const next = currentPage + 1;
    await handleLoadPage(next);
    onPageChange?.(next);
  }, [currentPage, handleLoadPage, onPageChange]);

  const handlePrevPage = useCallback(async () => {
    const prev = currentPage - 1;
    await handleLoadPage(prev);
    onPageChange?.(prev);
  }, [currentPage, handleLoadPage, onPageChange]);

  const handleGoToPage = useCallback(
    async (pageNum: number) => {
      await handleLoadPage(pageNum);
      onPageChange?.(pageNum);
    },
    [handleLoadPage, onPageChange],
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handlePrevPage();
      } else if (e.key === "ArrowLeft") {
        handleNextPage();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleNextPage, handlePrevPage]);

  return (
    /* eslint-disable jsx-a11y/no-noninteractive-tabindex */
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label="Quran Viewer"
      style={{
        position: "relative",
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "100%",
        background: theme === "dark" ? "#1a1a2e" : "#fafafa",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        direction: "rtl",
        display: "flex",
        justifyContent: "center",
        cursor: isFullscreen ? (showControls ? "default" : "none") : "default",
      }}
      onMouseMove={handleMouseMove}
      tabIndex={0}
    >
      {loading && <Loading theme={theme} />}

      {!loading && pageLayout && (
        <div
          style={{
            width: containerWidth,
            height: containerHeight,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: containerHeight,
              overflow: "hidden",
            }}
          >
            {pageLayout.lines.map((line) => {
              const isCenteredLine =
                line.isCentered ||
                CENTERED_PAGES_HORIZONTAL_SET.has(currentPage);

              const lineH = line.height || pageLayout.metrics.lineHeight;
              // Layout calculator assumes fontSize = lineH / 1.5 for word-width estimation.
              // We use /1.7 (slightly smaller) to add breathing room inside the line box
              // so glyphs (especially small ayah-end circle markers) don't crowd the edges.
              const fontSizeWord = clamp(10, lineH / 1.7, 200);
              const fontSizeSurahHeader = clamp(16, lineH / 1.7, 200);

              return (
                <Line
                  key={line.lineNumber}
                  line={line}
                  isCenteredLine={isCenteredLine}
                  theme={theme}
                  fontSizeSurahHeader={fontSizeSurahHeader}
                  fontSizeWord={fontSizeWord}
                  bismillahWords={bismillahWords}
                  mushafLayout={mushafLayout}
                  lineHeight={lineH}
                  onWordClick={onWordClick}
                  surahNumberToFontCode={surahNumberToFontCode}
                  getSurahFrameUrl={getSurahFrameUrl}
                  paddingLeft={pageLayout.metrics.pagePadding.left}
                  paddingRight={pageLayout.metrics.pagePadding.right}
                  highlightedWords={highlightedWords}
                  highlightedVerse={highlightedVerse}
                  wordHighlightColor={wordHighlightColor}
                  verseHighlightColor={verseHighlightColor}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation controls - positioned relative to the main container */}
      {navigationControls && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: showControls ? 1 : 0,
            pointerEvents: showControls ? "auto" : "none",
            transition: "opacity 0.3s ease",
            zIndex: 10,
          }}
        >
          {!loading && pageLayout && (
            <NavigationControls
              currentPage={currentPage}
              totalPages={604}
              onNext={handleNextPage}
              onPrev={handlePrevPage}
              onGoTo={handleGoToPage}
              theme={theme}
              width={containerWidth}
              isFullscreen={isFullscreen}
              onFullscreenToggle={handleFullscreenToggle}
            />
          )}
        </div>
      )}
    </div>

    /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
  );
};

export default OpenQuranView;
