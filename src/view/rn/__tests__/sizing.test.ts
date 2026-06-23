import { describe, it, expect } from "vitest";
import { computeSizing, MUSHAF_RATIO } from "../sizing";

const baseInputs = {
  ratio: true as const,
  fit: "width" as const,
  observedWidth: 0,
  observedHeight: 0,
  windowWidth: 360,
  windowHeight: 640,
};

describe("computeSizing", () => {
  it("uses the MUSHAF_RATIO default when ratio is true", () => {
    const { containerWidth, containerHeight } = computeSizing(baseInputs);
    // 360 / 0.7 = ~514 — but we cap at windowWidth on the height-fit path.
    // The math is: targetH = 360 / 0.7 = 514; containerWidth = min(360, 514 * 0.7) = min(360, 360) = 360
    // containerHeight = 360 / 0.7 ≈ 514
    expect(containerWidth).toBe(360);
    expect(containerHeight).toBeCloseTo(360 / MUSHAF_RATIO, 5);
  });

  it("uses a custom ratio when ratio is a number", () => {
    const { containerWidth, containerHeight } = computeSizing({
      ...baseInputs,
      ratio: 0.5,
    });
    expect(containerWidth).toBe(360);
    expect(containerHeight).toBeCloseTo(360 / 0.5, 5);
  });

  it("prefers explicit width prop", () => {
    const { containerWidth, containerHeight } = computeSizing({
      ...baseInputs,
      widthProp: 500,
    });
    expect(containerWidth).toBe(500);
    expect(containerHeight).toBeCloseTo(500 / MUSHAF_RATIO, 5);
  });

  it("prefers explicit height prop when given", () => {
    const { containerWidth, containerHeight } = computeSizing({
      ...baseInputs,
      heightProp: 800,
    });
    expect(containerHeight).toBe(800);
    expect(containerWidth).toBeCloseTo(800 * MUSHAF_RATIO, 5);
  });

  it("prefers observed size over window size when both exist", () => {
    const { containerWidth } = computeSizing({
      ...baseInputs,
      observedWidth: 480,
      windowWidth: 360,
    });
    expect(containerWidth).toBe(480);
  });

  it("uses fit=height to size from the height axis", () => {
    const { containerWidth, containerHeight } = computeSizing({
      ...baseInputs,
      fit: "height",
      observedHeight: 800,
    });
    expect(containerHeight).toBe(800);
    expect(containerWidth).toBeCloseTo(800 * MUSHAF_RATIO, 5);
  });

  it("MUSHAF_RATIO is the documented 0.7", () => {
    expect(MUSHAF_RATIO).toBe(0.7);
  });
});