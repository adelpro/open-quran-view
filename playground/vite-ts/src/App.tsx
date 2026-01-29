import { useState, useCallback } from "react";
import { OpenQuranView } from "open-quran-view/view";
import "./App.css";

function App() {
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mushaf, setMushaf] = useState<"hafs-v2" | "hafs-v4" | "hafs-unicode">("hafs-v2");

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
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        background: theme === "dark" ? "#1a1a2e" : "#f5f5f5",
        transition: "background 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "0 20px",
        }}
      >
        <h1
          style={{
            color: theme === "dark" ? "#fff" : "#2c3e50",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Open Quran View
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
            <select
                value={mushaf}
                onChange={(e) => setMushaf(e.target.value as any)}
                style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "none",
                    background: theme === "dark" ? "#333" : "#fff",
                    color: theme === "dark" ? "#fff" : "#333",
                    cursor: "pointer",
                    fontSize: "14px",
                }}
            >
                <option value="hafs-v2">Hafs V2 (QCF)</option>
                <option value="hafs-v4">Hafs V4 (QCF)</option>
                <option value="hafs-unicode">Hafs Unicode (KFGQPC)</option>
            </select>
            <button
            onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
            }
            style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                background: theme === "dark" ? "#667eea" : "#333",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
            }}
            >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        <OpenQuranView
          page={page}
          width={500}
          height={700}
          theme={theme}
          mushaf={mushaf}
          onPageChange={handlePageChange}
          onWordClick={handleWordClick}
          onLoad={handleLoad}
        />

        <div
          style={{
            background: theme === "dark" ? "#2a2a3e" : "#fff",
            padding: "20px",
            borderRadius: "12px",
            width: "300px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              color: theme === "dark" ? "#fff" : "#2c3e50",
              fontFamily: "system-ui, -apple-system, sans-serif",
              marginBottom: "15px",
            }}
          >
            Quran Info
          </h2>
          <p style={{ color: theme === "dark" ? "#ccc" : "#666" }}>
            This is a demonstration of the Open Quran View component. The
            component displays Quran pages with Arabic text and navigation
            controls.
          </p>
          <div style={{ marginTop: "15px" }}>
            <p style={{ color: theme === "dark" ? "#aaa" : "#888" }}>
              <strong>Current Page:</strong> {page}
            </p>
            <p style={{ color: theme === "dark" ? "#aaa" : "#888" }}>
              <strong>Riwaya:</strong> {mushaf}
            </p>
            <p style={{ color: theme === "dark" ? "#aaa" : "#888" }}>
              <strong>Total Pages:</strong> 604
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
