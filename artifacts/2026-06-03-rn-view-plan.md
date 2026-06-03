# Add a Native React Native View to `open-quran-view`

## Context

`open-quran-view` is a cross-platform Quran component library, currently shipping **two web variants** — a React component (`./view/react`) and a Web Component (`./view/web`). The package is web-only:

- `tsup` is the only bundler; output is ESM with web `@font-face` URLs
- All fonts are WOFF2 in `src/data/fonts/` (gitignored at the page-font level; bundled into `dist/data/fonts/` at build time)
- Page data is monolithic `pages.json` per layout (~25 MB each), imported via `new URL(..., import.meta.url).href`
- The repo already shows intent for React Native: an empty `src/view/rn/` placeholder exists, and `playground/rn-expo/` has an Expo skeleton (no `package.json` yet)
- A WOFF2-only font format is fine for the browser, but **WOFF2 doesn't work in React Native** (RN's `Font.loadAsync` and asset linking only accept TTF/OTF)

We want to add a **first-class native RN view** (`<OpenQuranView />` importable from `open-quran-view/view/rn`) that:

1. Renders with real RN primitives (no WebView) — so consumers get native perf, gestures, and look-and-feel
2. Mirrors the React web API (same props, same callbacks) — so docs and mental model are unified
3. Stays **offline-first** like the web view — fonts and pages are bundled in the consumer app, no runtime fetch
4. **Does not double the package's asset footprint** — no shipping both WOFF2 and TTF/OTF

The intended outcome is a third export (`./view/rn`) that RN apps can `import` and render, with `playground/rn-expo` serving as the working example.

## Approved design choices (locked in)

- **Native rendering** — `react-native-svg` for v1. Rationale: the page is a tree of precisely-positioned glyphs; SVG's `<Text fontFamily x y>` maps 1:1 to what the web view does, and `<Pressable>` wraps a glyph naturally for tap handling. Skia is faster for animations / complex paths but its text model is paragraph-oriented (`Skia.Text`) which doesn't expose per-glyph taps without a custom layout layer — that's a much bigger rewrite for no clear win. **Open question**: do a 30-min Phase 0 spike (build a 5-glyph page in both libraries, measure cold-render time, inspect tap-handling code size) and convert this to a documented decision before Phase 3. Default if the spike is skipped: stay on `react-native-svg`.- **TTF/OTF as the canonical font format** — TTF works in modern browsers via `@font-face`, and in RN via `Font.loadAsync` / `react-native.config.js` auto-linking. **One font set for both platforms.** Web view's CSS is updated to point at `.ttf` files (modern browsers fully support them)
- **Mirror the React web API** — same `OpenQuranViewProps` minus `className` / `fullscreen` / `onFullscreenToggle`. Add `style?: ViewStyle` and `loadingView?: ReactNode`
- **RN entry exposed via `exports.react-native` condition** — Metro on the consumer side compiles the package's TypeScript source directly. This is the standard 2025 pattern (same as `react-native-svg`, `react-navigation`). No pre-bundling fight with Metro
- **Lazy `import()` per page for `pages.json`** — split the monolithic 25 MB `pages.json` into 604 per-page files (`pages/{layout}/p{N}.json`, ~40 KB each). Metro splits the dynamic import; the consumer app only ever holds the current page in memory. Fully offline, no network
- **Hybrid font registration** — small always-needed fonts (digitalkhatt, AyatQuran, surah-name) are auto-linked via `react-native.config.js`. The huge QCF V2/V4 per-page fonts are loaded at runtime via `Font.loadAsync` as the user navigates pages

## Architecture

### File layout (after)

