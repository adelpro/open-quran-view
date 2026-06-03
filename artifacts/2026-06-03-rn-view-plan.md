# Add React Native Support to `open-quran-view`

This plan outlines the design and step-by-step implementation for adding a first-class React Native view (`open-quran-view/view/rn`) to the library, allowing mobile applications to render high-fidelity Mushaf layouts natively.

## Context

`open-quran-view` is a cross-platform Quran component library currently rendering pages using CSS flexbox for word layouts. We want to expose a React Native view (`<OpenQuranView />`) that:
1. Renders using real native primitives (no WebView) for performance and touch fidelity.
2. Stays offline-first by lazy-loading fonts and page JSON dynamically.
3. Resolves asset limitations (WOFF2 is not supported by React Native; we must migrate to TTF/OTF).
4. Leverages Metro bundler conventions without requiring complex custom splits.

---

## User Review Required

> [!IMPORTANT]
> **Layout Strategy: Flexbox Native Elements**
> We have rejected the `react-native-svg` and Skia layout options. Instead, the RN Line rendering will use native `<View>`, `<Pressable>`, and `<Text>` components organized in a flex row (`flexDirection: 'row-reverse'`). This matches the web view's CSS flex layout 1:1, guarantees platform text-shaping compatibility, and avoids complex hit-box calculation bugs.

> [!WARNING]
> **Static Require Maps for Metro Compatibility**
> Metro does not support dynamic import strings (e.g., `import('./p' + page)`). To support lazy loading of split page data and fonts without loading all of them into the JS heap at startup, we will generate maps of static `require()` thunks:
> ```typescript
> export const pageDataThunks = {
>   "hafs-v2": {
>     1: () => require("../../data/pages/hafs-v2/p1.json"),
>     // ...
>   }
> };
> ```
> Calling these thunks loads and parses JSON dynamically on page navigation.

> [!NOTE]
> **Font Format Shift (Web & Native)**
> We are standardizing on `.ttf` for both Web and React Native. Web CSS `@font-face` declarations will be updated from `.woff2` to `.ttf`. Since modern web browsers fully support TTF, this keeps the package footprint unified.

---

## Proposed Changes

### Core Calculations & Data Split

#### [NEW] [split-pages.ts](file:///d:/benyahia-dev/open-quran-view/scripts/split-pages.ts)
Reads the monolithic 25MB `pages.json` for each layout (`hafs-v2`, `hafs-v4`, `hafs-unicode`) and splits it into 604 per-page files (`src/data/pages/{layout}/p{N}.json`, ~40KB each).

#### [MODIFY] [generate-static-fonts.ts](file:///d:/benyahia-dev/open-quran-view/scripts/generate-static-fonts.ts) & [generate-static-data.ts](file:///d:/benyahia-dev/open-quran-view/scripts/generate-static-data.ts)
Update these scripts to output both `.web.ts` and `.rn.ts` variants:
- **Web variants**: Emits `new URL(..., import.meta.url).href` references.
- **React Native variants**: Emits `require(...)` asset maps / lazy require thunks.

#### [MODIFY] [font-loader.ts](file:///d:/benyahia-dev/open-quran-view/src/core/font-loader.ts)
Split this file into:
- [font-loader.web.ts](file:///d:/benyahia-dev/open-quran-view/src/core/font-loader.web.ts): Employs browser `FontFace` API.
- [font-loader.rn.ts](file:///d:/benyahia-dev/open-quran-view/src/core/font-loader.rn.ts): Employs Expo's `Font.loadAsync`.

---

### React Native Components (`src/view/rn/`)

#### [NEW] [index.tsx](file:///d:/benyahia-dev/open-quran-view/src/view/rn/index.tsx)
Main native `<OpenQuranView>` component. Observes dimensions, invokes the layout calculator, and manages active page state.

#### [NEW] [line.tsx](file:///d:/benyahia-dev/open-quran-view/src/view/rn/line.tsx)
Renders a page line using a `<View style={styles.lineRow}>` with `flexDirection: 'row-reverse'`.

#### [NEW] [word.tsx](file:///d:/benyahia-dev/open-quran-view/src/view/rn/word.tsx)
Renders an individual word inside a `<Pressable>` or `<TouchableOpacity>` triggering `onWordClick`.

#### [NEW] [hooks/use-page-data.ts](file:///d:/benyahia-dev/open-quran-view/src/view/rn/hooks/use-page-data.ts)
Loads the split page JSON via the static require thunks, managing load state, errors, and canceling stale requests.

#### [NEW] [hooks/use-fonts.ts](file:///d:/benyahia-dev/open-quran-view/src/view/rn/hooks/use-fonts.ts)
Loads the specific QCF page font dynamically via `Font.loadAsync` as pages are turned.

---

### Monorepo & Build Changes

#### [MODIFY] [package.json](file:///d:/benyahia-dev/open-quran-view/package.json)
Expose the React Native view export for compilation:
```json
"exports": {
  "./view/rn": {
    "types": "./src/view/rn/index.tsx",
    "react-native": "./src/view/rn/index.tsx",
    "default": "./src/view/rn/index.tsx"
  }
}
```

#### [NEW] [react-native.config.js](file:///d:/benyahia-dev/open-quran-view/react-native-config.js)
Link the small, globally-needed font assets (`digitalkhatt.otf`, `AyatQuran.ttf`, and `surah-name-v4.ttf`) automatically into the consumer app at build time.

#### [NEW] [playground/rn-expo/](file:///d:/benyahia-dev/open-quran-view/playground/rn-expo/)
Create a template Expo SDK 52 application to serve as a visual validation suite.

---

## Verification Plan

### Automated Tests
- Run `yarn test` to verify no web regression.
- Create unit tests for RN hooks `use-page-data.ts` and `use-fonts.ts`.

### Manual Verification
- **Web Parity**: Load the web playground. Verify layouts on pages 1, 100, and 604 in Chrome and Firefox still render perfectly using TTF fonts.
- **Expo App Verification**: Spin up the `playground/rn-expo` app on the Expo web development server and/or simulator.
  - Page 1 Al-Fatiha loads correctly (V2).
  - Tapping words logs correctly structured `WordClickedData`.
  - Switching to V4 / Unicode layouts works correctly.
  - Toggle light/dark themes, verifying background and font color reactions.
  - Disable network completely and confirm pages still load offline.
