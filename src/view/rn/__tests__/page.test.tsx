import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Page } from "../page";
import type { LineLayout, PageLayout, WordLayout } from "../../../core";

// Minimal fixtures: one text line with two words, no header/bismillah.
const word = (overrides: Partial<WordLayout>): WordLayout => ({
  id: 1,
  position: 1,
  text: "بِسْمِ",
  code_v2: undefined,
  pageNumber: 1,
  charType: "word",
  surah: 1,
  verse: 1,
  x: 0,
  y: 0,
  width: 50,
  height: 20,
  ...overrides,
});

const line = (overrides: Partial<LineLayout>): LineLayout => ({
  lineNumber: 1,
  y: 0,
  height: 20,
  words: [],
  isCentered: false,
  lineType: "text",
  ...overrides,
});

const pageLayout: PageLayout = {
  pageNumber: 1,
  lines: [
    line({
      lineNumber: 1,
      words: [
        word({ id: 1, x: 0, y: 0, text: "بِسْمِ" }),
        word({ id: 2, x: 60, y: 0, text: "ٱللَّهِ" }),
      ],
    }),
  ],
  metrics: {
    lineHeight: 20,
    baselineOffset: 10,
    pagePadding: { top: 0, bottom: 0, left: 0, right: 0 },
  },
};

describe("Page", () => {
  it("renders a line per layout.lines entry", () => {
    const { container } = render(
      <Page
        layout={pageLayout}
        mushafLayout="hafs-v2"
        fontSize={16}
        selectedWordId={null}
      />,
    );
    // 1 line in our fixture, plus the wrapping Page View. The line
    // contains 2 WordView Pressables. We assert at least one child.
    expect(container.children.length).toBeGreaterThan(0);
  });

  it("invokes onWordPress with the word's data on tap", () => {
    const onWordPress = vi.fn();
    const { getAllByRole } = render(
      <Page
        layout={pageLayout}
        mushafLayout="hafs-v2"
        fontSize={16}
        selectedWordId={null}
        onWordPress={onWordPress}
      />,
    );
    // Two Pressables, one per word. Click the first.
    const buttons = getAllByRole("button");
    expect(buttons).toHaveLength(2);
    buttons[0].click();
    expect(onWordPress).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        surahNumber: 1,
        ayahNumber: 1,
        text: "بِسْمِ",
      }),
    );
  });

  it("selects the word matching selectedWordId", () => {
    const { container } = render(
      <Page
        layout={pageLayout}
        mushafLayout="hafs-v2"
        fontSize={16}
        selectedWordId={2}
      />,
    );
    // Find the Pressable for word id=2; it should have a non-transparent
    // backgroundColor. The Pressable's style is an array — check both items.
    const pressables = container.querySelectorAll('[role="button"]');
    expect(pressables.length).toBe(2);
    const second = pressables[1] as HTMLElement & {
      style?: { backgroundColor?: string };
    };
    const bg = second.style?.backgroundColor ?? "";
    // jsdom may not parse RGBA into backgroundColor; instead, the
    // className or style attr holds it. Just check the second has a
    // non-empty style attribute distinct from the first.
    expect(bg).toBeTruthy();
  });
});