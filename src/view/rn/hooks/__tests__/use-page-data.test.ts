import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Page } from "../../../../core/types";

const fakePage = (n: number): Page => ({
  pageNumber: n,
  lines: [],
  isVerticallyCentered: true,
});

// Default: every getPageFromJson call resolves with fakePage(page).
// Per-test override via mockResolvedValueOnce / mockImplementationOnce.
const loadPageMock = vi.fn<(layout: string, page: number) => Promise<Page>>(
  (layout, page) => Promise.resolve(fakePage(page)),
);

vi.mock("../../../../core/data-loader.rn", () => ({
  getPageFromJson: (layout: string, page: number) => loadPageMock(layout, page),
}));

import { usePageData } from "../use-page-data";

describe("usePageData", () => {
  beforeEach(() => {
    loadPageMock.mockClear();
    loadPageMock.mockImplementation((layout, page) =>
      Promise.resolve(fakePage(page)),
    );
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => usePageData("hafs-v2", 1));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("commits data on successful load", async () => {
    const { result } = renderHook(() => usePageData("hafs-v2", 1));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(fakePage(1));
    expect(result.current.error).toBeNull();
  });

  it("re-loads when page changes", async () => {
    const { result, rerender } = renderHook(
      ({ layout, page }: { layout: "hafs-v2" | "hafs-v4"; page: number }) =>
        usePageData(layout, page),
      { initialProps: { layout: "hafs-v2" as const, page: 1 } },
    );

    await waitFor(() => expect(result.current.data?.pageNumber).toBe(1));
    expect(loadPageMock).toHaveBeenCalledTimes(1);

    rerender({ layout: "hafs-v2", page: 50 });
    await waitFor(() => expect(result.current.data?.pageNumber).toBe(50));
    expect(loadPageMock).toHaveBeenCalledTimes(2);
  });

  it("cancels the in-flight load when page changes before it resolves", async () => {
    // Set up the first call to never resolve; the second call resolves
    // immediately. We then resolve the first; the hook must have already
    // moved on to the second's result.
    let resolveFirst: ((p: Page) => void) | null = null;
    loadPageMock.mockImplementationOnce(
      () =>
        new Promise<Page>((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const { result, rerender } = renderHook(
      ({ layout, page }: { layout: "hafs-v2" | "hafs-v4"; page: number }) =>
        usePageData(layout, page),
      { initialProps: { layout: "hafs-v2" as const, page: 1 } },
    );

    // Switch page while the first call is still pending.
    rerender({ layout: "hafs-v2", page: 50 });

    // Wait for the second (default-resolving) call to commit.
    await waitFor(() => expect(result.current.data?.pageNumber).toBe(50));

    // Now resolve the first (cancelled) call. The hook must NOT
    // roll the state back to page 1.
    await act(async () => {
      resolveFirst!(fakePage(1));
      // Allow the .then() microtask to run; cancelRef must drop it.
      await Promise.resolve();
    });
    expect(result.current.data?.pageNumber).toBe(50);
  });

  it("commits errors from the loader", async () => {
    loadPageMock.mockImplementationOnce(() =>
      Promise.reject(new Error("page not found")),
    );

    const { result } = renderHook(() => usePageData("hafs-v2", 999));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe("page not found");
  });
});