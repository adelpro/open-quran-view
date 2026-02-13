import type { Line, LineType, Page, Word, CharType } from "./types";

export type LineLayout = {
  lineNumber: number;
  y: number;
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
  const paddingBottom = pageHeight * 0.05;
  const paddingLeft = pageWidth * 0.08;
  const paddingRight = pageWidth * 0.08;

  const metrics: PageMetrics = {
    lineHeight,
    baselineOffset: lineHeight / 2,
    pagePadding: {
      top: Math.round(paddingTop),
      bottom: Math.round(paddingBottom),
      left: Math.round(paddingLeft),
      right: Math.round(paddingRight),
    },
  };

  function calculateLineLayout(
    line: Line,
    startY: number,
    lineIndex: number,
    verticalOffset: number = 0,
  ): LineLayout {
    const words: WordLayout[] = [];
    const y = startY + lineIndex * metrics.lineHeight + verticalOffset;
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
      words,
      isCentered,
      lineType: line.lineType || "text",
      surahNumber:
        line.lineType === "header" ? line.metadata?.chapterId : undefined,
    };
  }

  function calculatePageLayout(page: Page): PageLayout {
    const lines: LineLayout[] = [];

    let verticalOffset = 0;
    if (page.isVerticallyCentered && page.lines.length > 0) {
      const contentHeight = page.lines.length * metrics.lineHeight;
      const availableHeight =
        pageHeight - metrics.pagePadding.top - metrics.pagePadding.bottom;
      if (availableHeight > contentHeight) {
        verticalOffset = (availableHeight - contentHeight) / 2;
      }
    }

    const startY = metrics.pagePadding.top + metrics.lineHeight / 2;

    for (let i = 0; i < page.lines.length; i++) {
      const line = page.lines[i];
      const lineIndex = line.lineNumber - 1;
      const lineLayout = calculateLineLayout(
        line,
        startY,
        lineIndex,
        verticalOffset,
      );
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
