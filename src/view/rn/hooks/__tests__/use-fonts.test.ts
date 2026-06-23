import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// Track every loader call. Module-level dedup in font-loader.rn is
// what we want to verify — a real `loadFont` for the same (layout, page)
// is invoked exactly once across multiple renderHook calls.
const loadFont = vi.fn();
const loadBismillahFont = vi.fn();
const loadSurahNameFont = vi.fn();
const loadAyatMarkerFont = vi.fn();

loadFont.mockResolvedValue(undefined);
loadBismillahFont.mockResolvedValue(undefined);
loadSurahNameFont.mockResolvedValue(undefined);
loadAyatMarkerFont.mockResolvedValue(undefined);

vi.mock("../../../../core/font-loader.rn", () => ({
  loadFont: (layout: string, page: number) => loadFont(layout, page),
  loadBismillahFont: (layout: string) => loadBismillahFont(layout),
  loadSurahNameFont: () => loadSurahNameFont(),
  loadAyatMarkerFont: () => loadAyatMarkerFont(),
  surahNumberToFontCode: (n: number) => `surah${String(n).padStart(3, "0")}`,
  __resetFontCacheForTests: vi.fn(),
}));

import { useFonts } from "../use-fonts";
import { __resetFontCacheForTests } from "../../../../core/font-loader.rn";

describe("useFonts", () => {
  beforeEach(() => {
    loadFont.mockClear();
    loadBismillahFont.mockClear();
    loadSurahNameFont.mockClear();
    loadAyatMarkerFont.mockClear();
    __resetFontCacheForTests();
  });

  it("starts in not-ready state", () => {
    const { result } = renderHook(() => useFonts("hafs-v2", 1));
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads the page, bismillah, and surah-name fonts for hafs-v2", async () => {
    const { result } = renderHook(() => useFonts("hafs-v2", 1));

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(loadFont).toHaveBeenCalledWith("hafs-v2", 1);
    expect(loadBismillahFont).toHaveBeenCalledWith("hafs-v2");
    expect(loadSurahNameFont).toHaveBeenCalledTimes(1);
    // hafs-v2 does NOT need loadAyatMarkerFont — the ayah-end glyphs
    // are part of the per-page QCF font.
    expect(loadAyatMarkerFont).not.toHaveBeenCalled();
  });

  it("also loads the AyatMarker for hafs-unicode", async () => {
    const { result } = renderHook(() => useFonts("hafs-unicode", 50));

    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(loadFont).toHaveBeenCalledWith("hafs-unicode", 50);
    expect(loadBismillahFont).toHaveBeenCalledWith("hafs-unicode");
    expect(loadSurahNameFont).toHaveBeenCalledTimes(1);
    expect(loadAyatMarkerFont).toHaveBeenCalledTimes(1);
  });

  it("re-loads when (layout, page) changes", async () => {
    const { result, rerender } = renderHook(
      ({ layout, page }: { layout: "hafs-v2" | "hafs-v4"; page: number }) =>
        useFonts(layout, page),
      { initialProps: { layout: "hafs-v2" as const, page: 1 } },
    );

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(loadFont).toHaveBeenCalledTimes(1);

    rerender({ layout: "hafs-v2", page: 50 });
    await waitFor(() => expect(loadFont).toHaveBeenCalledTimes(2));
    expect(loadFont).toHaveBeenLastCalledWith("hafs-v2", 50);
  });

  it("surfaces errors from any loader", async () => {
    loadFont.mockRejectedValueOnce(new Error("font missing"));

    const { result } = renderHook(() => useFonts("hafs-v2", 1));
    await waitFor(() => expect(result.current.ready).toBe(false));
    expect(result.current.error?.message).toBe("font missing");
  });

  it("does not commit state if cancelled before load resolves", async () => {
    let resolveFirst: (() => void) | null = null;
    loadFont.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const { result, rerender } = renderHook(
      ({ layout, page }: { layout: "hafs-v2" | "hafs-v4"; page: number }) =>
        useFonts(layout, page),
      { initialProps: { layout: "hafs-v2" as const, page: 1 } },
    );

    // Trigger a re-render with a new page BEFORE the first load resolves.
    rerender({ layout: "hafs-v2", page: 50 });
    // Restore the default mock so the second load resolves immediately.
    loadFont.mockResolvedValue(undefined);
    await waitFor(() => expect(result.current.ready).toBe(true));

    // Now resolve the FIRST (cancelled) load — should be ignored.
    await act(async () => {
      resolveFirst!();
      await Promise.resolve();
    });
    // State should still reflect the SECOND (committed) load: ready=true.
    expect(result.current.ready).toBe(true);
  });
});