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
};

export const OpenQuranView: React.FC<OpenQuranViewProps> = ({
  page = 1,
  height,
  theme = "light",
  mushafLayout = "hafs-v2",
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
  const [containerHeight, setContainerHeight] = useState(height || 800);
  const [bismillahWords, setBismillahWords] = useState<Word[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (height && !isFullscreen) {
      setContainerHeight(height);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        if (rect.height > 0) {
          // Keep it constrained to available width if needed to prevent horizontal overflow
          if (rect.width > 0 && rect.height * MUSHAF_RATIO > rect.width) {
            setContainerHeight(rect.width / MUSHAF_RATIO);
          } else {
            setContainerHeight(rect.height);
          }
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [height, isFullscreen]);

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

  const containerWidth = containerHeight * MUSHAF_RATIO;

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
    </div>
    /* eslint-enable jsx-a11y/no-noninteractive-tabindex */
  );
};

export default OpenQuranView;
