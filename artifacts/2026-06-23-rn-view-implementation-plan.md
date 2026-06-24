# Add `view/rn` to `open-quran-view` — step-by-step implementation plan

**Date:** 2026-06-23
**Target branch:** new branch off `develop` (suggested: `rn-view-v2`; do NOT reuse the broken `rn-view`).
**Working repo:** `D:\benyahia-dev\open-quran-view`.
**Yarn setup:** workspace root at `open-quran-view/package.json`; playgrounds under `open-quran-view/playground/{vite-react, vite-typescript, rn-expo}`. RN development and validation happens in `playground/rn-expo`.
**Reading order:** phase-by-phase. Stop after any phase and you have a working, validated state.

---

## Ground rules

- The existing `./view` (React) and `./view/web` (Web Component) exports **must not change**. The new `view/rn` is a *new export*, not a modification of existing ones.
- The new RN component is named **`OpenQuranViewRN`** (not `OpenQuranView`) because the existing React and Web views already export a name called `OpenQuranView`. A same-name export would shadow-conflict on import.
- All `.rn.ts` files parallel their non-`.rn` counterparts and are auto-generated where possible. `tsup` strips `*.rn.ts` from the web `dist/` so consumers of `./view` or `./view/web` see no change.
- The `develop` branch's React + Web views keep working at every phase. If they break, the change is wrong.

---

## Phase 0 — Baseline verification (10 min)

**Goal:** confirm the develop branch is healthy before any work.

**Steps:**

```bash
cd D:\benyahia-dev\open-quran-view
git checkout develop
git pull
yarn install
yarn build
yarn test
yarn workspace vite-react dev     # web playground, sanity-check at http://localhost:5173
yarn workspace vite-typescript dev # alternative web playground
```

**Validation:**

- `yarn build` exits 0. `dist/view/react/`, `dist/view/web/`, `dist/core/`, `dist/data/...` exist.
- `yarn test` passes.
- Vite playgrounds render page 1 of Al-Fatiha in the browser.

**Rollback:** none. Read-only phase.

---

## Phase 1 — Add the empty `view/rn` export (1 h)

**Goal:** add the new export to `package.json`, add a placeholder `OpenQuranViewRN` component, and verify the existing build is unaffected.

**Step 1.1 — create a new branch.**

```bash
git checkout -b rn-view-v2
```

**Step 1.2 — add the export to `package.json`.** Edit only the `exports` block:

```json
"exports": {
  "./view":       { "types": "./dist/view/react/index.d.ts",  "import": "./dist/view/react/index.js" },
  "./view/react": { "types": "./dist/view/react/index.d.ts",  "import": "./dist/view/react/index.js" },
  "./view/web":   { "types": "./dist/view/web/index.d.ts",    "import": "./dist/view/web/index.js" },
  "./view/rn":    { "react-native": "./src/view/rn/index.tsx",
                    "types": "./src/view/rn/index.tsx",
                    "default": "./src/view/rn/index.tsx" }
}
```

The `react-native` condition resolves to source so consumers (and the playground) get live TS, not a stale `dist/`. The `default` is the same source so non-RN resolvers (npm tooling, etc.) don't choke.

**Step 1.3 — create the empty RN component.** New file [src/view/rn/index.tsx](src/view/rn/index.tsx):

```tsx
import React from "react";
import { Text, View } from "react-native";

export type OpenQuranViewRNProps = {
  page?: number;
  mushafLayout?: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  width?: number;
  height?: number;
};

export const OpenQuranViewRN: React.FC<OpenQuranViewRNProps> = () => (
  <View><Text>open-quran-view RN: not yet implemented</Text></View>
);

export default OpenQuranViewRN;
```

**Step 1.4 — update `tsup.config.ts`** to ignore the new path and add it to the `dist`-strip step. Edit:

```ts
ignoreWatch: ["**/*.rn.ts", "**/font-loader.rn.ts", "src/view/rn/**"],
```

The existing onSuccess function already removes any `.rn.ts` or `.rn.js` from `dist/`. Add `**/view/rn/**` to that filter as well so the placeholder never accidentally lands in the web bundle:

