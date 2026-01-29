import type { Page, Word, Line } from "./types";

export type LineLayout = {
  lineNumber: number;
  y: number;
  words: WordLayout[];
  isCentered: boolean;
  lineType: "text" | "header" | "bismillah";
  surahNumber?: number;
};

export type WordLayout = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  surahNumber?: number;
  ayahNumber?: number;
};

export type PageMetrics = {
  lineHeight: number;
  baselineOffset: number;
  pagePadding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
};

export type PageLayout = {
  pageNumber: number;
  lines: LineLayout[];
  metrics: PageMetrics;
};

export type LayoutCalculatorOptions = {
  pageWidth: number;
  pageHeight: number;
  fontSize?: number;
  lineHeight?: number;
};

export function createLayoutCalculator(options: LayoutCalculatorOptions): {
  calculatePageLayout: (page: Page) => PageLayout;
  getMetrics: () => PageMetrics;
} {
  const pageWidth = options.pageWidth;
  const pageHeight = options.pageHeight;
  const fontSize = options.fontSize || 24;
  const lineHeight = options.lineHeight || fontSize * 1.5;

  const paddingTop = pageHeight * 0.05;
  const paddingBottom = pageHeight * 0.05;
  const paddingLeft = pageWidth * 0.08;
  const paddingRight = pageWidth * 0.08;

  const metrics: PageMetrics = {
    lineHeight,
    baselineOffset: lineHeight * 0.2,
    pagePadding: {
      top: Math.round(paddingTop),
      bottom: Math.round(paddingBottom),
      left: Math.round(paddingLeft),
      right: Math.round(paddingRight),
    },
  };

  /**
   * Helper to estimate text width for centering purposes (simple heuristic).
   * For accurate rendering, this would need to come from the font measurement.
   */
  function estimateLineWidth(words: WordLayout[]): number {
      // Calculate occupied width based on words
      // This is approximate because actual text rendering uses font metrics.
      // However, we set 'x' positions here.
      // If the line is empty (Header/Bismillah placeholders), we might assume full width or specific width?
      // Actually, for Header/Bismillah, 'words' is empty in our current fetch logic.
      // So width is 0. 
      // The renderer interprets lineType and draws centered regardless of 'words'.
      if (words.length === 0) return 0;
      const lastWord = words[words.length - 1];
      const firstWord = words[0];
      return (lastWord.x + lastWord.width) - firstWord.x;
  }

  function calculateLineLayout(
    line: Line,
    startY: number,
    lineIndex: number,
    verticalOffset: number = 0
  ): LineLayout {
    const words: WordLayout[] = [];
    const y = startY + lineIndex * metrics.lineHeight + verticalOffset;
    let currentX = metrics.pagePadding.left;

    for (const word of line.words) {
      const textWidth = word.text.length * (fontSize * 0.5); // Simple estimation
      const wordLayout: WordLayout = {
        id: word.id,
        x: currentX,
        y,
        width: textWidth,
        height: fontSize,
        text: word.text,
        surahNumber: word.surah,
        ayahNumber: word.verse,
      };
      words.push(wordLayout);
      currentX += textWidth + 8; // spacing
    }

    // Determine strict centering
    // Use the explicit flag if available, otherwise fallback (though we should have it now).
    // The previous heuristic `shouldCenterLine` is removed in favor of explicit `isCentered`.
    const isCentered = line.isCentered ?? false;

    return {
      lineNumber: line.lineNumber,
      y,
      words,
      isCentered,
      lineType: line.lineType || "text",
      surahNumber: line.lineType === "header" ? line.metadata?.chapterId : undefined,
    };
  }

  function calculatePageLayout(page: Page): PageLayout {
    const lines: LineLayout[] = [];
    
    // Calculate vertical offset if the page is vertically centered
    let verticalOffset = 0;
    if (page.isVerticallyCentered && page.lines.length > 0) {
        const contentHeight = page.lines.length * metrics.lineHeight;
        const availableHeight = pageHeight - metrics.pagePadding.top - metrics.pagePadding.bottom;
        if (availableHeight > contentHeight) {
            verticalOffset = (availableHeight - contentHeight) / 2;
        }
    }

    const startY = metrics.pagePadding.top + metrics.lineHeight / 2;

    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      // We pass the lineIndex relative to the raw lines array
      // But we must respect the actual lineNumber for positioning?
      // Usually strict 15-line layout means line 1 is at y=1*h, line 2 at y=2*h.
      // If our gaps are filled, page.lines should have contiguous lineNumbers.
      // Let's rely on the array index for 'y' calculation to ensure stable grid
      // or use line.lineNumber if we trust it completely.
      // Using array index i corresponds to the slot in the list.
      // A safer bet for strict layouts: use (line.lineNumber - 1).
      
      const lineIndex = line.lineNumber - 1; 
      const lineLayout = calculateLineLayout(line, startY, lineIndex, verticalOffset);
      lines.push(lineLayout);
    }

    return {
      pageNumber: page.pageNumber,
      lines,
      metrics,
    };
  }

  return {
    calculatePageLayout,
    getMetrics: () => ({ ...metrics }),
  };
}
