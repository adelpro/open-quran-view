import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  loadPage,
  loadFont,
  createLayoutCalculator,
  type MushafLayout,
  type PageLayout,
} from "../../core";

export type OpenQuranViewProps = {
  page?: number;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  mushaf?: MushafLayout;
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
  mushaf = "hafs-v2",
  onPageChange,
  onLoad,
  onWordClick,
  className,
}: OpenQuranViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<MushafLayout>(mushaf);
  const calculatorRef = useRef<ReturnType<
    typeof createLayoutCalculator
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(page);
  const [layout, setLayout] = useState<PageLayout | null>(null);

  // Update layout ref when prop changes
  useEffect(() => {
    layoutRef.current = mushaf;
    handleLoadPage(currentPage);
  }, [mushaf]);

  const handleLoadPage = useCallback(
    async (pageNum: number) => {
      if (!calculatorRef.current || !containerRef.current) return;

      setLoading(true);
      try {
        await loadFont(layoutRef.current, pageNum);
        const quranPage = await loadPage(layoutRef.current, pageNum);
        if (!quranPage) return;
        const pageLayout = calculatorRef.current.calculatePageLayout(quranPage);
        setLayout(pageLayout);
        setCurrentPage(pageNum);
        onLoad?.(pageLayout);
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

    return () => {
      calculatorRef.current = null;
    };
  }, [width, height, page, handleLoadPage]);

  const handleNextPage = useCallback(async () => {
    await handleLoadPage(currentPage + 1);
    onPageChange?.(currentPage + 1);
  }, [currentPage, handleLoadPage, onPageChange]);

  const handlePrevPage = useCallback(async () => {
    await handleLoadPage(currentPage - 1);
    onPageChange?.(currentPage - 1);
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

      {!loading && layout && (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {layout.lines.map((line) => (
            <div
              key={line.lineNumber}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: layout.metrics.lineHeight,
                top:
                  line.y -
                  layout.metrics.lineHeight +
                  layout.metrics.baselineOffset,
                display: "flex",
                alignItems: "center",
                justifyContent: line.isCentered ? "center" : "flex-start",
                paddingLeft: line.isCentered
                  ? 0
                  : layout.metrics.pagePadding.left,
              }}
            >
              {line.lineType === "header" ? (
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    color: theme === "dark" ? "#fff" : "#2c3e50",
                    width: "100%",
                    textAlign: "center",
                    borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
                    padding: "10px 0",
                    background: theme === 'dark' ? '#222' : '#f0f0f0'
                  }}
                >
                  سورة {line.surahNumber}
                </div>
              ) : line.lineType === "bismillah" ? (
                 <div
                  style={{
                    fontSize: 24,
                    color: theme === "dark" ? "#ccc" : "#555",
                    width: "100%",
                    textAlign: "center",
                    fontFamily: '"QuranFont", system-ui, sans-serif'
                  }}
                >
                  بسم الله الرحمن الرحيم
                </div>
              ) : (
                line.words.map((word) => (
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onWordClick?.({
                          id: word.id,
                          surahNumber: word.surahNumber,
                          ayahNumber: word.ayahNumber,
                        });
                      }
                    }}
                    style={{
                      fontFamily:
                        '"QuranFont", system-ui, -apple-system, sans-serif',
                      fontSize: 24,
                      color: theme === "dark" ? "#fff" : "#34495e",
                      margin: "0 4px",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: 4,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        theme === "dark" ? "#333" : "#e0e0e0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {word.text || `[${word.id}]`}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      )}

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

  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(inputValue, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onGoTo(pageNum);
    } else {
      setInputValue(String(currentPage));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "8px 16px",
        background:
          theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)",
        borderRadius: 8,
        backdropFilter: "blur(10px)",
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage <= 1}
        style={{
          padding: "6px 12px",
          border: "none",
          borderRadius: 4,
          background: theme === "dark" ? "#333" : "#667eea",
          color: "#fff",
          cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          opacity: currentPage <= 1 ? 0.5 : 1,
        }}
      >
        السابق
      </button>

      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        min={1}
        max={totalPages}
        style={{
          width: 60,
          padding: 6,
          textAlign: "center",
          border: `1px solid ${theme === "dark" ? "#444" : "#ddd"}`,
          borderRadius: 4,
          background: theme === "dark" ? "#222" : "#fff",
          color: theme === "dark" ? "#fff" : "#333",
        }}
      />

      <span style={{ color: theme === "dark" ? "#888" : "#666" }}>
        من {totalPages}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage >= totalPages}
        style={{
          padding: "6px 12px",
          border: "none",
          borderRadius: 4,
          background: theme === "dark" ? "#333" : "#667eea",
          color: "#fff",
          cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
          opacity: currentPage >= totalPages ? 0.5 : 1,
        }}
      >
        التالي
      </button>
    </form>
  );
};

export default OpenQuranView;
