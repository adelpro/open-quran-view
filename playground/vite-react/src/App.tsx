import { useState, useCallback, useEffect } from "react";
import { OpenQuranView } from "open-quran-view/view";
import type { MushafLayout, WordClickedData } from "open-quran-view/view/react";
import quranWordsData from "../data/tafseers/quran-words.json";
import type {
  WordMap,
  WordTafseer,
  VerseTafseer,
  SelectedTafseer,
} from "./types/tafseer";
import type { WordLocation } from "open-quran-view/view/react";
import { TafseerDialog } from "./components/TafseerDialog";
import "./App.css";

const quranWords = quranWordsData as WordMap;

const MUSHAF_OPTIONS: { value: MushafLayout; label: string }[] = [
  { value: "hafs-v2", label: "Hafs (QCF V2)" },
  { value: "hafs-v4", label: "Hafs (QCF V4 with tajweed)" },
  { value: "hafs-unicode", label: "Hafs uncode (digital khat)" },
];

function App() {
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");
    return pageParam ? Math.max(1, Math.min(604, parseInt(pageParam, 10))) : 1;
  });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mushafLayout, setMushafLayout] = useState<MushafLayout>("hafs-v2");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedTafseer, setSelectedTafseer] =
    useState<SelectedTafseer | null>(null);
  const [highlightedVerse, setHighlightedVerse] = useState<{
    surah: number;
    verse: number;
  } | null>(null);
  const [highlightedWords, setHighlightedWords] = useState<WordLocation[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get("page");
      if (pageParam) {
        const pageNum = parseInt(pageParam, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
          setPage(pageNum);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
  }, []);

  const handleWordClick = useCallback((word: WordClickedData) => {
    if (word.charType === "end") {
      const verseKey = `${word.surahNumber}:${word.ayahNumber}`;
      const verseTafseer = quranWords[verseKey] as VerseTafseer | undefined;
      if (verseTafseer) {
        setSelectedTafseer({
          tafseer: verseTafseer.tafseer,
          verse: verseTafseer.verse,
          surah: verseTafseer.surah,
        });
        setHighlightedVerse({
          surah: word.surahNumber!,
          verse: word.ayahNumber!,
        });
      }
      return;
    }

    if (word.charType === "word") {
      setHighlightedWords((prev) => [
        ...prev,
        {
          surah: word.surahNumber,
          verse: word.ayahNumber,
          position: word.position,
        },
      ]);
      const wordKey = `${word.surahNumber}:${word.ayahNumber}:${word.position}`;
      const wordTafseer = quranWords[wordKey] as WordTafseer | undefined;
      if (wordTafseer) {
        setSelectedTafseer({
          tafseer: wordTafseer.tafseer,
          verse: wordTafseer.verse,
          surah: wordTafseer.surah,
          position: word.position,
          text: wordTafseer.text,
        });
      }
      return;
    }
  }, []);

  const closeTafseerDialog = useCallback(() => {
    setSelectedTafseer(null);
  }, []);

  const handleLoad = useCallback(() => {}, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className={`app ${theme}`}>
      <header className={`header ${theme}`}>
        <div className="header-content">
          <div className="header-left">
            <h1 className={`title ${theme}`}>Open Quran View</h1>
          </div>

          {isMobile ? (
            <>
              <button
                className={`mobile-menu-btn ${theme}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isMobileMenuOpen ? (
                    <path d="M18 6L6 18M6 6l12 12" />
                  ) : (
                    <>
                      <path d="M3 12h18M3 6h18M3 18h18" />
                    </>
                  )}
                </svg>
              </button>
            </>
          ) : (
            <div className="controls">
              <select
                value={mushafLayout}
                onChange={(e) =>
                  setMushafLayout(e.target.value as MushafLayout)
                }
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
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
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
          )}
        </div>

        {isMobile && isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-controls">
              <select
                value={mushafLayout}
                onChange={(e) => {
                  setMushafLayout(e.target.value as MushafLayout);
                  closeMobileMenu();
                }}
                className={`select ${theme}`}
              >
                {MUSHAF_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setTheme((prev) => (prev === "light" ? "dark" : "light"));
                  closeMobileMenu();
                }}
                className={`theme-btn ${theme}`}
                title={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
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
          </div>
        )}
      </header>

      <div className="viewer-container">
        {/* width, default to full container width 
            height, default to 70% of width (to maintain typical mushaf aspect ratio)        
        */}
        <OpenQuranView
          page={page}
          theme={theme}
          fit="height"
          mushafLayout={mushafLayout}
          onPageChange={handlePageChange}
          onWordClick={handleWordClick}
          onLoad={handleLoad}
          navigationControls
          highlightedVerse={highlightedVerse || undefined}
          highlightedWords={highlightedWords}
        />
      </div>

      <TafseerDialog
        selectedTafseer={selectedTafseer}
        theme={theme}
        onClose={closeTafseerDialog}
      />
    </div>
  );
}

export default App;