```ts
function removeRnFiles(dir: string) {
  if (!existsSync(dir)) return;
  for (const entry of rds(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) removeRnFiles(full);
    else if (
      entry.name.endsWith(".rn.ts") ||
      entry.name.endsWith(".rn.js") ||
      entry.name.endsWith(".rn.d.ts") ||
      full.includes(`${sep}view${sep}rn${sep}`)
    ) {
      rmSync(full);
    }
  }
}
```

**Step 1.5 — verify the build.**

```bash
yarn build
yarn test
yarn workspace vite-react dev   # confirm web still works
ls dist/view/                   # should contain only `react/`, `web/`, no `rn/`
```

**Validation:**

- `dist/view/` has no `rn/` folder.
- `dist/view/react/` and `dist/view/web/` are unchanged.
- Web playground still renders.
- TypeScript doesn't error on the new file.

**Rollback:** `git checkout develop` and delete the branch.

---

## Phase 2 — RN-safe core barrel (1 h)

**Goal:** add an `index.rn.ts` that re-exports the same types and core logic as `index.ts` but uses RN-safe module paths.

**Step 2.1 — check the existing `src/core/index.ts` on develop.**

```bash
cd D:\benyahia-dev\open-quran-view
git show develop:src/core/index.ts
```

Confirm it doesn't use `import.meta.url` (which RN doesn't support). If it does, follow the rn-view branch's pattern: keep `index.ts` for web/React, add `index.rn.ts` for RN, both re-exporting the same symbols from platform-specific module files (`data-loader.ts` vs `data-loader.rn.ts`, `font-loader.ts` vs `font-loader.rn.ts`, `static/fonts.ts` vs `static/fonts.rn.ts`, `static/data.ts` vs `static/data.rn.ts`).

**Step 2.2 — create the RN platform files** (mirroring the develop core):

- [src/core/index.rn.ts](src/core/index.rn.ts) — re-export everything except the web `import.meta.url` paths.
- [src/core/font-loader.rn.ts](src/core/font-loader.rn.ts) — `Font.loadAsync` (Expo) wrapper. The `Font.loadAsync` is the consumer's responsibility (they have `expo-font` installed), so the function signature is: `loadFont(layout, page): Promise<void>` and uses `require()` of the page font. The actual `Font.loadAsync` is imported from `expo-font` at module top.
- [src/core/static/fonts.rn.ts](src/core/static/fonts.rn.ts) — placeholder. We'll fill it via generator in Phase 3.
- [src/core/static/data.rn.ts](src/core/static/data.rn.ts) — placeholder.

**Step 2.3 — verify the build** is unchanged.

```bash
yarn build
ls dist/core/
```

**Validation:** `dist/core/` is byte-identical (or near-identical) to before.

**Rollback:** `git revert` of the phase 2 commit.

---

## Phase 3 — Build-time data + font generation (2–3 h)

**Goal:** generate `static/fonts.rn.ts` and `static/data.rn.ts` from existing assets, instead of hand-writing them.

**Step 3.1 — audit existing assets.** Confirm what's already there:

```bash
ls src/data/fonts/   # should have hafs-v2/, hafs-v4/, hafs-unicode/
ls src/data/pages/   # should have hafs-v2/, hafs-v4/, hafs-unicode/
```

**Step 3.2 — extend `scripts/generate-static-fonts.ts`** to emit `static/fonts.rn.ts` in addition to the existing `static/fonts.ts`. The `.rn.ts` variant is a `Record<MushafLayout, Record<number, () => AssetReference>>` where each entry is a `() => require('...')` thunk.

The script should:

1. Read the existing layout directories (`hafs-v2`, `hafs-v4`, `hafs-unicode`).
2. For each layout, list the page .ttf files (`p1.ttf` … `p604.ttf`).
3. Emit:

   ```ts
   // AUTO-GENERATED by scripts/generate-static-fonts.ts — do not edit
   import type { MushafLayout } from "../types";
   export const staticFonts: Record<MushafLayout, Record<number, () => any>> = {
     "hafs-v2": {
       1:   () => require("../../data/fonts/hafs-v2/p1.ttf"),
       2:   () => require("../../data/fonts/hafs-v2/p2.ttf"),
       // …
       604: () => require("../../data/fonts/hafs-v2/p604.ttf"),
     },
     "hafs-v4": { /* … */ },
     "hafs-unicode": { /* … */ },
   };
   ```

