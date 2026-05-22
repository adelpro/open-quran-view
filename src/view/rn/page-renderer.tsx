import React, { useEffect, useRef, useState } from "react";
import type {
  PageLayout,
  MushafLayout,
  WordClickedData,
  WordLocation,
} from "../../core";
import type { ZoomPanState, GlyphMap } from "./types";

export type SkiaPageRendererProps = {
  pageLayout: PageLayout;
  width: number;
  height: number;
  theme: "light" | "dark";
  mushafLayout: MushafLayout;
  zoomPan: ZoomPanState;
  onGesture: (type: string, data: any) => void;
  onWordClick: (word: WordClickedData) => void;
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
  glyphMaps: Map<string, GlyphMap>;
};

/**
 * Skia-based page renderer for React Native and web
 *
 * This component handles rendering a single Quran page using Skia paths
 * extracted from the QCF font files. It manages:
 * - Glyph positioning based on page layout
 * - Word highlighting and selection
 * - Tap/click interaction for word selection
 * - Gesture detection (pinch-zoom, swipe)
 *
 * For React Native, this uses @shopify/react-native-skia
 * For web, this uses HTML5 Canvas as a fallback
 */
const SkiaPageRenderer: React.FC<SkiaPageRendererProps> = ({
  pageLayout,
  width,
  height,
  theme,
  mushafLayout,
  zoomPan,
  onGesture,
  onWordClick,
  highlightedWords = [],
  highlightedVerse = null,
  wordHighlightColor = "rgba(255, 215, 0, 0.5)",
  verseHighlightColor = "rgba(135, 206, 250, 0.25)",
  glyphMaps,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isPinching, setIsPinching] = useState(false);

  const backgroundColor = theme === "light" ? "#ffffff" : "#1a1a1a";
  const textColor = theme === "light" ? "#000000" : "#ffffff";

  /**
   * Render the page to canvas
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoomPan.scale, zoomPan.scale);
    ctx.translate(zoomPan.translateX, zoomPan.translateY);
    ctx.translate(-width / 2, -height / 2);

    // Draw page content
    try {
      drawPageContent(
        ctx,
        pageLayout,
        width,
        height,
        textColor,
        highlightedWords,
        highlightedVerse,
        wordHighlightColor,
        verseHighlightColor,
        glyphMaps,
        mushafLayout,
      );
    } catch (error) {
      console.error("Error drawing page:", error);
    }

    ctx.restore();
  }, [
    pageLayout,
    width,
    height,
    theme,
    backgroundColor,
    textColor,
    zoomPan,
    highlightedWords,
    highlightedVerse,
    wordHighlightColor,
    verseHighlightColor,
    glyphMaps,
    mushafLayout,
  ]);

  /**
   * Handle touch/mouse events for interaction
   */
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find which word was clicked
    const clickedWord = findWordAtPosition(
      x,
      y,
      pageLayout,
      width,
      height,
      zoomPan,
    );

    if (clickedWord) {
      onWordClick(clickedWord);
    }
  };

  /**
   * Handle touch start (for pinch detection)
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    } else if (e.touches.length === 2) {
      setIsPinching(true);
    }
  };

  /**
   * Handle touch end (for swipe detection)
   */
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart || e.changedTouches.length !== 1) {
      setTouchStart(null);
      setIsPinching(false);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    const threshold = 50; // Minimum swipe distance
    const isSwipe = Math.abs(deltaX) > threshold && Math.abs(deltaY) < 50;

    if (isSwipe) {
      const direction = deltaX > 0 ? "right" : "left";
      onGesture("swipe", { direction });
    }

    setTouchStart(null);
    setIsPinching(false);
  };

  /**
   * Handle pinch zoom
   */
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2 || !isPinching) return;

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY,
    );

    // Store previous distance if not already stored
    // This is a simplified pinch detector - in production you'd want
    // a more robust gesture detection library
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{
        cursor: "pointer",
        display: "block",
        backgroundColor,
        borderRadius: 8,
      }}
    />
  );
};

/**
 * Draw the page content to canvas
 */
