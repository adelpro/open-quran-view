import React, { useEffect, useState } from "react";

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));

export interface NavigationControlsProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (page: number) => void;
  theme: "light" | "dark";
  width: number;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onGoTo,
  theme,
  width,
  isFullscreen = false,
  onFullscreenToggle,
}: NavigationControlsProps) => {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [showInput, setShowInput] = useState(false);

  const fontSizeNav = clamp(24, width * 0.023, 18);

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
              fontSize: fontSizeNav,
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
            fontSize: fontSizeNav,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 8,
            transition: "all 0.2s ease",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
            whiteSpace: "nowrap",
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

      {onFullscreenToggle && (
        <button
          type="button"
          onClick={onFullscreenToggle}
          style={{
            ...buttonStyle,
            marginLeft: 8,
          }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              background: "transparent",
              borderColor:
                theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
            });
          }}
          title={
            isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen"
          }
        >
          {isFullscreen ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default NavigationControls;
