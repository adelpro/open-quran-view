/**
 * use-page-data.ts
 *
 * Hook that lazily loads a single page's JSON data via the static require()
 * thunk map (data.rn.ts). Returns { data, loading, error }.
 *
 * Uses a cancellation ref so that if `pageNumber` changes while a load is
 * in-flight, the stale result is discarded.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getPageDataThunk } from "../../core/static/data.rn";
import type { Page } from "../../core/types";

type State = {
  data: Page | null;
  loading: boolean;
  error: Error | null;
};

export function usePageData(
  mushafLayout: string,
  pageNumber: number,
): State {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });

  // Cancellation guard — increments on every new request
  const cancelRef = useRef(0);

  const load = useCallback(async () => {
    const token = ++cancelRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const thunk = getPageDataThunk(mushafLayout, pageNumber);
      // require() thunks are synchronous in Metro — cast for clarity
      const raw = thunk() as Page;
      if (token !== cancelRef.current) return; // stale
      setState({ data: raw, loading: false, error: null });
    } catch (err) {
      if (token !== cancelRef.current) return;
      setState({ data: null, loading: false, error: err as Error });
    }
  }, [mushafLayout, pageNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
