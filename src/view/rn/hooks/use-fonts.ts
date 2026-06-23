import { useEffect, useState } from "react";
import {
  loadAyatMarkerFont,
  loadBismillahFont,
  loadFont,
  loadSurahNameFont,
} from "../../../core/font-loader.rn";
import type { MushafLayout } from "../../../core/types";

export type FontsState = {
  ready: boolean;
  error: Error | null;
};

/**
 * Loads every font needed to render a given (layout, page) combination:
 *   - loadFont(layout, page)        → per-page QCF or DigitalKhatt
 *   - loadBismillahFont(layout)     → page 1's font for hafs-{v2,v4}
 *   - loadSurahNameFont()           → surah-name display font
 *   - loadAyatMarkerFont()          → for hafs-unicode only (no-op for v2/v4)
 *
 * Cancels in-flight loads if (layout, page) changes before they resolve.
 * Module-level dedup inside font-loader.rn means re-navigating to the same
 * page does not re-fetch.
 */
export function useFonts(layout: MushafLayout, page: number): FontsState {
  const [state, setState] = useState<FontsState>({
    ready: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ ready: false, error: null });

    (async () => {
      try {
        await loadFont(layout, page);
        await loadBismillahFont(layout);
        await loadSurahNameFont();
        if (layout === "hafs-unicode") {
          await loadAyatMarkerFont();
        }
        if (!cancelled) {
          setState({ ready: true, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            ready: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [layout, page]);

  return state;
}