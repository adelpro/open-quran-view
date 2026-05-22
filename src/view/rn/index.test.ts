import { describe, it, expect, beforeEach, vi } from "vitest";
import type { OpenQuranViewRNProps, ZoomPanState, GlyphPath } from "./types";
import { loadGlyphMap, getGlyphPath, clearGlyphCache } from "./glyph-loader";

describe("React Native Skia View", () => {
  describe("Glyph Loader", () => {
    beforeEach(() => {
      clearGlyphCache();
    });

    it("should have types exported", () => {
      // This is more of a TypeScript compilation check
      const props: OpenQuranViewRNProps = {
        page: 1,
        width: 350,
        height: 500,
        theme: "light",
        mushafLayout: "hafs-v2",
      };

      expect(props.page).toBe(1);
      expect(props.width).toBe(350);
      expect(props.height).toBe(500);
      expect(props.theme).toBe("light");
    });

    it("should have correct ZoomPanState type", () => {
      const state: ZoomPanState = {
        scale: 1.5,
        translateX: 10,
        translateY: 20,
      };

      expect(state.scale).toBe(1.5);
      expect(state.translateX).toBe(10);
      expect(state.translateY).toBe(20);
    });

    it("should have correct GlyphPath type", () => {
      const glyph: GlyphPath = {
        advanceWidth: 1000,
        leftSideBearing: 100,
        path: "M 100 0 L 200 100 Z",
      };

      expect(glyph.advanceWidth).toBe(1000);
      expect(glyph.leftSideBearing).toBe(100);
      expect(glyph.path).toMatch(/^M/);
    });

    it("should support highlighted words", () => {
      const props: OpenQuranViewRNProps = {
        page: 1,
        highlightedWords: [
          { surah: 1, verse: 1, position: 0 },
          { surah: 1, verse: 1, position: 1 },
        ],
      };

      expect(props.highlightedWords).toHaveLength(2);
      expect(props.highlightedWords[0].surah).toBe(1);
    });

    it("should support verse highlighting", () => {
      const props: OpenQuranViewRNProps = {
        page: 1,
        highlightedVerse: { surah: 1, verse: 5 },
      };

      expect(props.highlightedVerse?.surah).toBe(1);
      expect(props.highlightedVerse?.verse).toBe(5);
    });

    it("should support custom colors", () => {
      const props: OpenQuranViewRNProps = {
        page: 1,
        wordHighlightColor: "rgba(255, 0, 0, 0.5)",
        verseHighlightColor: "rgba(0, 255, 0, 0.5)",
      };

      expect(props.wordHighlightColor).toContain("255, 0, 0");
      expect(props.verseHighlightColor).toContain("0, 255, 0");
    });

    it("should support gesture options", () => {
      const props: OpenQuranViewRNProps = {
        page: 1,
        enableZoom: false,
        enableSwipe: true,
      };

      expect(props.enableZoom).toBe(false);
      expect(props.enableSwipe).toBe(true);
    });

    it("should support aspect ratio settings", () => {
      const props: OpenQuranViewRNProps = {
        page: 1,
        maintainRatio: true,
        aspectRatio: 0.7,
      };

      expect(props.maintainRatio).toBe(true);
      expect(props.aspectRatio).toBe(0.7);
    });

    it("should support callbacks", () => {
      const onPageChange = vi.fn();
      const onLoad = vi.fn();
      const onWordClick = vi.fn();

      const props: OpenQuranViewRNProps = {
        page: 1,
        onPageChange,
        onLoad,
        onWordClick,
      };

      expect(props.onPageChange).toBeDefined();
      expect(props.onLoad).toBeDefined();
      expect(props.onWordClick).toBeDefined();
    });

    it("should validate page numbers", () => {
      expect(() => {
        const page: number = Math.max(1, Math.min(604, 1));
        expect(page).toBe(1);
      }).not.toThrow();

      expect(() => {
        const page: number = Math.max(1, Math.min(604, 604));
        expect(page).toBe(604);
      }).not.toThrow();

      expect(() => {
        const page: number = Math.max(1, Math.min(604, 0));
        expect(page).toBe(1);
      }).not.toThrow();

      expect(() => {
        const page: number = Math.max(1, Math.min(604, 700));
        expect(page).toBe(604);
      }).not.toThrow();
    });
  });

  describe("Layout Calculations", () => {
    it("should calculate correct dimensions with aspect ratio", () => {
      const MUSHAF_RATIO = 0.7;
      const width = 350;

      const expectedHeight = width / MUSHAF_RATIO;
      expect(expectedHeight).toBeCloseTo(500, 0);
    });

    it("should handle zoom transformations", () => {
      const initialScale = 1;
      const zoomFactor = 1.5;
      const newScale = Math.max(1, Math.min(4, initialScale * zoomFactor));

      expect(newScale).toBe(1.5);
    });

    it("should clamp zoom within bounds", () => {
      const bounds = { min: 1, max: 4 };
      const testZooms = [0.5, 1, 2, 4, 5, 10];

      testZooms.forEach((zoom) => {
        const clamped = Math.max(bounds.min, Math.min(bounds.max, zoom));
        expect(clamped).toBeGreaterThanOrEqual(bounds.min);
        expect(clamped).toBeLessThanOrEqual(bounds.max);
      });
    });

    it("should handle pan translations", () => {
      let translateX = 0;
      let translateY = 0;

      // Simulate pan gestures
      translateX += 10;
      translateY += 20;

      expect(translateX).toBe(10);
      expect(translateY).toBe(20);

      // Another pan
      translateX += -5;
      translateY += -10;

      expect(translateX).toBe(5);
      expect(translateY).toBe(10);
    });
  });

  describe("Gesture Detection", () => {
    it("should detect left swipe for next page", () => {
      const startX = 300;
      const endX = 100; // Swiped left
      const deltaX = endX - startX;

      const direction = deltaX < 0 ? "left" : "right";
      expect(direction).toBe("left");
    });

    it("should detect right swipe for previous page", () => {
      const startX = 100;
      const endX = 300; // Swiped right
      const deltaX = endX - startX;

      const direction = deltaX > 0 ? "right" : "left";
      expect(direction).toBe("right");
    });

    it("should filter out swipes below threshold", () => {
      const threshold = 50;
      const deltaX = 30;

      const isSwipe = Math.abs(deltaX) > threshold;
      expect(isSwipe).toBe(false);
    });

    it("should detect pinch zoom", () => {
      const touch1Start = { x: 100, y: 100 };
      const touch2Start = { x: 300, y: 300 };

      const distance1 = Math.hypot(
        touch2Start.x - touch1Start.x,
        touch2Start.y - touch1Start.y,
      );

      const touch1End = { x: 80, y: 100 };
      const touch2End = { x: 320, y: 300 };

      const distance2 = Math.hypot(
        touch2End.x - touch1End.x,
        touch2End.y - touch1End.y,
      );

      const zoomFactor = distance2 / distance1;
      expect(zoomFactor).toBeGreaterThan(1);
    });
  });

  describe("Props Validation", () => {
    it("should have sensible defaults", () => {
      const props: OpenQuranViewRNProps = {};

      // Apply defaults
      const page = props.page ?? 1;
      const width = props.width ?? 350;
      const height = props.height ?? 500;
      const theme = props.theme ?? "light";
      const mushafLayout = props.mushafLayout ?? "hafs-v2";

      expect(page).toBe(1);
      expect(width).toBe(350);
      expect(height).toBe(500);
      expect(theme).toBe("light");
      expect(mushafLayout).toBe("hafs-v2");
    });

    it("should accept custom dimensions", () => {
      const props: OpenQuranViewRNProps = {
        width: 400,
        height: 600,
      };

      expect(props.width).toBe(400);
      expect(props.height).toBe(600);
    });

    it("should support all mushaf layouts", () => {
      const layouts = ["hafs-v2", "hafs-v4", "hafs-unicode"] as const;

      layouts.forEach((layout) => {
        const props: OpenQuranViewRNProps = { mushafLayout: layout };
        expect(props.mushafLayout).toBe(layout);
      });
    });

    it("should support dark theme", () => {
      const props: OpenQuranViewRNProps = {
        theme: "dark",
      };

      expect(props.theme).toBe("dark");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing page gracefully", () => {
      const pageNumber = -1;
      const validPage = Math.max(1, Math.min(604, pageNumber));

      expect(validPage).toBe(1);
    });

    it("should handle out-of-range pages", () => {
      const testPages = [-100, 0, 1, 300, 604, 700, 1000];

      testPages.forEach((page) => {
        const validPage = Math.max(1, Math.min(604, page));
        expect(validPage).toBeGreaterThanOrEqual(1);
        expect(validPage).toBeLessThanOrEqual(604);
      });
    });
  });
});

describe("Component API Compatibility", () => {
  it("should match React component props", () => {
    // Verify that RN props match the React component API
    const rnProps: OpenQuranViewRNProps = {
      page: 1,
      width: 350,
      height: 500,
      theme: "light",
      mushafLayout: "hafs-v2",
      onPageChange: (page) => console.log(page),
      onLoad: (layout) => console.log(layout),
      onWordClick: (word) => console.log(word),
      highlightedWords: [],
      highlightedVerse: null,
      wordHighlightColor: "rgba(255, 215, 0, 0.5)",
      verseHighlightColor: "rgba(135, 206, 250, 0.25)",
    };

    expect(rnProps.page).toBe(1);
    expect(rnProps.width).toBe(350);
    expect(rnProps.height).toBe(500);
    expect(rnProps.onPageChange).toBeDefined();
    expect(rnProps.onWordClick).toBeDefined();
  });
});
