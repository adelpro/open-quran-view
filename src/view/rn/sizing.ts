// Pure sizing math for OpenQuranViewRN. Extracted so it can be unit
// tested without rendering the full component (which requires RN's
// useWindowDimensions + onLayout to fire).

export const MUSHAF_RATIO = 0.7;

export type SizingInputs = {
  /** Explicit width prop (overrides everything). */
  widthProp?: number;
  /** Explicit height prop (overrides everything). */
  heightProp?: number;
  /** `true` to use the MUSHAF_RATIO default; a number to use a custom ratio. */
  ratio: boolean | number;
  /** Which axis to fit against when no explicit dimensions are given. */
  fit: "width" | "height";
  /** Measured width of the host container (from onLayout). */
  observedWidth: number;
  /** Measured height of the host container (from onLayout). */
  observedHeight: number;
  /** Device width from useWindowDimensions, used as a fallback. */
  windowWidth: number;
  /** Device height from useWindowDimensions, used as a fallback. */
  windowHeight: number;
};

export type SizingResult = {
  containerWidth: number;
  containerHeight: number;
};

/**
 * Computes the final container width/height. Logic mirrors the
 * derivation in src/view/react/index.tsx:151-220 (the React view's
 * sizing useEffect).
 *
 * Precedence:
 *   1. If `widthProp` is set, derive `height` from it.
 *   2. Else if `heightProp` is set, derive `width` from it.
 *   3. Else use the `fit` axis against the observed (or window)
 *      size, capped so the other axis never overflows the viewport.
 */
export function computeSizing(input: SizingInputs): SizingResult {
  const actualRatio = typeof input.ratio === "number" ? input.ratio : MUSHAF_RATIO;
  const baseW = input.observedWidth || input.windowWidth;
  const baseH = input.observedHeight || input.windowHeight;

  // Case 1: explicit width wins.
  if (input.widthProp !== undefined) {
    return {
      containerWidth: input.widthProp,
      containerHeight: input.heightProp ?? input.widthProp / actualRatio,
    };
  }

  // Case 2: explicit height derives width.
  if (input.heightProp !== undefined) {
    return {
      containerWidth: input.heightProp * actualRatio,
      containerHeight: input.heightProp,
    };
  }

  // Case 3: no explicit dims — fit against the requested axis.
  //   - fit=width: pick width=baseW, derive height from ratio.
  //   - fit=height: pick height=baseH, derive width from ratio.
  // If the OTHER axis would overflow an observed measurement (only
  // when one is non-zero), cap at it — same as the React view.
  if (input.fit === "height") {
    const targetWidth = baseH * actualRatio;
    if (input.observedWidth > 0 && targetWidth > input.observedWidth) {
      return {
        containerWidth: input.observedWidth,
        containerHeight: input.observedWidth / actualRatio,
      };
    }
    return { containerWidth: targetWidth, containerHeight: baseH };
  }

  // fit=width
  const targetHeight = baseW / actualRatio;
  if (input.observedHeight > 0 && targetHeight > input.observedHeight) {
    return {
      containerWidth: input.observedHeight * actualRatio,
      containerHeight: input.observedHeight,
    };
  }
  return { containerWidth: baseW, containerHeight: targetHeight };
}