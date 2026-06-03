/**
 * App.tsx — Expo playground for open-quran-view/view/rn.
 *
 * Demonstrates the <OpenQuranView /> component end-to-end:
 *  - Page 1 (Al-Fatiha) of hafs-v2 loads on mount
 *  - Tapping a word logs the WordClickedData payload
 *  - Three buttons: prev page, toggle theme, cycle mushaf layout
 *  - NavigationControls (page input + prev/next) inside the viewer
 */
import React, { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { OpenQuranView } from "open-quran-view/view/rn";
import type { MushafLayout, WordClickedData } from "open-quran-view/view/rn";

const LAYOUTS: MushafLayout[] = ["hafs-v2", "hafs-v4", "hafs-unicode"];

export default function App() {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<"light" | "dark">(
    systemTheme === "dark" ? "dark" : "light",
  );
  const [page, setPage] = useState(1);
  const [layoutIdx, setLayoutIdx] = useState(0);
  const [lastWord, setLastWord] = useState<WordClickedData | null>(null);

  const mushafLayout = LAYOUTS[layoutIdx];

  const handleWordClick = useCallback((word: WordClickedData) => {
    setLastWord(word);
    console.log("[word clicked]", word);
  }, []);

  const cycleLayout = () => setLayoutIdx((i) => (i + 1) % LAYOUTS.length);

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: theme === "dark" ? "#0f0f1e" : "#fafafa" },
      ]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme === "dark" ? "#0f0f1e" : "#fafafa"}
      />

      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { borderBottomColor: theme === "dark" ? "#222" : "#e0e0e0" },
        ]}
      >
        <Pressable
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.6 : 1, backgroundColor: "transparent" },
          ]}
        >
          <Text
            style={[styles.btnText, { color: theme === "dark" ? "#fff" : "#2c3e50" }]}
          >
            ‹ Prev
          </Text>
        </Pressable>

        <Pressable onPress={cycleLayout} style={styles.btn}>
          <Text
            style={[styles.btnText, { color: theme === "dark" ? "#fff" : "#2c3e50" }]}
          >
            {mushafLayout}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          style={styles.btn}
        >
          <Text
            style={[styles.btnText, { color: theme === "dark" ? "#fff" : "#2c3e50" }]}
          >
            {theme === "dark" ? "☀" : "🌙"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setPage((p) => Math.min(604, p + 1))}
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.6 : 1, backgroundColor: "transparent" },
          ]}
        >
          <Text
            style={[styles.btnText, { color: theme === "dark" ? "#fff" : "#2c3e50" }]}
          >
            Next ›
          </Text>
        </Pressable>
      </View>

      {/* The viewer */}
      <View style={styles.viewerContainer}>
        <OpenQuranView
          page={page}
          theme={theme}
          mushafLayout={mushafLayout}
          onPageChange={setPage}
          onWordClick={handleWordClick}
          navigationControls
        />
      </View>

      {/* Last-clicked word debug strip */}
      {lastWord && (
        <View
          style={[
            styles.debugBar,
            { borderTopColor: theme === "dark" ? "#222" : "#e0e0e0" },
          ]}
        >
          <Text
            style={[styles.debugText, { color: theme === "dark" ? "#aaa" : "#555" }]}
            numberOfLines={1}
          >
            last: s{lastWord.surahNumber}:a{lastWord.ayahNumber} p{lastWord.position} — {lastWord.text}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewerContainer: {
    flex: 1,
    padding: 8,
  },
  debugBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  debugText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});
