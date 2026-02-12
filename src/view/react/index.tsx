import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createLayoutCalculator,
  loadAyatMarkerFont,
  loadFont,
  loadPage,
  loadSurahNameFont,
  surahNumberToFontCode,
  getSurahFrameUrl,
  type MushafLayout,
  type PageLayout,
} from "../../core";
import { NavigationControls } from "./navigation-controls";

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
  width = 600,
  height = 850,
  theme = "light",
  mushafLayout = "hafs-v2",
  onPageChange,
  onLoad,
  onWordClick,
  className,
}: OpenQuranViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<MushafLayout>(mushafLayout);
  const calculatorRef = useRef<ReturnType<
    typeof createLayoutCalculator
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [containerSize, setContainerSize] = useState({ width, height });

  const fontSizeSurahHeader = clamp(16, containerSize.width * 0.07, 64);
  const fontSizeWord = clamp(12, containerSize.width * 0.035, 32);

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

  useEffect(() => {
    calculatorRef.current = createLayoutCalculator({
      pageWidth: containerSize.width,
      pageHeight: containerSize.height,
    });

    handleLoadPage(page);
    loadSurahNameFont();

    return () => {
      calculatorRef.current = null;
    };
  }, [containerSize.width, containerSize.height, page, handleLoadPage]);

  useEffect(() => {
    layoutRef.current = mushafLayout;
    handleLoadPage(page);

    if (mushafLayout === "hafs-unicode") {
      loadAyatMarkerFont();
    }
  }, [mushafLayout, page, handleLoadPage]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width || width,
          height: rect.height || height,
        });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        } else {
          updateSize();
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [width, height]);

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
        maxWidth: width,
        height,
        background: theme === "dark" ? "#1a1a2e" : "#fafafa",
        position: "relative",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        direction: "rtl",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: theme === "dark" ? "#fff" : "#333",
          }}
        >
          جاري التحميل...
        </div>
      )}

      {!loading && pageLayout && (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {pageLayout.lines.map((line) => {
            const isCenteredLine =
              line.isCentered || CENTERED_PAGES_HORIZONTAL_SET.has(currentPage);

            return (
              <div
                key={line.lineNumber}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: pageLayout.metrics.lineHeight,
                  top:
                    line.y -
                    pageLayout.metrics.lineHeight +
                    pageLayout.metrics.baselineOffset,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCenteredLine ? "center" : "flex-end",
                  padding: "2px",
                }}
              >
                {line.lineType === "header" ? (
                  <div
                    style={{
                      fontSize: fontSizeSurahHeader,
                      fontWeight: "bold",
                      color: theme === "dark" ? "#fff" : "#2c3e50",
                      fontFamily:
                        '"SurahNameFont", system-ui, -apple-system, sans-serif',
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: 12,
                      marginBottom: 56,
                      paddingInline: 12,
                      paddingBlock: 4,
                      background: `url("${getSurahFrameUrl()}") center/cover no-repeat`,
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {line.surahNumber
                      ? surahNumberToFontCode(line.surahNumber)
                      : "surah000"}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      width: "100%",
                      padding: "5px",
                      justifyContent: isCenteredLine
                        ? "center"
                        : "space-between",
                      gap: "4px",
                    }}
                  >
                    {line.words.map((word) => {
                      const isAyahEnd =
                        mushafLayout === "hafs-unicode" &&
                        word.charType === "end";

                      return (
                        <span
                          key={word.id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            onWordClick?.({
                              id: word.id,
                              surahNumber: word.surahNumber,
                              ayahNumber: word.ayahNumber,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onWordClick?.({
                                id: word.id,
                                surahNumber: word.surahNumber,
                                ayahNumber: word.ayahNumber,
                              });
                            }
                          }}
                          style={{
                            fontFamily: isAyahEnd
                              ? '"AyatMarker", "DigitalKhatt", system-ui'
                              : mushafLayout === "hafs-unicode"
                                ? '"DigitalKhatt", "Scheherazade New", "Amiri", system-ui, -apple-system, sans-serif'
                                : '"QuranFont", system-ui, -apple-system, sans-serif',

                            fontSize: fontSizeWord,
                            color: theme === "dark" ? "#fff" : "#34495e",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",

                            height: pageLayout.metrics.lineHeight,
                            lineHeight: `${pageLayout.metrics.lineHeight}px`,

                            verticalAlign: "middle",
                            minWidth: "auto",
                            width: "auto",
                            cursor: "pointer",
                            padding: isAyahEnd ? "0px" : "2px 4px",
                            borderRadius: 4,
                            transition: "background 0.2s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background =
                              theme === "dark" ? "#333" : "#e0e0e0";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background =
                              "transparent";
                          }}
                        >
                          {isAyahEnd
                            ? `﴾${word.ayahNumber}﴿`
                            : word.text || `[${word.id}]`}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NavigationControls
        currentPage={currentPage}
        totalPages={604}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        onGoTo={handleGoToPage}
        theme={theme}
        width={width}
      />
    </div>
  );
};

export default OpenQuranView;
