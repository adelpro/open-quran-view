import { useState, useCallback } from "react";
import { OpenQuranView } from "open-quran-view/view";
import type { MushafLayout } from "open-quran-view/view/react";
import "./App.css";

const MUSHAF_OPTIONS: { value: MushafLayout; label: string }[] = [
  { value: "hafs-v2", label: "Hafs (QCF V2)" },
  { value: "hafs-v4", label: "Hafs (QCF V4 with tajweed)" },
  { value: "hafs-unicode", label: "Hafs uncode (digital khat)" },
];

function App() {
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mushafLayout, setMushafLayout] = useState<MushafLayout>("hafs-v2");

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleWordClick = useCallback(
    (word: { id: number; surahNumber?: number; ayahNumber?: number }) => {
      console.log("Word clicked:", word);
    },
    [],
  );

  const handleLoad = useCallback((layout: unknown) => {
    console.log("Page loaded:", layout);
  }, []);

  return (
    <div className={`app ${theme}`}>
      <header className={`header ${theme}`}>
        <h1 className={`title ${theme}`}>Open Quran View</h1>
        <div className="controls">
          <select
            value={mushafLayout}
            onChange={(e) => setMushafLayout(e.target.value as MushafLayout)}
            className={`select ${theme}`}
          >
            {MUSHAF_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            className={`theme-btn ${theme}`}
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            {theme === "light" ? (
              <svg
                className="icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a1a2e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                className="icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="viewer-container">
        <OpenQuranView
          page={page}
          width={500}
          height={700}
          theme={theme}
          mushafLayout={mushafLayout}
          onPageChange={handlePageChange}
          onWordClick={handleWordClick}
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
}

export default App;