```
src/
  core/                            # PLATFORM-AGNOSTIC, REUSE AS-IS
    layout-calculator.ts           #   createLayoutCalculator(), PageLayout — pure logic
    types.ts                       #   MushafLayout, Word, Line, Page, LineType
    data-loader.ts                 #   loadPage(), loadBismillahWords() — JSON only, no platform deps
    bismillah.ts
    lookup.ts
    static/                        #   SPLIT: keep .web.ts (URL-based), add .rn.ts (require-based)
      fonts.web.ts  /  fonts.rn.ts
      data.web.ts   /  data.rn.ts
    font-loader.ts                 #   SPLIT: rename to .web.ts (FontFace API), add .rn.ts (Font.loadAsync)

  view/
    react/                         # existing — web React component
      index.tsx                    #   update @font-face url() to .ttf
      line.tsx
      loading.tsx
      navigation-controls.tsx
    web/                           # existing — web component
    rn/                            # NEW
      index.tsx                    # main <OpenQuranView> for RN (mirrors react/)
      line.tsx                     # line renderer using react-native-svg
      word.tsx                     # word with onPress
      navigation-controls.tsx
      loading.tsx
      hooks/
        use-fonts.ts               # Font.loadAsync for per-page QCF fonts
        use-page-data.ts           # dynamic import() of p{N}.json
      styles.ts                    # StyleSheet
      types.ts                     # OpenQuranViewProps (RN)

  data/                            # unchanged location
    fonts/
      hafs-unicode/                # already TTF/OTF
        digitalkhatt.otf
        AyatQuran2-PVKGm.ttf
      hafs-v2/p1.ttf … p604.ttf    # NEW: TTF (replaces woff2)
      hafs-v4/p1.ttf … p604.ttf    # NEW: TTF
      shared/surah-name-v4.ttf     # NEW: TTF
    pages/
      hafs-v2/p1.json … p604.json  # NEW: per-page split
      hafs-v4/p1.json … p604.json
      hafs-unicode/p1.json … p604.json

react-native.config.js             # NEW: auto-link small fonts
playground/
  rn-expo/                         # wire as a workspace, add app code
    package.json                   # NEW
    app.json                       # NEW
    babel.config.js                # NEW
    metro.config.js                # NEW: resolve `open-quran-view` to source
    App.tsx                        # NEW: demo
```

### Reuse from `src/core/`

- `layout-calculator.ts` — `createLayoutCalculator()`, `PageLayout`, `LineLayout`, `WordLayout`. **No changes needed.** Both web and RN consume it.
- `types.ts` — `MushafLayout`, `Word`, `Line`, `Page`. **No changes needed.**
- `data-loader.ts` — already JSON-only. **No changes needed.**
- `bismillah.ts`, `lookup.ts` — **No changes needed.**

Only `font-loader.ts` and `static/{fonts,data}.ts` need platform splits (they use `FontFace`, `document.fonts`, `new URL(..., import.meta.url)` — all web-only).

### Build & packaging changes

**`package.json`** — add:
```json
"exports": {
  "./view":       { ... existing ... },
  "./view/react": { ... existing ... },
  "./view/web":   { ... existing ... },
  "./view/rn": {
    "types":   "./src/view/rn/index.tsx",
    "react-native": "./src/view/rn/index.tsx",
    "default": "./src/view/rn/index.tsx"
  }
}
```

**`tsup.config.ts`** — no new entry. The `onSuccess` post-build hook already copies `src/data/fonts/*` → `dist/data/fonts/*` for the web build. Exclude the new `*.rn.ts` files from tsup's input (set `entry` to web sources only; tsup will only pick up the files it can resolve from those entries, so explicit exclusion is usually not required). Verify with `yarn build` that no `*.rn.ts` ends up in `dist/`.

**`react-native.config.js`** (NEW, at package root):
```js
module.exports = {
  project: {},
  assets: [
    './src/data/fonts/hafs-unicode',
    './src/data/fonts/shared',
  ],
};
```
Auto-links the small always-needed fonts (digitalkhatt, AyatQuran, surah-name). QCF V2/V4 are loaded per-page via `Font.loadAsync` to keep the app size down.

**`playground/rn-expo/package.json`** (NEW) — Expo SDK ~52, `react-native-svg`, `expo-font`. Import the package via `workspace:*` (same as the existing `vite-react` and `vite-typescript` playgrounds).

**`playground/rn-expo/metro.config.js`** (NEW) — Yarn-workspaces-aware Metro config that resolves `open-quran-view` to its source root (so Metro picks up `src/view/rn/*.tsx` directly).