function drawPageContent(
  ctx: CanvasRenderingContext2D,
  pageLayout: PageLayout,
  width: number,
  height: number,
  textColor: string,
  highlightedWords: WordLocation[],
  highlightedVerse: { surah: number; verse: number } | null,
  wordHighlightColor: string,
  verseHighlightColor: string,
  glyphMaps: Map<string, GlyphMap>,
  mushafLayout: MushafLayout,
) {
  // Draw verse highlight background first
  if (highlightedVerse) {
    drawVerseHighlight(ctx, pageLayout, highlightedVerse, verseHighlightColor);
  }

  // Draw word highlights
  if (highlightedWords.length > 0) {
    drawWordHighlights(ctx, pageLayout, highlightedWords, wordHighlightColor);
  }

  // Draw the page lines and words
  ctx.fillStyle = textColor;
  ctx.font = "14px sans-serif"; // Default font for debugging

  // Draw placeholder text showing page content
  // In production, this would render glyph paths from glyphMaps
  ctx.fillText(`Page ${pageLayout.pageNumber}`, 20, 40);

  // Draw lines
  for (const line of pageLayout.lines) {
    let x = 20;
    const y = 80 + line.lineNumber * 30;

    for (const word of line.words) {
      // This is a placeholder - in production, you would:
      // 1. Get the glyph path from glyphMaps
      // 2. Create a Path2D from the SVG path
      // 3. Render it with proper transformation and scaling
      ctx.fillText(word.text, x, y);
      x += word.text.length * 8;
    }
  }
}

/**
 * Find which word was clicked at the given position
 */
function findWordAtPosition(
  x: number,
  y: number,
  pageLayout: PageLayout,
  width: number,
  height: number,
  zoomPan: ZoomPanState,
): WordClickedData | null {
  // Transform click coordinates back to page space
  const pageX =
    (x - width / 2) / zoomPan.scale - zoomPan.translateX + width / 2;
  const pageY =
    (y - height / 2) / zoomPan.scale - zoomPan.translateY + height / 2;

  // Find word in layout
  for (const line of pageLayout.lines) {
    for (const word of line.words) {
      // Check if click is within word bounds
      // This is a simplified check - in production you'd use actual glyph bounds
      const wordX = 20 + word.position * 8;
      const wordY = 80 + line.lineNumber * 30;

      if (
        pageX >= wordX &&
        pageX <= wordX + word.text.length * 8 &&
        pageY >= wordY - 15 &&
        pageY <= wordY + 5
      ) {
        return {
          id: word.id,
          surahNumber: word.surah,
          ayahNumber: word.verse,
          position: word.position,
          text: word.text,
          charType: word.charType,
        };
      }
    }
  }

  return null;
}

/**
 * Draw highlight for a specific verse
 */
function drawVerseHighlight(
  ctx: CanvasRenderingContext2D,
  pageLayout: PageLayout,
  verse: { surah: number; verse: number },
  color: string,
): void {
  ctx.fillStyle = color;

  for (const line of pageLayout.lines) {
    const wordsInVerse = line.words.filter(
      (w) => w.surah === verse.surah && w.verse === verse.verse,
    );

    if (wordsInVerse.length === 0) continue;

    const y = 80 + line.lineNumber * 30;
    const minX = Math.min(...wordsInVerse.map((w) => w.position)) * 8;
    const maxX = Math.max(...wordsInVerse.map((w) => w.position)) * 8 + 100;

    ctx.fillRect(minX, y - 20, maxX - minX, 30);
  }
}

/**
 * Draw highlights for specific words
 */
function drawWordHighlights(
  ctx: CanvasRenderingContext2D,
  pageLayout: PageLayout,
  words: WordLocation[],
  color: string,
): void {
  ctx.fillStyle = color;

  for (const line of pageLayout.lines) {
    for (const word of line.words) {
      const isHighlighted = words.some(
        (w) =>
          w.surah === word.surah &&
          w.verse === word.verse &&
          w.position === word.position,
      );

      if (isHighlighted) {
        const x = 20 + word.position * 8;
        const y = 80 + line.lineNumber * 30;
        ctx.fillRect(x - 5, y - 15, word.text.length * 8 + 10, 20);
      }
    }
  }
}

export default SkiaPageRenderer;
