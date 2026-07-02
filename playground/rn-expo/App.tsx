import { OpenQuranViewRN } from "open-quran-view/view/rn";
import { View } from "react-native";

/**
 * Playground entry for the React Native view.
 *
 * Default `mushafLayout="hafs-unicode"` — KFGQPC Uthmanic Hafs, served
 * as a single font file by the Quran Foundation API. Cold-start
 * downloads only 3 fonts (DigitalKhatt + AyatQuran + SurahName) and the
 * bundle stays tiny in Expo Go.
 *
 * To switch to the pixel-perfect Madinah Mushaf (QCF V2) for visual QA,
 * change to `mushafLayout="hafs-v2"` (or `"hafs-v4"` for the Tajweed
 * COLRv1 variant). Those layouts use 604 per-page TTFs from the Quran
 * Foundation API; the dynamic `forPage()` loader keeps only the TTF for
 * the currently rendered page in the bundle.
 *
 * See docs/guides/mushaf-comparison.md for the full font strategy.
 */
export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <OpenQuranViewRN page={1} theme="light" mushafLayout="hafs-unicode" />
    </View>
  );
}