### Scripts changes

- **`scripts/download-fonts.ts`** — change V2/V4 URLs from `…/woff2/p{N}.woff2` to `…/ttf/p{N}.ttf` (or to `…/woff2/p{N}.woff2` decoded with `wawoff2` if the CDN only serves WOFF2; **verify which during implementation**, and document the decision). Add a third file extension case for `.ttf`.
- **`scripts/generate-static-fonts.ts`** — emit **two** outputs: `src/core/static/fonts.web.ts` (existing, with `new URL(...).href`) and `src/core/static/fonts.rn.ts` (new, with `require(...)` for Metro).
- **`scripts/generate-static-data.ts`** — same: emit `data.web.ts` and `data.rn.ts`. The RN version produces `Record<string, () => Promise<unknown>>` mapping page numbers to dynamic `import()` thunks so Metro can split.
- **`scripts/split-pages.ts`** (NEW) — read each layout's monolithic `pages.json`, write `src/data/pages/{layout}/p{N}.json` per page. ~40 KB each. Idempotent (skip if file exists & mtime ≥ source). Add `yarn generate:pages:split` script alias.
- **`scripts/generate-all.ts`** — add `split-pages` to the orchestration.

### Component API for `src/view/rn/`

```ts
// src/view/rn/index.tsx
export type OpenQuranViewProps = {
  page?: number;                          // default 1
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';               // default 'light'
  mushafLayout?: MushafLayout;            // 'hafs-v2' | 'hafs-v4' | 'hafs-unicode'
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: WordClickedData) => void;
  style?: ViewStyle;                      // RN-idiomatic (replaces className)
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
  navigationControls?: boolean;
  ratio?: boolean | number;
  fit?: 'width' | 'height';
  loadingView?: ReactNode;
};
```

Drops vs. web: `className`, `fullscreen`, `onFullscreenToggle` (consumer handles fullscreen via `react-native` or `expo-screen-capture`).

## Implementation phases

### Phase 0 — Pre-work (no behavior change for web)

1. Verify the Quran Foundation CDN endpoint: does it serve `.ttf` for QCF V2/V4 directly, or only `.woff2`? Update `scripts/download-fonts.ts` accordingly. If TTF isn't directly available, add a `wawoff2`-based decode step.
2. Update web view's `@font-face` declarations (`src/view/react/` + any CSS / inline styles) to reference `.ttf` instead of `.woff2`. Test in Chrome, Safari, Firefox.
3. Add `scripts/split-pages.ts` and the `generate:pages:split` script alias. Run it; verify `src/data/pages/hafs-v2/p{1..604}.json` exist.
4. Update `generate-static-fonts.ts` and `generate-static-data.ts` to emit both `.web.ts` and `.rn.ts` variants. Verify the web variant still produces a working `dist/`.
5. **Optional Skia vs SVG spike** — 30-min throwaway: scaffold a minimal page in both `react-native-svg` and `@shopify/react-native-skia`, render 5 QCF glyphs in each, tap each, measure first-paint time, count lines of tap-handling code. Record the result in `docs/architecture/rendering-decision.md` and either keep the SVG default or upgrade to Skia. **Skip the spike only if you confirm in writing** that you accept the SVG rationale.

> **🛑 USER GATE — STOP after Phase 0**
> Before any Phase 1 work, the user runs the web playground locally across V2, V4, and Unicode, in **Chrome, Safari, and Firefox**, on pages 1, 100, and 604, and visually confirms parity with the pre-Phase-0 baseline. Only on explicit user approval do we proceed to Phase 1.
> While waiting, re-export the plan to `artifacts/2026-06-03-rn-view-plan.md` (see "Plan export & sync" below).

### Phase 1 — Wire up RN packaging

