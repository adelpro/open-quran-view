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

export type { MushafLayout, PageLayout } from "../../core";

export type OpenQuranViewProps = {
  page?: number;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  mushafLayout?: MushafLayout;
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: {
    id: number;
    surahNumber?: number;
    ayahNumber?: number;
  }) => void;
  className?: string;
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
}: OpenQuranViewProps) => {
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

  useEffect(() => {
    if (height) setContainerHeight(height);
  }, [height]);

  const containerWidth = containerHeight * MUSHAF_RATIO;

  const fontSizeSurahHeader = clamp(24, containerWidth * 0.07, 64);
  const fontSizeWord = clamp(20, containerWidth * 0.035, 64);

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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100vh",
        background: theme === "dark" ? "#1a1a2e" : "#fafafa",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        direction: "rtl",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {loading && <Loading theme={theme} />}

      {!loading && pageLayout && (
        <div
          style={{
            width: containerWidth,
            height: "100%",
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
            }}
          >
            {pageLayout.lines.map((line) => {
              const isCenteredLine =
                line.isCentered ||
                CENTERED_PAGES_HORIZONTAL_SET.has(currentPage);

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
                  lineHeight={line.height || pageLayout.metrics.lineHeight}
                  onWordClick={onWordClick}
                  surahNumberToFontCode={surahNumberToFontCode}
                  getSurahFrameUrl={getSurahFrameUrl}
                />
              );
            })}
          </div>
          <NavigationControls
            currentPage={currentPage}
            totalPages={604}
            onNext={handleNextPage}
            onPrev={handlePrevPage}
            onGoTo={handleGoToPage}
            theme={theme}
            width={containerWidth}
          />
        </div>
      )}
    </div>
  );
};

export default OpenQuranView;
