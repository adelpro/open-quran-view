import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  createLayoutCalculator,
  loadAyatMarkerFont,
  loadFont,
  loadPage,
  loadSurahNameFont,
  surahNumberToFontCode,
  type MushafLayout,
  type PageLayout,
} from "../../core";

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
      pageWidth: width,
      pageHeight: height,
    });

    handleLoadPage(page);
    loadSurahNameFont();

    return () => {
      calculatorRef.current = null;
    };
  }, [width, height, page, handleLoadPage]);

  useEffect(() => {
    layoutRef.current = mushafLayout;
    handleLoadPage(page);

    if (mushafLayout === "hafs-unicode") {
      loadAyatMarkerFont();
    }
  }, [mushafLayout, page, handleLoadPage]);

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
        width,
        height,
        background: theme === "dark" ? "#1a1a2e" : "#fafafa",
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflowY: "hidden",
          overflowX: "visible",
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
              overflow: "visible",
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
                      fontSize: 42,
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
                      border: `2px solid ${theme === "dark" ? "#fff" : "#2c3e50"}`,
                      borderRadius: 8,
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

                            fontSize: 24,
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
      </div>

      <NavigationControls
        currentPage={currentPage}
        totalPages={604}
        onNext={handleNextPage}
        onPrev={handlePrevPage}
        onGoTo={handleGoToPage}
        theme={theme}
      />
    </div>
  );
};

interface NavigationControlsProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (page: number) => void;
  theme: "light" | "dark";
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onGoTo,
  theme,
}: NavigationControlsProps) => {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const pageNum = Number.parseInt(inputValue, 10);

    if (pageNum >= 1 && pageNum <= totalPages) {
      onGoTo(pageNum);
      setShowInput(false);
    } else {
      setInputValue(String(currentPage));
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
    background: "transparent",
    color: theme === "dark" ? "#fff" : "#2c3e50",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    transition: "all 0.2s ease",
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const buttonHoverStyle = {
    background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    borderColor: theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "2px",
        background:
          theme === "dark" ? "rgba(26,26,46,0.85)" : "rgba(255,255,255,0.85)",
        borderRadius: 50,
        backdropFilter: "blur(10px)",
        boxShadow:
          theme === "dark"
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.1)",
        border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage <= 1}
        style={{
          ...buttonStyle,
          opacity: currentPage <= 1 ? 0.3 : 1,
          cursor: currentPage <= 1 ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (currentPage > 1) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            background: "transparent",
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
          });
        }}
        title="السابق"
      >
        ❮
      </button>

      {showInput ? (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <input
            type="number"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onBlur={() => {
              setTimeout(() => setShowInput(false), 200);
            }}
            min={1}
            max={totalPages}
            style={{
              width: 60,
              height: 32,
              textAlign: "center",
              border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
              borderRadius: 8,
              background:
                theme === "dark"
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(255,255,255,0.9)",
              color: theme === "dark" ? "#fff" : "#2c3e50",
              fontSize: 14,
              outline: "none",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{
            background: "transparent",
            border: "none",
            color:
              theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
            fontSize: 14,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 8,
            transition: "all 0.2s ease",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
            e.currentTarget.style.color = theme === "dark" ? "#fff" : "#2c3e50";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color =
              theme === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
          }}
          title="انتقل إلى صفحة"
        >
          {currentPage} / {totalPages}
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= totalPages}
        style={{
          ...buttonStyle,
          opacity: currentPage >= totalPages ? 0.3 : 1,
          cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (currentPage < totalPages) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            background: "transparent",
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
          });
        }}
        title="التالي"
      >
        ❯
      </button>
    </div>
  );
};

export default OpenQuranView;
