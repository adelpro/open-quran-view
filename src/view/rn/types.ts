import type {
  MushafLayout,
  PageLayout,
  WordClickedData,
  WordLocation,
} from "../../core";

/**
 * Props for the React Native OpenQuranView component using Skia Canvas
 */
export type OpenQuranViewRNProps = {
  /** Page number (1-604) */
  page?: number;

  /** Canvas width in pixels */
  width?: number;

  /** Canvas height in pixels */
  height?: number;

  /** Theme: light or dark */
  theme?: "light" | "dark";

  /** Mushaf layout: hafs-v2, hafs-v4, or hafs-unicode */
  mushafLayout?: MushafLayout;

  /** Callback when page changes */
  onPageChange?: (page: number) => void;

  /** Callback when layout is loaded */
  onLoad?: (layout: PageLayout) => void;

  /** Callback when a word is tapped */
  onWordClick?: (word: WordClickedData) => void;

  /** Array of word locations to highlight */
  highlightedWords?: WordLocation[];

  /** Verse to highlight */
  highlightedVerse?: { surah: number; verse: number } | null;

  /** Color for word highlights (rgba string) */
  wordHighlightColor?: string;

  /** Color for verse highlights (rgba string) */
  verseHighlightColor?: string;

  /** Enable pinch-to-zoom (default: true) */
  enableZoom?: boolean;

  /** Enable swipe for page navigation (default: true) */
  enableSwipe?: boolean;

  /** Maintain Mushaf aspect ratio (default: true) */
  maintainRatio?: boolean;

  /** Aspect ratio to maintain if maintainRatio is true (default: 0.7) */
  aspectRatio?: number;
};

/**
 * Skia path data for a single glyph
 */
export type GlyphPath = {
  advanceWidth: number;
  leftSideBearing: number;
  path: string; // SVG path d attribute
};

/**
 * Map of codepoint to glyph path data
 */
export type GlyphMap = Record<number, GlyphPath>;

/**
 * Internal state for managing zoom and pan
 */
export type ZoomPanState = {
  scale: number;
  translateX: number;
  translateY: number;
};

/**
 * Touch gesture event data
 */
export type GestureEvent = {
  x: number;
  y: number;
  timestamp: number;
};

/**
 * Cached glyph data for a layout
 */
export type CachedGlyphData = {
  layout: MushafLayout;
  glyphMaps: Record<string, GlyphMap>; // filename -> glyph data
  loadedAt: number;
};
