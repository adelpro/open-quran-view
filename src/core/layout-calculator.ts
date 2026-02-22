import type { Line, LineType, Page, Word, CharType } from "./types";

export type LineLayout = {
  lineNumber: number;
  y: number;
  height: number;
  words: WordLayout[];
  isCentered: boolean;
  lineType: LineType;
  surahNumber?: number;
};

export type WordLayout = Word & {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const paddingBottom = Math.max(pageHeight * 0.05, 80);
  const paddingLeft = pageWidth * 0.08;
  const paddingRight = pageWidth * 0.08;

  const metrics: PageMetrics = {
    lineHeight,
    baselineOffset: Math.round(lineHeight / 2),
    pagePadding: {
      top: Math.round(paddingTop),
      bottom: Math.round(paddingBottom),
      left: Math.round(paddingLeft),
      right: Math.round(paddingRight),
    },
  };

  function calculateLineLayout(
    line: Line,
    y: number,
    lineHeightForLine: number,
  ): LineLayout {
    const words: WordLayout[] = [];
    let currentX = metrics.pagePadding.left;

    for (const word of line.words) {
      const textWidth = word.text.length * (fontSize * 0.5);
      const wordLayout: WordLayout = {
        ...word,
        x: currentX,
        y,
        width: textWidth,
        height: fontSize,
      };
      words.push(wordLayout);
      currentX += textWidth + 8;
    }

    const isCentered = line.isCentered ?? false;

    return {
      lineNumber: line.lineNumber,
      y,
      height: lineHeightForLine,
      words,
      isCentered,
      lineType: line.lineType || "text",
      surahNumber:
        line.lineType === "header" ? line.metadata?.chapterId : undefined,
    };
  }

  function calculatePageLayout(page: Page): PageLayout {
    const lines: LineLayout[] = [];
    
    // Calculate total content height first to determine vertical offset
    let contentHeight = 0;
    const lineHeights: number[] = [];
    
    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      let height = metrics.lineHeight;
      
      if (line.lineType === "header") {
        height = metrics.lineHeight * 1.8;
      }
      
      lineHeights.push(height);
      contentHeight += height;
    }

    // Calculate available vertical space for content
    const availableHeight =
      pageHeight - metrics.pagePadding.top - metrics.pagePadding.bottom;
      
    // If content exceeds available height, scale it down to fit
    let scale = 1;
    if (contentHeight > availableHeight) {
      scale = availableHeight / contentHeight;
    }

    let verticalOffset = 0;
    if (page.isVerticallyCentered && page.lines.length > 0) {
      // Use the scaled content height for centering calculation
      const effectiveContentHeight = contentHeight * scale;
      if (availableHeight > effectiveContentHeight) {
        verticalOffset = (availableHeight - effectiveContentHeight) / 2;
      }
    }

    let currentTop = metrics.pagePadding.top + verticalOffset;

    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      const height = lineHeights[i] * scale;
      
      const centerY = currentTop + height / 2;
      
      const lineLayout = calculateLineLayout(
        line,
        centerY,
        height,
      );
      lines.push(lineLayout);
      
      currentTop += height;
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