4. Also keep the existing `static/fonts.ts` (web) emission unchanged.

**Step 3.3 — extend `scripts/generate-static-data.ts`** to emit `static/data.rn.ts` similarly. The shape is `Record<MushafLayout, Record<number, () => any>>` with `() => require('../../data/pages/.../p{N}.json')` thunks.

**Step 3.4 — run both generators.**

```bash
yarn generate:static
ls src/core/static/
wc -l src/core/static/fonts.rn.ts src/core/static/data.rn.ts
```

**Step 3.5 — confirm the generated files are valid.**

```bash
yarn tsc --noEmit src/core/static/fonts.rn.ts
yarn tsc --noEmit src/core/static/data.rn.ts
```

**Validation:**

- The generated `fonts.rn.ts` has all 604 page entries per non-Unicode layout, with the right page numbers.
- The generated files typecheck.
- The web build still works (the existing `static/fonts.ts` and `static/data.ts` were also regenerated; verify the web dist is unchanged).

**Rollback:** `git checkout develop -- src/core/static/`.

**If the file is 1 200+ lines:** that's expected for `fonts.rn.ts` (604 × 2 non-Unicode layouts). The hand-written 1 235-line literal in the broken rn-view branch is the same shape; we're just generating it instead.

---

## Phase 4 — Wire the hooks (2 h)

**Goal:** add the RN-side data + font loaders as React hooks.

**Step 4.1 — `src/core/font-loader.rn.ts` becomes a real implementation.** It exports:

```ts
import * as Font from "expo-font";
import { staticFonts } from "./static/fonts.rn";
import type { MushafLayout } from "./types";

// Module-level dedup guard.
const loaded = new Set<string>();

const familyFor = (layout: MushafLayout, page: number) =>
  `QuranFont-${layout}-p${page}`;

export async function loadFont(layout: MushafLayout, page: number): Promise<void> {
  const family = familyFor(layout, page);
  if (loaded.has(family)) return;
  const thunk = staticFonts[layout]?.[page];
  if (!thunk) throw new Error(`No font asset for ${layout}/p${page}`);
  await Font.loadAsync({ [family]: thunk() });
  loaded.add(family);
}

export async function loadBismillahFont(layout: MushafLayout): Promise<void> {
  // Bismillah is page 1's font for V2/V4; for hafs-unicode, auto-linked
  if (layout === "hafs-unicode") return;
  return loadFont(layout, 1);
}

export async function loadSurahNameFont(): Promise<void> {
  // Surah name font is auto-linked via the consumer's expo-font config
  return;
}

export async function loadAyatMarkerFont(): Promise<void> {
  if (loaded.has("AyatMarker")) return;
  await Font.loadAsync({ AyatMarker: require("../../data/fonts/hafs-unicode/AyatQuran.ttf") });
  loaded.add("AyatMarker");
}
```

**Step 4.2 — add `src/core/data-loader.rn.ts`** if the develop `data-loader.ts` uses `import.meta.url` (the rn-view branch split it). Otherwise, the existing `data-loader.ts` works on both platforms.

**Step 4.3 — write the page-data hook** at [src/view/rn/hooks/use-page-data.ts](src/view/rn/hooks/use-page-data.ts):

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { staticData } from "../../../core/static/data.rn";
import type { Page, MushafLayout } from "../../../core/types";

type State = { data: Page | null; loading: boolean; error: Error | null };

