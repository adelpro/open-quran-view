/**
 * use-fonts.ts
 *
 * Hook that triggers QCF per-page font loading and Bismillah font loading
 * via the static require() thunk map. Mirrors use-page-data.ts:
 *  - Cancels stale requests via cancelRef
 *  - Returns { ready, error }
 *
 * For hafs-unicode the per-page QCF fonts are NOT used (it relies on the
 * auto-linked DigitalKhatt / AyatQuran fonts), so the hook returns ready=true
 * immediately after the surah-name font call resolves.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  loadBismillahFont,
  loadFont,
  loadSurahNameFont,
} from "../../../core/font-loader.rn";
import type { MushafLayout } from "../../../core/types";

type State = {
  ready: boolean;
  error: Error | null;
};

export function useFonts(
  mushafLayout: MushafLayout,
  page: number,
  bismillahWordsEnabled: boolean = true,
): State {
  const [state, setState] = useState<State>({ ready: false, error: null });
  const cancelRef = useRef(0);

  const load = useCallback(async () => {
    const token = ++cancelRef.current;
    setState({ ready: false, error: null });

    try {
      // 1. Per-page QCF font (no-op for hafs-unicode which uses auto-linked fonts)
      await loadFont(mushafLayout, page);

      // 2. Bismillah (page 1) font for V2/V4 — used when the line is a bismillah line
      if (bismillahWordsEnabled && mushafLayout !== "hafs-unicode") {
        await loadBismillahFont(mushafLayout);
      }

      // 3. Surah name font (header line renderer depends on it)
      await loadSurahNameFont();

      if (token !== cancelRef.current) return;
      setState({ ready: true, error: null });
    } catch (err) {
      if (token !== cancelRef.current) return;
      setState({ ready: false, error: err as Error });
    }
  }, [mushafLayout, page, bismillahWordsEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  return state;
}
