import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { OpenQuranView } from "open-quran-view/view/rn";
import type {
  WordClickedData,
  PageLayout,
  MushafLayout,
} from "open-quran-view/view/rn";

/**
 * Main screen demonstrating OpenQuranView component usage
 */
export default function App() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [layout, setLayout] = useState<MushafLayout>("hafs-v2");
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordClickedData | null>(
    null,
  );
  const [pageLayoutData, setPageLayoutData] = useState<PageLayout | null>(null);

  const canvasWidth = Math.min(screenWidth - 20, 350);
  const canvasHeight = canvasWidth / 0.7; // Maintain Mushaf ratio

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedWord(null);
  };

  const handleWordClick = (word: WordClickedData) => {
    console.log("Word tapped:", word);
    setSelectedWord(word);
  };

  const handleLayoutLoaded = (layout: PageLayout) => {
    console.log(
      `Page ${layout.pageNumber} loaded with ${layout.lines.length} lines`,
    );
    setPageLayoutData(layout);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLayoutChange = (newLayout: MushafLayout) => {
    setLayout(newLayout);
    setPage(1);
  };

  const goToPreviousPage = () => {
    handlePageChange(Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    handlePageChange(Math.min(604, page + 1));
  };

  const goToFirstPage = () => {
    handlePageChange(1);
  };

  const goToLastPage = () => {
    handlePageChange(604);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? "#fff" : "#1a1a1a" },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme === "light" ? "#000" : "#fff" },
            ]}
          >
            Open Quran View
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme === "light" ? "#666" : "#aaa" },
            ]}
          >
            React Native Skia Component Example
          </Text>
        </View>

        {/* Theme Toggle */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme === "light" ? "#f0f0f0" : "#333" },
          ]}
          onPress={toggleTheme}
        >
          <Text
            style={[
              styles.buttonText,
              { color: theme === "light" ? "#000" : "#fff" },
            ]}
          >
            🌓 {theme === "light" ? "Dark" : "Light"} Mode
          </Text>
        </TouchableOpacity>

        {/* Layout Selection */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme === "light" ? "#000" : "#fff" },
          ]}
        >
          Select Layout
        </Text>
        <View style={styles.layoutButtons}>
          {(["hafs-v2", "hafs-v4", "hafs-unicode"] as const).map(
            (layoutName) => (
              <TouchableOpacity
                key={layoutName}
                style={[
                  styles.layoutButton,
                  {
                    backgroundColor:
                      layout === layoutName
                        ? "#1976d2"
                        : theme === "light"
                          ? "#e0e0e0"
                          : "#333",
                  },
                ]}
                onPress={() => handleLayoutChange(layoutName)}
              >
                <Text
                  style={[
                    styles.layoutButtonText,
                    {
                      color:
                        layout === layoutName
                          ? "#fff"
                          : theme === "light"
                            ? "#000"
                            : "#fff",
                    },
                  ]}
                >
                  {layoutName}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Quran View Component */}
        <View
          style={[
            styles.viewerContainer,
            { backgroundColor: theme === "light" ? "#f9f9f9" : "#0a0a0a" },
          ]}
        >
          <Text
            style={[
              styles.pageLabel,
              { color: theme === "light" ? "#666" : "#aaa" },
            ]}
          >
            Page {page} / 604
          </Text>

          <View
            style={[
              styles.canvasContainer,
              {
                width: canvasWidth,
                height: canvasHeight,
                backgroundColor: theme === "light" ? "#fff" : "#1a1a1a",
                borderColor: theme === "light" ? "#ddd" : "#444",
              },
            ]}
          >
            <OpenQuranView
              page={page}
              width={canvasWidth}
              height={canvasHeight}
              theme={theme}
              mushafLayout={layout}
              onPageChange={handlePageChange}
              onWordClick={handleWordClick}
              onLoad={handleLayoutLoaded}
              enableZoom={true}
              enableSwipe={true}
            />
          </View>
        </View>

        {/* Page Navigation Controls */}
        <View style={styles.navigationControls}>
          <TouchableOpacity style={styles.navButton} onPress={goToFirstPage}>
            <Text style={styles.navButtonText}>⏮️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousPage}>
            <Text style={styles.navButtonText}>⬅️</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.pageInfo,
              { color: theme === "light" ? "#000" : "#fff" },
            ]}
          >
            {page} / 604
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={goToNextPage}>
            <Text style={styles.navButtonText}>➡️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goToLastPage}>
            <Text style={styles.navButtonText}>⏭️</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Word Info */}
        {selectedWord && (
          <View
            style={[
              styles.wordInfo,
              {
                backgroundColor: theme === "light" ? "#e3f2fd" : "#1a237e",
                borderColor: "#1976d2",
              },
            ]}
          >
            <Text style={[styles.wordInfoTitle, { color: "#1976d2" }]}>
              ✓ Word Selected
            </Text>
            <Text
              style={[
                styles.wordInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Text: {selectedWord.text}
            </Text>
            <Text
              style={[
                styles.wordInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Surah: {selectedWord.surahNumber} | Verse:{" "}
              {selectedWord.ayahNumber}
            </Text>
            <Text
              style={[
                styles.wordInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Position: {selectedWord.position}
            </Text>
            <Text
              style={[
                styles.wordInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Type: {selectedWord.charType}
            </Text>
          </View>
        )}

        {/* Page Layout Info */}
        {pageLayoutData && (
          <View
            style={[
              styles.layoutInfo,
              {
                backgroundColor: theme === "light" ? "#f3e5f5" : "#1a0033",
                borderColor: "#7b1fa2",
              },
            ]}
          >
            <Text style={[styles.layoutInfoTitle, { color: "#7b1fa2" }]}>
              📖 Page Information
            </Text>
            <Text
              style={[
                styles.layoutInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Lines: {pageLayoutData.lines.length}
            </Text>
            <Text
              style={[
                styles.layoutInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Words:{" "}
              {pageLayoutData.lines.reduce(
                (sum, line) => sum + line.words.length,
                0,
              )}
            </Text>
            <Text
              style={[
                styles.layoutInfoText,
                { color: theme === "light" ? "#000" : "#fff" },
              ]}
            >
              Layout: {layout}
            </Text>
          </View>
        )}

        {/* Features Info */}
        <View
          style={[
            styles.featuresBox,
            { backgroundColor: theme === "light" ? "#f5f5f5" : "#2a2a2a" },
          ]}
        >
          <Text
            style={[
              styles.featuresTitle,
              { color: theme === "light" ? "#000" : "#fff" },
            ]}
          >
            ✨ Features
          </Text>
          <View style={styles.featuresList}>
            <FeatureItem
              text="High-fidelity Quran text rendering"
              theme={theme}
            />
            <FeatureItem
              text="Multiple Mushaf layouts (hafs-v2, v4, unicode)"
              theme={theme}
            />
            <FeatureItem
              text="Word-level interaction and highlighting"
              theme={theme}
            />
            <FeatureItem
              text="Pinch-to-zoom and swipe navigation"
              theme={theme}
            />
            <FeatureItem text="Light and dark themes" theme={theme} />
            <FeatureItem text="Responsive design" theme={theme} />
          </View>
        </View>

        {/* Integration Guide */}
        <View
          style={[
            styles.guideBox,
            { backgroundColor: theme === "light" ? "#e8f5e9" : "#0d3d0d" },
          ]}
        >
          <Text style={[styles.guideTitle, { color: "#2e7d32" }]}>
            📚 Quick Start
          </Text>
          <Text
            style={[
              styles.guideText,
              { color: theme === "light" ? "#000" : "#fff" },
            ]}
          >
            {`import { OpenQuranView } from 'open-quran-view/view/rn';\n\n<OpenQuranView\n  page={1}\n  width={350}\n  height={500}\n  onPageChange={(page) => {}}\n  onWordClick={(word) => {}}\n/>`}
          </Text>
        </View>

        {/* Status */}
        <View style={styles.statusSection}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color="#1976d2" />
              <Text
                style={[
                  styles.statusText,
                  { color: theme === "light" ? "#666" : "#aaa" },
                ]}
              >
                Loading...
              </Text>
            </>
          ) : (
            <Text style={[styles.statusText, { color: "#4caf50" }]}>
              ✓ Ready
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Feature item component
 */
function FeatureItem({
  text,
  theme,
}: {
  text: string;
  theme: "light" | "dark";
}) {
  return (
    <View style={styles.featureItem}>
      <Text
        style={[
          styles.featureCheckmark,
          { color: theme === "light" ? "#000" : "#fff" },
        ]}
      >
        ✓
      </Text>
      <Text
        style={[
          styles.featureText,
          { color: theme === "light" ? "#000" : "#fff" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  layoutButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  layoutButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  layoutButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewerContainer: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  pageLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "500",
  },
  canvasContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  navigationControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1976d2",
    borderRadius: 22,
  },
  navButtonText: {
    fontSize: 20,
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: "600",
    marginHorizontal: 12,
    minWidth: 60,
    textAlign: "center",
  },
  wordInfo: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  wordInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  wordInfoText: {
    fontSize: 13,
    marginVertical: 4,
    fontFamily: "monospace",
  },
  layoutInfo: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  layoutInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  layoutInfoText: {
    fontSize: 13,
    marginVertical: 4,
  },
  featuresBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureCheckmark: {
    fontSize: 16,
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  guideBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  guideText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  statusSection: {
    alignItems: "center",
    marginTop: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
