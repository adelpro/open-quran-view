import { staticData } from "./static/data.rn";
import type { MushafLayout, Page } from "./types";

type DataEntry = { _all?: () => unknown };

/**
 * Loads the full pages.json for a given mushaf layout. The JSON is bundled
 * into the consumer's app by Metro (via the `() => require(...)` thunk
 * emitted by the Phase 3 generator). Pages are then indexed in memory.
 *
 * Web equivalent: `loadPages(layout)` in src/core/data-loader.ts.
 */
export async function getPagesJson(layout: MushafLayout): Promise<Page[]> {
  const entry = (staticData as Record<string, DataEntry | undefined>)[layout];
  if (!entry || typeof entry._all !== "function") {
    throw new Error(`No page data for layout: ${layout}`);
  }
  return entry._all() as Page[];
}

/**
 * Loads a single page (1-indexed) by indexing into the cached pages array.
 * Returns null if the page number is out of range.
 */
export async function getPageFromJson(
  layout: MushafLayout,
  pageNumber: number,
): Promise<Page | null> {
  const pages = await getPagesJson(layout);
  const idx = pageNumber - 1;
  if (idx < 0 || idx >= pages.length) return null;
  return pages[idx];
}