5. Create `react-native.config.js` (assets auto-link).
6. Add `./view/rn` to `package.json` `exports` with the `react-native` condition.
7. **Bootstrap the playground with the official Expo CLI, then wire it into the yarn workspace** (do not hand-roll `package.json` / `app.json` / `metro.config.js` — we want a full, up-to-date, web-enabled app):
   - Remove the existing empty `playground/rn-expo/` skeleton (`assets/`, `scripts/`, `src/`, `.expo/`, `.vscode/`).
   - From the repo root, run: `npx create-expo-app@latest playground/rn-expo --template default` (this template includes iOS, Android, **and web** out of the box, plus the latest Expo SDK, Metro config, babel config, etc.).
   - Make sure `playground/rn-expo` is declared in the root `package.json` `workspaces` array. If it isn't, add it (`"playground/*"` is the simplest and matches the existing `vite-react` / `vite-typescript` workspaces).
   - From the freshly-generated `playground/rn-expo/package.json`, change the `open-quran-view` dependency to `"workspace:*"` (it isn't there yet — we add it: `yarn workspace rn-expo add open-quran-view@workspace:*`).
   - In `playground/rn-expo/metro.config.js`, add a `watchFolders` entry for the package root (`path.resolve(__dirname, '../..')`) so Metro resolves `open-quran-view/view/rn` to the source files and watches them for changes.
   - Verify `yarn workspace rn-expo start` boots on web, iOS, and Android (iOS/Android may need simulator/device — web is the must-have for the smoke check).
8. Verify `yarn build` still produces a clean web `dist/` with no RN code, and that `yarn playground:rn` (= `yarn workspace rn-expo start --web`) launches.

### Phase 2 — Refactor `src/core/` for platform support

9. Rename `src/core/font-loader.ts` → `src/core/font-loader.web.ts`. Create `src/core/font-loader.rn.ts` exporting the same surface (`loadSurahNameFont`, `loadDigitalKhattFont`, `loadAyatMarkerFont`, `loadBismillahFont`, `loadFont`, `loadPage`, `getSurahNameFontBuffer`, `getSurahNameFontUrl`, `surahNumberToFontCode`, `getSurahFrameUrl`) but using `Font.loadAsync` (from `expo-font` or `react-native`). `getSurahFrameUrl` returns the local asset URI in RN.
10. Rename `src/core/static/fonts.ts` → `src/core/static/fonts.web.ts`. Create `src/core/static/fonts.rn.ts` with the same shape but values being `require('...')` results (Metro-resolved asset refs).
11. Rename `src/core/static/data.ts` → `src/core/static/data.web.ts`. Create `src/core/static/data.rn.ts` returning `Record<layout, Record<pageNum, () => Promise<unknown>>>` for the dynamic `import()`.
12. Add `tsup.config.ts` exclude pattern (or rely on tsup's tree-shaking from explicit web entries) to keep `*.rn.ts` out of the web `dist/`. Verify with `yarn build && ls dist/`.

### Phase 3 — Build the RN view

13. `src/view/rn/index.tsx` — root `<OpenQuranView>`. Mirrors `src/view/react/index.tsx` structure: load page, build `PageLayout` via `createLayoutCalculator`, render lines, fire callbacks. Uses `View` instead of `HTMLDivElement`, `StyleSheet` instead of CSS.
14. `src/view/rn/line.tsx` — renders a line using `react-native-svg` `<Svg><Text fontFamily=…>…</Text></Svg>` per line, with the same word-positioning math as the web line.
15. `src/view/rn/word.tsx` — a `<Pressable>` wrapping each glyph; fires `onWordClick` with `WordClickedData`.
16. `src/view/rn/navigation-controls.tsx` — RN-equivalent of the web controls (`<Pressable>` buttons).
17. `src/view/rn/loading.tsx` — `<ActivityIndicator>`.
18. `src/view/rn/hooks/use-fonts.ts` — accepts a `mushafLayout` + `pageNumber`, calls `Font.loadAsync` for the per-page QCF font and any pending small fonts. Memoizes load promises to avoid duplicate loads.
19. `src/view/rn/hooks/use-page-data.ts` — accepts `mushafLayout` + `pageNumber`, calls the static data thunk (`import(\`.../p${page}.json\`)`), returns `{ data, error, loading }`. Cancels stale loads when `pageNumber` changes (an `AbortController`-style guard).
20. `src/view/rn/styles.ts` — `StyleSheet.create({ container: {…}, page: {…}, line: {…} })`. Dark/light variants.

### Phase 4 — Playground

21. `playground/rn-expo/App.tsx` — Expo demo with a `<OpenQuranView>` on screen 1, controls to switch layout / theme / page, a tap-anywhere overlay that shows `onWordClick` payload. A second screen tests V4 + Unicode to exercise all three layouts.
22. Add `playground:rn` script in root `package.json`: `yarn workspace rn-expo start`.

### Phase 5 — Tests, docs, polish

23. `src/view/rn/hooks/use-page-data.test.ts` — vitest with a mocked `import()`; covers happy path, page-change cancellation, error propagation.
24. `src/view/rn/hooks/use-fonts.test.ts` — vitest with a mocked `Font.loadAsync`; covers dedup, font-not-found error.
25. `README.md` — add "React Native" usage section (Expo install, font asset linking, basic example).
26. `docs/architecture/react-native.md` — architecture doc, mirroring `docs/architecture/data-structure.md`.
27. `docs/guides/react-native-setup.md` — consumer setup guide (installing fonts, configuring Metro, common pitfalls).
28. `CHANGELOG.md` — entry under the next version.

### Post-approval deliverable

### Plan export & sync (artifacts/ copy)

The plan lives in two places, kept in sync:

- **Source of truth**: `C:\Users\user\.claude\plans\give-me-a-plan-snappy-perlis.md` (the plan-mode file)
- **Repo copy**: `d:\benyahia-dev\open-quran-view\artifacts\2026-06-03-rn-view-plan.md` (committed alongside the code, so the repo always has a self-contained reference of "what we're building and why")

Sync rules:

- **On plan approval**: copy the approved plan to `artifacts/2026-06-03-rn-view-plan.md` as the first implementation step. Commit it on a `chore: add RN view design doc` commit.
- **After every phase** (0 through 5): if the plan was amended during the phase (e.g., the Skia spike forced a library switch, or the user-gate surfaced a regression), copy the updated plan to `artifacts/2026-06-03-rn-view-plan.md` and commit on a `docs: update RN view design` commit. If the plan was untouched, skip the re-export.
- The artifacts copy is **append-only with a date stamp** is NOT the format. The artifacts copy is always the **current** plan — old versions live in git history, not in the file.
- The artifacts file is read-only for implementation; it is only ever re-exported from the plan-mode file, never edited directly.

Step 29. (replaces the old single-line "export once" deliverable).

## Critical files to modify

- `package.json` — `exports`, `workspaces`, new scripts
- `tsup.config.ts` — exclude `*.rn.ts`
- `scripts/download-fonts.ts` — TTF extension
- `scripts/generate-static-data.ts` — emit web + rn variants
- `scripts/generate-static-fonts.ts` — emit web + rn variants
- `scripts/generate-all.ts` — orchestrate `split-pages`
- `src/core/font-loader.ts` — split into `.web.ts` + `.rn.ts`
- `src/core/static/data.ts` — split
- `src/core/static/fonts.ts` — split
- `src/view/react/index.tsx` (and any `@font-face` CSS) — point to `.ttf`

## Critical files to create

- `react-native.config.js`
- `scripts/split-pages.ts`
- `playground/rn-expo/package.json`, `app.json`, `babel.config.js`, `metro.config.js`, `App.tsx`
- `src/core/font-loader.web.ts`, `src/core/font-loader.rn.ts`
- `src/core/static/data.web.ts`, `src/core/static/data.rn.ts`
- `src/core/static/fonts.web.ts`, `src/core/static/fonts.rn.ts`
- `src/view/rn/index.tsx`, `line.tsx`, `word.tsx`, `navigation-controls.tsx`, `loading.tsx`, `styles.ts`
- `src/view/rn/hooks/use-fonts.ts`, `use-page-data.ts`
- `src/view/rn/hooks/use-fonts.test.ts`, `use-page-data.test.ts`
- `docs/architecture/react-native.md`
- `docs/guides/react-native-setup.md`
- `artifacts/2026-06-03-rn-view-plan.md` (exported copy of this plan; re-exported after every phase that amends it)

## Verification

End-to-end checks, in order:

1. **Web parity not broken**
   - `yarn build` → no errors, `dist/` contains only web entries, no `*.rn.ts` files
   - `yarn playground:react` → pages 1, 100, 604 render in Chrome, Safari, Firefox with V2 / V4 / Unicode
   - Visual diff vs. pre-change baseline: pages look identical (TTF renders the same glyphs as WOFF2 for the QCF fonts we ship)

2. **Fonts in TTF/OTF**
   - `ls src/data/fonts/hafs-v2/*.ttf | wc -l` → 604
   - `ls src/data/fonts/hafs-v4/*.ttf | wc -l` → 604
   - `du -sh src/data/fonts/` → roughly the same magnitude as before (TTF may be slightly larger than WOFF2, but **only one format is shipped**, not two)

3. **Pages split**
   - `ls src/data/pages/hafs-v2/p*.json | wc -l` → 604
   - `yarn workspace rn-expo start` → no Metro errors about missing modules

4. **RN view renders**
   - Launch `playground/rn-expo` in Expo Go (iOS and Android)
   - Page 1 renders correctly (V2 default layout)
   - Tap any word → `onWordClick` fires with the correct `WordClickedData`
   - Switch to V4 layout via the demo controls → page re-renders with V4 glyphs
   - Switch to Unicode layout → page renders with digitalkhatt
   - Theme toggle (light/dark) reflects immediately
   - Navigation controls (prev/next) work; `onPageChange` fires
   - Highlight a verse (e.g., Al-Fatiha 1) → that verse is visually highlighted
   - Highlight a word → that word is visually highlighted
   - `onLoad` fires once with the resolved `PageLayout` after first paint

5. **Auto-linking vs lazy load**
   - Verify small fonts (`digitalkhatt`, `AyatQuran2-PVKGm`, `surah-name-v4`) are present in the iOS .app / Android APK without any `Font.loadAsync` call (proves auto-link worked)
   - Verify QCF V2/V4 fonts are **not** in the binary; they are downloaded on demand by `use-fonts` (instrument the hook to log `Font.loadAsync` calls; expect one per unique page, deduped on revisits)

6. **No duplication**
   - `du -sh src/data/fonts` should be roughly the same magnitude as the pre-change WOFF2 footprint, **not double**. Concretely: pre-change had WOFF2 only; post-change has TTF only.

7. **Tests pass**
   - `yarn test` → all web tests still pass
   - `yarn test src/view/rn/hooks` → new hook tests pass

8. **No offline regression**
   - Disable network on the RN device → page 1, page 100, page 604 all still render
   - Disable network on the web playground → same

9. **Final plan export & on-going sync**
   - `artifacts/2026-06-03-rn-view-plan.md` exists in the repo root
   - First export happens immediately on plan approval (Step 29, on its own commit)
   - Re-export at the end of every phase that modified the plan
   - The artifacts file always matches the plan-mode file at the time of last re-export

## Out of scope (YAGNI)

- Word-level tajweed coloring in V4 inside RN (color font rendering quirks in `react-native-svg` are well-known; punt to v2)
- Glyph-path rendering inside RN (the existing `src/data/glyph-paths/` is for the web view's fallback; revisit only if perf demands it for RN)
- A separate "offline mode toggle" prop (always offline for v1)
- Server-side rendering of the RN view (N/A)
- Page-turn animation / swipe gestures (consumer can add with `react-native-gesture-handler`)
- Search / jump-to-verse (the web view doesn't have it either)
- Bare React Native playground (Expo only for v1; bare RN is one `metro.config.js` away and can be added later)
- A second npm package (`@open-quran-view/rn`) — single package, single version

## Open questions to resolve in Phase 0

- **TTF availability on Quran Foundation CDN** — does `https://verses.quran.foundation/fonts/quran/hafs/v2/woff2/p1.woff2` have a `.ttf` sibling, or do we need a WOFF2→TTF decode step (`wawoff2` is a Node binding that does this)? This affects how `scripts/download-fonts.ts` is written but not the rest of the plan.
