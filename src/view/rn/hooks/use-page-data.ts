import { useCallback, useEffect, useRef, useState } from "react";
import { getPageFromJson } from "../../../core/data-loader.rn";
import type { MushafLayout, Page } from "../../../core/types";

export type PageDataState = {
  data: Page | null;
  loading: boolean;
  error: Error | null;
};

/**
 * Loads a single page (1-indexed) from the bundled pages.json for the given
 * mushaf layout. Cancellable: if the layout or page changes before the
 * in-flight load resolves, the result is discarded.
 *
 * Web equivalent: the loadPage(layout, pageNumber) call in
 * src/core/data-loader.ts, used inside OpenQuranView's handleLoadPage.
 */
export function usePageData(
  layout: MushafLayout,
  page: number,
): PageDataState {
  const [state, setState] = useState<PageDataState>({
    data: null,
    loading: true,
    error: null,
  });
  const cancelRef = useRef(0);

  const load = useCallback(() => {
    const token = ++cancelRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    getPageFromJson(layout, page)
      .then((data) => {
        if (token === cancelRef.current) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((err: unknown) => {
        if (token === cancelRef.current) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      });
  }, [layout, page]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}