import type {
  MushafLayout,
  MushafLayout as CoreMushafLayout,
} from "../../core";
import type { GlyphMap, CachedGlyphData } from "./types";

/**
 * In-memory cache for loaded glyph data
 */
const glyphCache: Map<string, CachedGlyphData> = new Map();

/**
 * Load glyph map for a specific font file in a layout
 */
export async function loadGlyphMap(
  layout: MushafLayout,
  filename: string,
): Promise<GlyphMap> {
  const cacheKey = `${layout}:${filename}`;
  const cached = glyphCache.get(cacheKey);

  if (cached) {
    // Cache hit
    return cached.glyphMaps[filename] || {};
  }

  try {
    // Dynamically import the glyph data from the data package
    // Path: src/data/glyph-paths/{layout}/{filename-glyphs.json}
    const baseName = filename.replace(/\.(woff2|ttf|otf)$/, "");
    const glyphDataPath = `/data/glyph-paths/${layout}/${baseName}-glyphs.json`;

    const response = await fetch(glyphDataPath);
    if (!response.ok) {
      console.warn(`Failed to load glyphs for ${cacheKey}: ${response.status}`);
      return {};
    }

    const glyphMap: GlyphMap = await response.json();

    // Store in cache
    const existingCache = glyphCache.get(layout) || {
      layout,
      glyphMaps: {},
      loadedAt: Date.now(),
    };

    existingCache.glyphMaps[filename] = glyphMap;
    glyphCache.set(cacheKey, existingCache);

    return glyphMap;
  } catch (error) {
    console.error(`Error loading glyphs for ${cacheKey}:`, error);
    return {};
  }
}

/**
 * Load all glyph maps for a specific layout (all fonts)
 */
export async function loadAllGlyphMaps(
  layout: MushafLayout,
): Promise<Record<string, GlyphMap>> {
  const fontFilenames = [
    "hafs-unicode",
    "hafs-v2",
    "hafs-v4",
    // Add other font names as needed
  ];

  const glyphMaps: Record<string, GlyphMap> = {};

  for (const filename of fontFilenames) {
    const map = await loadGlyphMap(layout, `${filename}.woff2`);
    glyphMaps[filename] = map;
  }

  return glyphMaps;
}

/**
 * Get a glyph path for a specific codepoint
 */
export function getGlyphPath(
  glyphMap: GlyphMap,
  codepoint: number,
): { path: string; advanceWidth: number; lsb: number } | null {
  const glyph = glyphMap[codepoint];
  if (!glyph) return null;

  return {
    path: glyph.path,
    advanceWidth: glyph.advanceWidth,
    lsb: glyph.leftSideBearing,
  };
}

/**
 * Convert SVG path d attribute to Skia path commands
 * Note: For now, we'll store the SVG path as-is and use a Skia SVG plugin
 * or convert it at render time
 */
export function svgPathToSkiaPath(svgPath: string): string {
  // This is a placeholder - in production, you'd either:
  // 1. Use @shopify/react-native-skia's SVG path support
  // 2. Convert SVG paths to Skia path format at build time
  // 3. Use a library like path-to-svg for conversion
  return svgPath;
}

/**
 * Clear the glyph cache
 */
export function clearGlyphCache(): void {
  glyphCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getGlyphCacheStats(): { size: number; entries: string[] } {
  return {
    size: glyphCache.size,
    entries: Array.from(glyphCache.keys()),
  };
}
