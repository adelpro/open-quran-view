import React from "react";
import type { Word } from "../../core";
import type { GlyphPath } from "./types";

export type SkiaWordProps = {
  /** Word data from layout */
  word: Word;

  /** Glyph path data for this word's character */
  glyphPath?: GlyphPath;

  /** X position on canvas */
  x: number;

  /** Y position on canvas */
  y: number;

  /** Font size in pixels */
  fontSize: number;

  /** Fill color (hex or rgba) */
  fillColor: string;

  /** Whether this word is highlighted */
  isHighlighted?: boolean;

  /** Highlight color */
  highlightColor?: string;

  /** Click handler */
  onClick?: () => void;
};

/**
 * Skia Word/Glyph Renderer Component
 *
 * This component renders a single word/glyph using:
 * - SVG path data extracted from the QCF font
 * - Skia Canvas for React Native
 * - Canvas API for web fallback
 *
 * The glyph is positioned and scaled according to the layout calculator,
 * and can be highlighted or made interactive.
 *
 * In a real React Native implementation, this would use @shopify/react-native-skia:
 * ```tsx
 * import { Skia } from '@shopify/react-native-skia';
 *
 * const skiaPath = Skia.Path.MakeFromSVGString(glyphPath?.path);
 * // Render with <Skia.Path path={skiaPath} paint={paint} />
 * ```
 */
export const SkiaWord: React.FC<SkiaWordProps> = ({
  word,
  glyphPath,
  x,
  y,
  fontSize,
  fillColor,
  isHighlighted = false,
  highlightColor = "rgba(255, 215, 0, 0.5)",
  onClick,
}) => {
  /**
   * For web Canvas implementation:
   * Render to an offscreen canvas, then draw to main canvas
   */
  const renderToCanvas = (ctx: CanvasRenderingContext2D) => {
    if (!glyphPath) {
      // Fallback: draw text
      ctx.fillStyle = fillColor;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(word.text, x, y);
      return;
    }

    try {
      // Create path from SVG data
      const path = new Path2D(glyphPath.path);

      // Apply transformations
      const scale = fontSize / (glyphPath.advanceWidth || 1000);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Draw highlight if needed
      if (isHighlighted) {
        ctx.fillStyle = highlightColor;
        ctx.fillRect(
          0,
          -fontSize * 0.2,
          glyphPath.advanceWidth,
          fontSize * 1.2,
        );
      }

      // Draw glyph
      ctx.fillStyle = fillColor;
      ctx.fill(path);

      ctx.restore();
    } catch (error) {
      console.warn(`Failed to render glyph for word "${word.text}":`, error);

      // Fallback to text rendering
      ctx.fillStyle = fillColor;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(word.text, x, y);
    }
  };

  /**
   * Render using a canvas element (for web)
   */
  return (
    <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <foreignObject x={x} y={y} width={fontSize * 1.5} height={fontSize * 1.5}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) renderToCanvas(ctx);
              }
            }}
            width={Math.ceil(fontSize * 1.5)}
            height={Math.ceil(fontSize * 1.5)}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </foreignObject>
    </g>
  );
};

/**
 * Utility function to convert SVG path to Path2D
 * @param svgPath SVG path d attribute
 * @returns Path2D object, or null if conversion fails
 */
export function parseSVGPath(svgPath: string): Path2D | null {
  try {
    return new Path2D(svgPath);
  } catch (error) {
    console.warn("Failed to parse SVG path:", error);
    return null;
  }
}

/**
 * Utility function to render a word to a canvas
 */
export function renderWordToCanvas(
  canvas: HTMLCanvasElement,
  word: Word,
  glyphPath: GlyphPath | undefined,
  fontSize: number,
  fillColor: string,
  isHighlighted: boolean = false,
  highlightColor: string = "rgba(255, 215, 0, 0.5)",
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = Math.ceil(fontSize * 1.5);
  const height = Math.ceil(fontSize * 1.5);

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  if (!glyphPath) {
    // Fallback: render text
    ctx.fillStyle = fillColor;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(word.text, 5, fontSize);
    return;
  }

  try {
    const path = new Path2D(glyphPath.path);
    const scale = fontSize / (glyphPath.advanceWidth || 1000);

    ctx.save();

    // Draw highlight
    if (isHighlighted) {
      ctx.fillStyle = highlightColor;
      ctx.fillRect(0, height * 0.1, width, height * 0.8);
    }

    // Draw glyph
    ctx.fillStyle = fillColor;
    ctx.scale(scale, scale);
    ctx.fill(path);

    ctx.restore();
  } catch (error) {
    console.warn("Failed to render glyph:", error);
    // Fallback
    ctx.fillStyle = fillColor;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(word.text, 5, fontSize);
  }
}

/**
 * Convert glyph advance width to rendered width
 */
export function getGlyphWidth(advanceWidth: number, fontSize: number): number {
  return (advanceWidth / 1000) * fontSize;
}

export default SkiaWord;