export function usePageData(layout: MushafLayout, page: number): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  const cancelRef = useRef(0);

  const load = useCallback(() => {
    const token = ++cancelRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const thunk = staticData[layout]?.[page];
      if (!thunk) throw new Error(`No page data for ${layout}/p${page}`);
      const data = thunk() as Page;
      if (token === cancelRef.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (token === cancelRef.current) setState({ data: null, loading: false, error: err as Error });
    }
  }, [layout, page]);

  useEffect(() => { load(); }, [load]);
  return state;
}
```

**Step 4.4 — write the font hook** at [src/view/rn/hooks/use-fonts.ts](src/view/rn/hooks/use-fonts.ts):

```ts
import { useEffect, useState } from "react";
import { loadFont, loadBismillahFont, loadSurahNameFont } from "../../../core/font-loader.rn";
import type { MushafLayout } from "../../../core/types";

type State = { ready: boolean; error: Error | null };

export function useFonts(layout: MushafLayout, page: number): State {
  const [state, setState] = useState<State>({ ready: false, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ ready: false, error: null });
    (async () => {
      try {
        await loadFont(layout, page);
        await loadBismillahFont(layout);
        await loadSurahNameFont();
        if (!cancelled) setState({ ready: true, error: null });
      } catch (err) {
        if (!cancelled) setState({ ready: false, error: err as Error });
      }
    })();
    return () => { cancelled = true; };
  }, [layout, page]);

  return state;
}
```

**Validation:**

- `yarn tsc --noEmit` passes.
- `yarn build` is unchanged.
- A small unit test (Vitest, in `src/view/rn/hooks/__tests__/`) covers:
  - cancellation on `page` change before the load resolves
  - dedup on consecutive same-page calls (the module-level `loaded` set)
  - error path when the asset is missing

```bash
yarn test src/view/rn/hooks
```

**Rollback:** `git revert` of phase 4 commits.

---

## Phase 5 — Page, line, word components (4 h)

**Goal:** render one Mushaf page as native RN primitives, using the analytical positions from `createLayoutCalculator`.

**Step 5.1 — `src/view/rn/word.tsx`.**

```tsx
import React, { memo, useCallback } from "react";
import { Pressable, Text } from "react-native";
import type { Word, WordClickedData, WordLayout } from "../../core";

export type WordProps = {
  word: WordLayout;
  fontSize: number;
  lineHeight: number;
  isAyahEnd: boolean;
  isSelected: boolean;
  selectionColor?: string;
  onWordPress?: (data: WordClickedData) => void;
};

function getFontFamily(layout: string, isAyahEnd: boolean): string {
  if (isAyahEnd) return "AyatMarker";
  if (layout === "hafs-unicode") return "DigitalKhatt";
  return `QuranFont-${layout}-p${word.pageNumber}`; // bound below
}

const WordImpl = ({
  word, fontSize, lineHeight, isAyahEnd, isSelected, selectionColor, onWordPress,
}: WordProps) => {
  const family = isAyahEnd
    ? "AyatMarker"
    : word.mushafLayout === "hafs-unicode"
    ? "DigitalKhatt"
    : `QuranFont-${word.mushafLayout}-p${word.pageNumber}`;

  const handlePress = useCallback(() => {
    onWordPress?.({
      id: word.id, surahNumber: word.surah, ayahNumber: word.verse,
      position: word.position, text: word.text, charType: word.charType,
    });
  }, [onWordPress, word]);

  return (
    <Pressable onPress={handlePress} style={{
      position: "absolute", left: word.x, top: word.y,
      width: word.width, height: lineHeight,
      alignItems: "center", justifyContent: "center",
      backgroundColor: isSelected ? (selectionColor ?? "rgba(255,215,0,0.5)") : "transparent",
    }}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ fontFamily: family, fontSize, includeFontPadding: false }}
      >
        {isAyahEnd ? `﴾${word.verse}﴿` : (word.text || `[${word.id}]`)}
      </Text>
    </Pressable>
  );
};

export const WordView = memo(WordImpl);
```

Note: the position is `position: "absolute"` with explicit `left/top/width` from the `WordLayout` returned by the calculator. There is no `onLayout` measurement on words — the calculator gave us the geometry analytically. This is the single biggest fix vs the broken rn-view branch.

**Step 5.2 — `src/view/rn/line.tsx`.** For a line, group the words under one absolutely-positioned `<View>`:

```tsx
import React from "react";
import { View, Text } from "react-native";
import type { LineLayout, MushafLayout, Word, WordClickedData } from "../../core";
import { WordView } from "./word";

export type LineProps = {
  line: LineLayout;
  fontSize: number;
  isCentered: boolean;
  mushafLayout: MushafLayout;
  selectedWordId: number | null;
  onWordPress?: (data: WordClickedData) => void;
  bismillahWords?: Word[];
  bismillahFamily?: string;
};

export const Line: React.FC<LineProps> = ({
  line, fontSize, isCentered, mushafLayout, selectedWordId, onWordPress,
  bismillahWords, bismillahFamily,
}) => {
  if (line.lineType === "header") {
    return (
      <View style={{ position: "absolute", left: line.x, top: line.y, width: line.width, height: line.height, alignItems: "center", justifyContent: "center" }}>
        <Text allowFontScaling={false} style={{ fontFamily: "SurahNameFont", fontSize: fontSize * 1.2 }}>
          {line.surahNumber ? `surah${String(line.surahNumber).padStart(3, "0")}` : ""}
        </Text>
      </View>
    );
  }

  if (line.lineType === "bismillah" && bismillahWords && bismillahFamily) {
    return (
      <View style={{ position: "absolute", left: line.x, top: line.y, width: line.width, height: line.height, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {bismillahWords.map((w) => (
          <Text key={w.id} allowFontScaling={false} style={{ fontFamily: bismillahFamily, fontSize }}>{w.text}</Text>
        ))}
      </View>
    );
  }

  return (
    <View style={{ position: "absolute", left: line.x, top: line.y, width: line.width, height: line.height }}>
      {line.words.map((word) => (
        <WordView
          key={word.id}
          word={{ ...word, mushafLayout }}
          fontSize={fontSize}
          lineHeight={line.height}
          isAyahEnd={word.charType === "end"}
          isSelected={word.id === selectedWordId}
          onWordPress={onWordPress}
        />
      ))}
    </View>
  );
};
```

You'll need to extend `WordLayout` in [src/core/layout-calculator.ts](src/core/layout-calculator.ts) to carry `mushafLayout: MushafLayout`. Or you can pass `mushafLayout` separately from the parent and merge it at render time. The latter is less intrusive.

**Step 5.3 — `src/view/rn/page.tsx`.** Wraps one page's worth of lines:

```tsx
import React from "react";
import { View } from "react-native";
import type { Page, PageLayout } from "../../core";
import { Line } from "./line";
import type { WordClickedData } from "../../core";

export type PageProps = {
  pageData: Page;
  layout: PageLayout;
  mushafLayout: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  fontSize: number;
  selectedWordId: number | null;
  onWordPress?: (data: WordClickedData) => void;
};

export const Page: React.FC<PageProps> = ({ pageData, layout, mushafLayout, fontSize, selectedWordId, onWordPress }) => (
  <View style={{ width: layout.metrics.pageWidth, height: layout.metrics.pageHeight, position: "relative" }}>
    {layout.lines.map((line) => (
      <Line key={line.lineNumber} line={line} fontSize={fontSize}
            isCentered={line.isCentered} mushafLayout={mushafLayout}
            selectedWordId={selectedWordId} onWordPress={onWordPress}
            bismillahWords={pageData.bismillahWords} bismillahFamily={`BismillahFont-${mushafLayout}`} />
    ))}
  </View>
);
```

`Page.bismillahWords` is whatever your `Page` type currently exposes (the develop data loader does or doesn't). If it doesn't, fetch the bismillah words from the same page data by filtering `pageData.verses[0].words` for `charType === "word"` and the bismillah line.

**Step 5.4 — extend `createLayoutCalculator` if needed.** The develop version returns `PageLayout` with `lines: LineLayout[]`, where each `LineLayout` has `lineNumber, y, height, words: WordLayout[], isCentered, lineType, surahNumber?`. Confirm the existing types are sufficient; otherwise add fields (without breaking the existing web/React types).

**Validation:**

- TypeScript: `yarn tsc --noEmit`
- A Vitest snapshot test for `Page` with a fixture `Page` and `PageLayout`.

```bash
yarn test src/view/rn
```

**Rollback:** `git revert` of phase 5 commits.

---

## Phase 6 — `OpenQuranViewRN` top-level (2 h)

**Goal:** the public component. Single page, with sizing, theming, and a `useState` page index.

**Step 6.1 — replace the placeholder** at [src/view/rn/index.tsx](src/view/rn/index.tsx) with the real one:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import { I18nManager } from "react-native";
import {
  createLayoutCalculator,
  loadSurahNameFont,
  type MushafLayout,
  type WordClickedData,
} from "../../core";
import { usePageData } from "./hooks/use-page-data";
import { useFonts } from "./hooks/use-fonts";
import { Page } from "./page";

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

export type OpenQuranViewRNProps = {
  page?: number;
  mushafLayout?: MushafLayout;
  width?: number;
  height?: number;
  ratio?: boolean | number;
  fit?: "width" | "height";
  theme?: "light" | "dark";
  backgroundColor?: string;
  onPageChange?: (page: number) => void;
  onWordPress?: (data: WordClickedData) => void;
  onLoad?: (pageNumber: number) => void;
};

const MUSHAF_RATIO = 0.7;

export const OpenQuranViewRN: React.FC<OpenQuranViewRNProps> = ({
  page = 1,
  mushafLayout = "hafs-v2",
  width: widthProp,
  height: heightProp,
  ratio = true,
  fit = "width",
  theme = "light",
  backgroundColor,
  onPageChange,
  onWordPress,
  onLoad,
}) => {
  const window = useWindowDimensions();
  const [observed, setObserved] = useState({ width: 0, height: 0 });
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);

  // 1. Resolve container size
  const actualRatio = typeof ratio === "number" ? ratio : MUSHAF_RATIO;
  const baseW = observed.width || window.width;
  const baseH = observed.height || window.height;
  const targetH = fit === "height" ? baseH : baseW / actualRatio;
  const containerWidth = widthProp ?? Math.min(baseW, targetH * actualRatio);
  const containerHeight = heightProp ?? containerWidth / actualRatio;

  // 2. Load page data + fonts
  const pageData = usePageData(mushafLayout, page);
  const fontsState = useFonts(mushafLayout, page);

  // 3. Compute layout
  const calculator = useMemo(
    () => createLayoutCalculator({ pageWidth: containerWidth, pageHeight: containerHeight }),
    [containerWidth, containerHeight],
  );
  const pageLayout = useMemo(() => {
    if (!pageData.data) return null;
    return calculator.calculatePageLayout(pageData.data);
  }, [pageData.data, calculator]);

  // 4. Notify
  useEffect(() => { if (pageLayout) onLoad?.(page); }, [pageLayout, page, onLoad]);

  // 5. Layout observer
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) setObserved((o) => (o.width === width ? o : { ...o, width }));
    if (height > 0) setObserved((o) => (o.height === height ? o : { ...o, height }));
  };

  const isLoading = pageData.loading || !fontsState.ready;
  const fontSize = (pageLayout?.metrics.lineHeight ?? 24) / 1.7;

  return (
    <View onLayout={handleLayout} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: backgroundColor ?? (theme === "dark" ? "#1a1a2e" : "#fafafa") }}>
      {isLoading && <ActivityIndicator size="large" color={theme === "dark" ? "#fff" : "#34495e"} />}
      {!isLoading && pageLayout && pageData.data && (
        <Page
          pageData={pageData.data}
          layout={pageLayout}
          mushafLayout={mushafLayout}
          fontSize={fontSize}
          selectedWordId={selectedWordId}
          onWordPress={(d) => { setSelectedWordId(d.id); onWordPress?.(d); }}
        />
      )}
    </View>
  );
};

export default OpenQuranViewRN;
```

**Step 6.2 — small unit test** for the sizing math (the `MUSHAF_RATIO` branch logic) at `src/view/rn/__tests__/sizing.test.ts`.

**Validation:**

- TypeScript: `yarn tsc --noEmit`
- Unit tests: `yarn test src/view/rn`
- The web build (`yarn build`) is unchanged. `dist/view/rn/` is empty/absent.

**Rollback:** `git revert` of phase 6 commit.

---

## Phase 7 — Wire into `playground/rn-expo` and run on device (3–4 h)

**Goal:** end-to-end visual validation.

**Step 7.1 — check the rn-expo playground exists.**

```bash
ls playground/rn-expo/ 2>/dev/null
```

If the rn-view branch left a usable playground (Expo SDK 53, `expo-router`, etc.), reuse it. If not, scaffold:

```bash
cd playground
npx create-expo-app@latest rn-expo --template blank-typescript
cd rn-expo
yarn workspace rn-expo add open-quran-view  # or use the workspace symlink
```

Actually since `playground/rn-expo` is a yarn workspace of `open-quran-view`, the symlink is automatic. To consume the local source:

```json
// playground/rn-expo/package.json
"dependencies": {
  "open-quran-view": "*"
}
```

Then in `playground/rn-expo/app/index.tsx` (or wherever the Expo Router expects the home screen):

```tsx
import { OpenQuranViewRN } from "open-quran-view/view/rn";
import { View, Text, Pressable } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <OpenQuranViewRN page={1} theme="light" width={undefined} height={undefined} />
    </View>
  );
}
```

**Step 7.2 — register fonts in the playground's `app.json`.** The playground is a real Expo app and needs the font assets linked. Add:

```json
{
  "expo": {
    "plugins": [
      ["expo-font", {
        "fonts": [
          "./node_modules/open-quran-view/src/data/fonts/qcf-bsml/QCF_BSML.ttf",
          "./node_modules/open-quran-view/src/data/fonts/hafs-unicode/DigitalKhatt.otf",
          "./node_modules/open-quran-view/src/data/fonts/hafs-unicode/AyatQuran.ttf"
        ]
      }]
    ]
  }
}
```

Per-page fonts (QCF v2) are loaded at runtime via `Font.loadAsync` from the generated `static/fonts.rn.ts` map, so they don't need plugin entries.

**Step 7.3 — `expo prebuild`.**

```bash
cd playground/rn-expo
npx expo prebuild --clean
```

**Step 7.4 — run on a device or simulator.**

```bash
yarn start                 # Expo dev server
# In another terminal:
yarn android               # or: yarn ios
```

**Validation checklist (in order):**

1. **App boots without redbox.** First frame shows the loader.
2. **Page 1 (Al-Fatiha) renders within ~2 seconds.** All seven lines visible, tashkeel correct, no tofu.
3. **Page 2 (start of Al-Baqarah) renders centered.** No tofu.
4. **Switch `mushafLayout` to `"hafs-v4"`.** Re-render. Verify the v4 font's glyphs match the v4 Mushaf. No tofu.
5. **Switch to `"hafs-unicode"`.** Verify DigitalKhatt Unicode font renders real Arabic text (selectable, copyable, searchable). The Basmala on page 1 should use AyatQuran.
6. **Tap a word.** `onWordPress` fires with the correct `WordClickedData`. Selection highlight is visible at the tap position.
7. **Swipe to page 50, then 200, then 604.** No font loading flash after the first paint. Memory doesn't grow unbounded.
8. **Disable network.** Cold restart. Pages 1, 100, 300, 604 still render (everything is bundled).
9. **Rotate device.** `useWindowDimensions` recomputes. Layout reflows correctly.
10. **Toggle dark theme.** Background changes; word color stays readable.

**Rollback:** `git revert` of phase 7 commits; the library is unaffected.

---

## Out of scope for this plan

Consuming `open-quran-view/view/rn` from a separate consumer app (e.g. integrating into an existing Expo project, adding a `mushafRenderer` Jotai atom, building a `<SelectRenderer>` toggle, and similar consumer-side wiring) is intentionally **not** part of this plan. That work belongs in the consumer's own repo, not in `open-quran-view`. The library's own validation lives entirely inside `open-quran-view`'s workspace — `playground/rn-expo/` is the canonical consumer for testing `view/rn` end-to-end.

---

## Phase 8 — Polish + publish (1 h)

**Goal:** ship `open-quran-view@0.7.0` with `view/rn`.

**Step 8.1 — clean up.** Remove any debug code, ensure `tsup` is clean, ensure `dist/` doesn't contain any `.rn.ts` artifacts.

**Step 8.2 — write a CHANGELOG entry.**

```md
## 0.7.0 — 2026-XX-XX
### Added
- `open-quran-view/view/rn` — new React Native entry point, exports `OpenQuranViewRN`.
  QCF v2 font-based Mushaf renderer for Expo (and bare RN via expo prebuild).
### Notes
- Existing `view` and `view/web` exports are unchanged.
- All new RN code lives under `src/view/rn/`, `src/core/font-loader.rn.ts`,
  `src/core/data-loader.rn.ts`, `src/core/static/{fonts,data}.rn.ts`.
- Font assets must be registered in the consumer's `app.json` (Expo) or
  `react-native.config.js` (bare RN).
```

**Step 8.3 — publish.**

```bash
yarn build
yarn test
yarn version 0.7.0
yarn publish
```

**Validation:**

- `dist/view/rn/` doesn't exist (correctly stripped).
- The new entry is reachable: `node -e "console.log(require.resolve('open-quran-view/view/rn', { paths: [process.cwd()] }))"` from inside a consumer resolves to the playground's symlink or the published path.
- The CHANGELOG is correct.

---

## Risk register

- **`tsup` accidentally bundles `.rn.ts` into the web `dist/`.** Phase 1.4 explicitly strips them; the validation step in every phase is `ls dist/view/`.
- **`createLayoutCalculator` types don't fit the new components.** Phase 5.4 extends the calculator's types without breaking the web/React types.
- **Per-page font registration is slow on Android.** Module-level `loaded: Set<string>` dedup; `Font.loadAsync` is idempotent.
- **The yarn workspace symlink doesn't resolve `open-quran-view/view/rn`.** The export map uses `react-native` condition; verify with `node -e "..."` in `playground/rn-expo/`.
- **The broken `rn-view` branch's leftover files cause conflicts.** Phase 0 starts on a fresh `rn-view-v2` branch off `develop`; the broken branch is not touched.
- **Publishing without bumping the version overwrites `0.6.1`.** Bump to `0.7.0` in Phase 8.3; existing consumers on `^0.6.1` are not affected.

---

## Quick reference: the file tree at the end of the plan

```text
src/
├── view/
│   ├── react/                 (unchanged)
│   ├── web/                   (unchanged)
│   └── rn/                    (NEW)
│       ├── index.tsx
│       ├── page.tsx
│       ├── line.tsx
│       ├── word.tsx
│       ├── hooks/
│       │   ├── use-page-data.ts
│       │   ├── use-fonts.ts
│       │   └── __tests__/
│       │       ├── use-page-data.test.ts
│       │       └── use-fonts.test.ts
│       └── __tests__/
│           └── sizing.test.ts
├── core/
│   ├── font-loader.rn.ts      (NEW)
│   ├── data-loader.rn.ts      (NEW, only if develop data-loader uses import.meta.url)
│   ├── index.rn.ts            (NEW)
│   └── static/
│       ├── fonts.rn.ts        (NEW, generated)
│       └── data.rn.ts         (NEW, generated)
└── (everything else unchanged)

scripts/
├── generate-static-fonts.ts   (MODIFIED: emit fonts.rn.ts in addition to fonts.ts)
└── generate-static-data.ts    (MODIFIED: emit data.rn.ts in addition to data.ts)

tsup.config.ts                 (MODIFIED: ignore src/view/rn/, strip from dist)
package.json                   (MODIFIED: add exports["./view/rn"], bump to 0.7.0)

playground/
└── rn-expo/                   (extends with OpenQuranViewRN import)
```

Total new files: ~10 source files + ~3 test files.
Total modified files: 3 (tsup.config.ts, package.json, two scripts).
Existing `develop` React + Web: unchanged.
