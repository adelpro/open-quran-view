# Porting React Native support to `open-quran-view` — research findings

> **⚠️ SUPERSEDED 2026-06-23.** This article proposed redesigning the `rn-view` branch in `open-quran-view`. That target was wrong: the user does not want to add RN to `open-quran-view` (which is a React+Web library whose `develop` branch must stay untouched). The RN view belongs in the user's existing Expo app, `open-mushaf-native`. The corrected plan lives at [2026-06-23-font-based-mushaf-view-in-open-mushaf-native.md](2026-06-23-font-based-mushaf-view-in-open-mushaf-native.md). Keep this file only as a record of the patterns pulled from `react-native-quran-hafs`.

**Date:** 2026-06-23
**Status:** SUPERSEDED — see file above.
**Reading order:** only read the reference patterns in §2; ignore §3-§5.

---

## 1. Context

Three repos / branches are in play. They must not be confused.

| Path | Role | RN support |
|------|------|------------|
| `D:\benyahia-dev\open-quran-view` (branch `develop`, v0.6.1) | Last active, viable code. Web + plain React only. | **None.** This is the baseline. |
| `D:\benyahia-dev\open-quran-view` (branch `rn-view`, v0.7.0) | The RN attempt. 10 commits diverged from develop at `d1d5d36`, +15 163 / −1 440 lines. | **Dead end.** User is restarting the design. |
| `D:\benyahia-dev\react-native-quran-hafs` (v1.0.3) | Third-party bare-RN library on npm. | **Working.** Used as a reference for the redesign. **Not the user's code.** |

What we need out of this article:
- A clean read of what `react-native-quran-hafs` actually does to render a Mushaf page in RN.
- A clean read of what the in-tree `rn-view` branch tried to do, and where the design diverges.
- A short list of patterns to **borrow** and patterns to **deliberately not borrow**.

The previous plan lives at [artifacts/2026-06-03-rn-view-plan.md](2026-06-03-rn-view-plan.md); it captures the original intent but not the field data below.

---

## 2. Reference: how `react-native-quran-hafs` renders the Mushaf in RN

Package at `D:\benyahia-dev\react-native-quran-hafs`. Bare RN CLI 0.74, no Expo. Peer deps: `react-native-fs`, `react-native-dynamic-fonts`, `react-native-track-player`, `react-native-responsive-fontsize`, `axios`. Works in Expo only via `expo prebuild` + dev client (not Expo Go).

### 2.1 Font format

QCF v1 (King Fahd Complex, old page-keyed format). 604 separate `.ttf` files in `src/assets/fonts/`:

```
QCF_P001.ttf … QCF_P604.ttf   — 604 page fonts (download at runtime)
QCF_BSML.ttf                  — Basmala + surah-name glyph
Cairo.ttf                     — UI text (page numbers, juz labels)
```

- Static fonts (Cairo, QCF_BSML, QCF_P001) are auto-linked via [react-native.config.js:6](react-native.config.js#L6) `assets: ['./src/assets/fonts']` and the [link-assets-manifest.json](link-assets-manifest.json) (only page 1 is bundled; pages 2–604 are downloaded).
- At runtime the per-page fonts are fetched from `QURAN_FONTS_API` (a URL passed in from [App.tsx](App.tsx)).

### 2.2 Data flow

[src/hooks/apis/useGetChapterByPage.ts](src/hooks/apis/useGetChapterByPage.ts) is the orchestrator. On mount it:

1. Checks `${DocumentDirectoryPath}/QuranChapters/{chapterId}.json` (or `QuranJuzs/` for a juz). On hit, reads cached JSON and skips the network.
2. If no cache, calls `axiosInstance.get('/verses/by_chapter/{id}?...')` against the Quran.com API with `mushaf: 2` (Hafs) and `word_fields: '...,code_v1,code_v2,qpc_uthmani_hafs,uthmani_tajweed,location,page_number'`.
3. Regroups verses by `page_number` into `IChapterVerses` objects (one per Mushaf page), then calls `usePageLineController._renderVersesNewForm` to regroup words of each page into visual lines.
4. Persists the resulting `chapterVerses` array to local storage as JSON.
5. Collects distinct `page_number`s in the chapter/juz and calls `downoladThePageFont` for each in parallel.

### 2.3 Font loading

[src/hooks/controllers/usePageFontFileController.ts](src/hooks/controllers/usePageFontFileController.ts) is the only font code.

```ts
// Build "QCF_P001"…"QCF_P604" from a page number
const _fontFileFormatGenerator = (page) => `QCF_P${String(page).padStart(3, "0")}`;

const downoladThePageFont = async (page, onLoaded, quranFontApi) => {
  const targetFont = _fontFileFormatGenerator(page);
  const url  = `${quranFontApi}${targetFont}.TTF`;
  const path = `${RNFS.DocumentDirectoryPath}/${targetFont}.ttf`;
  if (await isFileExists(path)) return loadFontFamily(path, targetFont, onLoaded);
  return RNFS.downloadFile({ fromUrl: url, toFile: path, background: true, discretionary: true })
    .promise.then(res => loadFontFamily(path, targetFont, onLoaded));
};

const loadFontFamily = async (filePath, targetFont, onLoaded) => {
  const base64 = await RNFS.readFile(filePath, "base64");
  return loadFont(targetFont, base64, "ttf").then(name => { onLoaded(); return name; });
};
```

Key properties:

- **The font family name registered with iOS/Android = the page number** (`QCF_P001` … `QCF_P604`). This is the only string the renderer needs.
- **Base64 round-trip** is forced by `react-native-dynamic-fonts`. There is no `Font.loadAsync`-style path here.
- **No native auto-link for pages 2–604.** They live in `DocumentDirectoryPath` and are registered at runtime.
- **Whole-chapter preload**, not per-page lazy load. The package shows a `<Loader />` with a download progress bar until all pages of the current chapter are downloaded (Al-Baqarah = ~48 pages of .ttf).
- **A 500 ms `setTimeout`** is applied after `Promise.all(promises)` in `useGetChapterByPage.handleFontLoad` to give RN a tick to register the fonts before the loader hides. This is a real workaround; without it, the first frame shows tofu boxes.

### 2.4 Page rendering

[src/components/lists/verseLinesWordsList.tsx](src/components/lists/verseLinesWordsList.tsx) is the only place Mushaf text is drawn:

```tsx
<View style={{
  flexDirection: I18nManager.isRTL ? "row" : "row-reverse",
  justifyContent: isCentered ? undefined : "space-between",
  alignItems: "center",
  width: "85%",
  alignSelf: "center",
}}>
  {item.words.map(innerItem => (
    <TouchableOpacity onPress={…}>
      <Text adjustsFontSizeToFit
            style={{ fontFamily: _fontFileFormatGenerator(innerItem.page_number),
                     fontSize: isCentered ? 35 : RFValue(16),
                     backgroundColor: isWordVerseSelected ? selectionColor : "transparent" }}>
        {innerItem.code_v1}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

The geometry is **not** computed. The `Text` is a glyph switch — it emits a string of private-use codepoints (`code_v1`) into a font that already contains the pre-laid-out glyph for that word on that page. `width: 85%` + `space-between` distributes the words across the page width; the font's bitmap shapes carry tashkeel, ligatures, and 15-line layout.

[src/components/lists/pageVersesList.tsx](src/components/lists/pageVersesList.tsx) wraps each line in:

```tsx
<View style={{ flex: pageLinesCount && pageLinesCount >= 10 ? 1 : 0 }}>
  <VerseLinesWordsList ... />
</View>
```

That `flex: 1` (only for 10+ line pages) is what spreads 15 lines across the page height; 8–10 line pages opt out and let the lines size to content.

Page chrome:
- `<ImageBackground source={IMAGES.mushafFrame}>` covers the full `Dimensions.window.width`.
- Surah header on the first line of each chapter (frame image + QCF_BSML chapter `code_v1` glyph).
- Basmala on the first line of every chapter **except** Al-Fatiha (1:1 *is* the Basmala) and At-Tawba (no Basmala at 9:1).
- Page-number circle absolutely positioned at bottom center; juz label and chapter glyph at the top row, `space-between`.

Navigation: [src/layouts/quranPageLayout.tsx](src/layouts/quranPageLayout.tsx) is a horizontal `pagingEnabled` `FlatList` of `PageVersesList` items, one per Mushaf page in the current chapter/juz. `I18nManager.forceRTL(false)` is set in [App.tsx](App.tsx) so the carousel scrolls LTR; RTL reading order is achieved per-view with `flexDirection: "row-reverse"`.

### 2.5 Why it works on RN

- **One private-use codepoint per word → no shaping, no bidi, no line-breaking.** RN's `Text` never has to measure Arabic.
- **No layout work in JS.** A line is a flex row; the per-word widths are determined entirely by the font.
- **Tap detection is positional**, not textual: `event.nativeEvent.pageY/pageX` plus the selected verse metadata. The audio/options menu opens at that pixel position.
- **No WebView, no SVG, no Skia.** Just `View` + `Text` + `TouchableOpacity`.

### 2.6 Gotchas to be aware of

- `react-native-dynamic-fonts` is old, lightly maintained, and forces a base64 read of the .ttf. It works on iOS and Android but the 500 ms wait is mandatory.
- The whole-chapter preload blocks the UI; there is no lazy load between pages inside a chapter.
- The font-cache directory is never evicted; long-term use accumulates .ttf files.
- `mushaf: 2` in the API params is the only Mushaf variant handled. Switching to Warsh would mean swapping the entire QCF font set; the `code_v1` codepoints would be different.
- The renderer emits glyph strings, not Arabic text. Selection, search, and copy-paste of verse text is **not** trivially supported — the displayed glyph is a private-use codepoint. (This is an important constraint for the open-quran-view redesign, where Arabic text rendering and searchability are part of the value proposition.)

---

## 3. Current state: the `rn-view` branch in `open-quran-view` (the dead end)

The branch is on top of `develop` (v0.6.1). It added 10 commits between `d1d5d36` and `f790842`, version bumped to 0.7.0. Major files added:

```
src/view/rn/index.tsx                   (353 lines)
src/view/rn/line.tsx                    (314 lines)
src/view/rn/word.tsx                    (132 lines)
src/view/rn/navigation-controls.tsx     (235 lines)
src/view/rn/hooks/use-page-data.ts      (51  lines)
src/view/rn/hooks/use-fonts.ts          (64  lines)
src/core/font-loader.rn.ts              (expo-font Font.loadAsync surface)
src/core/index.rn.ts                    (RN-safe core barrel)
src/core/static/data.rn.ts              (per-page JSON require() thunks)
src/core/static/fonts.rn.ts             (1 235 lines of require() thunks for hafs-v2 + hafs-v4)
playground/rn-expo/                     (Expo SDK 53 app)
tsup.config.ts                          (esbuildOptions.conditions = ["browser", ...]; ignoreWatch **/*.rn.ts; onSuccess removes .rn.ts from dist)
```

`surah-name-v4.ttf` replaces `surah-name-v4.woff2` (WOFF2 is not supported by RN).

### 3.1 Design choices that are different from the reference

| Concern | `react-native-quran-hafs` | `open-quran-view` (rn-view branch) |
|---|---|---|
| QCF format | v1 (page-keyed, layout painted by font) | **v2** (word-indexed, layout computed) |
| Page data | Quran.com API at runtime, cached per chapter | **Static JSON** bundled per page (built once by `scripts/generate-static-data.ts`) |
| Page fonts | Downloaded per page from `QURAN_FONTS_API` | **Bundled** as native assets via Metro `require()` thunks |
| Font load API | `react-native-dynamic-fonts.loadFont` (base64) | **`expo-font.Font.loadAsync`** (peer dep) |
| Layout engine | None — flex row + `space-between` | **`createLayoutCalculator`** computes `x/y/width/height` per word |
| Frame chrome | `ImageBackground` (mushaf frame image) | None — bare `<View>` with theme background |
| Pagination | Horizontal `FlatList` of pages | **Single page**, with internal `currentPage` state + prev/next/goTo controls |
| Verse highlight | Background color on selected `<Text>` | Per-word `onLayout` measurement → computed overlay rect |
| Layouts supported | 1 (Hafs) | 3 (`hafs-v2`, `hafs-v4`, `hafs-unicode`) |
| Page geometry | `flex: 1` per line container (10+ line pages) | 15-line Mushaf computed from `pageHeight / 15`; scales down if content > available height |

### 3.2 The three places where the design breaks

These are the rough edges that make the branch a "dead end":

**(a) Per-word onLayout measurement cascade.** `Line` measures every word's `x` and `width` via `<Pressable onLayout>` and pushes it into a `Map<index, {x, width}>`. The highlighted-verse overlay is computed from these measurements. The React tree is a per-line `position: 'absolute'` container with the row laid out by `flexDirection: 'row-reverse'`. On RN, `onLayout` fires asynchronously, after the first paint. The first frame shows no overlay; the overlay only appears after all words on the line have reported their measurement. This is fragile on Android in particular (text measurement drift) and causes the overlay to flicker on page turn. Word positions in the layout calculator are computed analytically; the React tree re-measures them anyway, and the two sources of truth can disagree.

**(b) Font loading with sequential `loadFont → loadBismillahFont → loadSurahNameFont`.** `use-fonts.ts` does three `await`ed `Font.loadAsync` calls in series per page change. On a fresh page the user sees a `<ActivityIndicator />` until all three resolve. There's no dedup guard at the hook level (`font-loader.rn.ts` has a module-level `loadedFonts: Set<string>`, so re-loading a font that is already registered is a no-op — good — but the per-hook loading state still resets to `ready: false` on every page change, even when the only thing that changed is which per-page QCF font is needed).

**(c) `staticFonts[layout][page]` as a 1 235-line literal object.** Every `require()` thunk for every page of every layout is statically declared in `src/core/static/fonts.rn.ts`. This works, but:

- It bloats the JS bundle (the `require` calls are static; the .ttf themselves are loaded lazily by Metro, but the map cannot be tree-shaken).
- The 1812-entry map duplicates the directory layout. A typo in a filename is a runtime error.
- There's no equivalent for `hafs-unicode` (which uses auto-linked DigitalKhatt / AyatQuran), so the loader has to special-case the layout in two places.

### 3.3 What is solid in the rn-view branch (worth keeping)

- The `createLayoutCalculator` ([src/core/layout-calculator.ts](src/core/layout-calculator.ts)) is platform-agnostic and a real implementation of "Mushaf geometry in JS." The 15-line, 5%-padding, font-size-as-min-of-height-vs-width fit, and centered-page handling are all correct.
- The per-page `require()` thunk approach for fonts and data is the right way to make Metro bundle lazily. The *implementation* of it (a giant literal map) is the problem, not the pattern.
- `usePageData` is clean and includes a proper cancellation ref for stale requests.
- The `useWindowDimensions` + `onLayout` dual sizing logic in [src/view/rn/index.tsx](src/view/rn/index.tsx) handles ratio/width/height/fit props correctly and observes the actual container size.
- The `index.rn.ts` / `index.ts` split (so the RN bundle can avoid `import.meta.url`) and the tsup config that strips `.rn.ts` from the web `dist/` are correct build hygiene.
- The Expo SDK 53 playground is set up; that's the validation harness.

### 3.4 What's missing

- No horizontal page carousel. `index.tsx` is a single-page viewer with prev/next/goTo controls. The reference uses a `pagingEnabled` `FlatList` to swipe between pages, which is a much better UX.
- No `I18nManager` handling. The `row-reverse` is unconditional. This is fine for the current `forceRTL(false)` setup but not robust.
- No accessibility wiring (the `accessibilityRole`/`accessibilityLabel` on `<Pressable>` is there but the role is just "button" — no Quran/verse semantics).
- No error UI; errors are silently surfaced by the absence of `onLoad`.
- No `AppState` / network change handling; if a page font fails to load, the hook stays in `ready: false` forever.

---

## 4. Patterns to borrow, patterns to leave behind

### Borrow from `react-native-quran-hafs`

1. **Paging model.** Switch from the single-page + controls to a horizontal `pagingEnabled` `FlatList` (or `ScrollView` with snap) of `PageVersesList` items. This is the right primitive for swiping through a Mushaf and matches user expectations.
2. **Font family name = the discriminator.** Keep registering each per-page font under a stable, page-derived name (e.g. `QuranFont-hafs-v2-p42`). This is the cleanest way to let `<Text style={{fontFamily}}>` do the work without manual glyph insertion.
3. **`BackgroundImage` for the mushaf frame.** The reference uses `IMAGES.mushafFrame` for the page chrome; you don't currently have any frame image, which is why your page reads as a blank `<View>`. A frame image is the simplest way to get a Madinah-Mushaf look without painting the border in code.
4. **Position-based selection + open menu at tap location.** The reference stores `pageX/pageY` on the selected verse and positions the options/audio modal at that point. This sidesteps the need for the per-word `onLayout` cascade.
5. **The `flex: 1` per-line spread for 10+ line pages.** Your `createLayoutCalculator` already produces `y/height` per line; the per-line `<View>` doesn't need `flex: 1` (you're absolutely positioning them already), but if you ever relax to a flex layout for 15-line pages, the reference's pattern works.
6. **`forceRTL(false)` + per-view `row-reverse`.** Matches what the reference does. Don't try to use RN's RTL support for the page itself; it gets confused by the mushaf frame's LTR numbering.
7. **The 500 ms wait after font promises.** Even with `Font.loadAsync` you may need a tick to let the native font registry catch up before the first paint; observe whether this is needed in your setup and add a small `setTimeout(0)` if you see tofu on the first frame.

### Deliberately do not borrow

1. **QCF v1 / page-keyed layout / `code_v1` glyph strings.** This is the deepest difference. The v1 approach makes selection, search, and accessibility hard because the displayed text is private-use codepoints, not Arabic. The whole point of `open-quran-view` is real Arabic text + real Unicode font (DigitalKhatt for `hafs-unicode`, QCF v2 glyphs for `hafs-v2`/`hafs-v4`). Stay on v2.
2. **Runtime API + cache.** Your design bundles page data and fonts as build-time artifacts. This is better for offline-first and matches your existing web pipeline (`scripts/generate-static-data.ts` + `scripts/generate-static-fonts.ts`). Don't add a runtime API.
3. **`react-native-dynamic-fonts` / base64 round-trip.** Use `expo-font`'s `Font.loadAsync` against Metro-resolved assets, which is what the rn-view branch already does. Better primitive, no base64 cost.
4. **The "force a private-use codepoint as text" approach.** Your `Word` component renders `word.text || `[${word.id}]``; that's the right pattern for v2 (real glyph, real layout). Don't change to `code_v1` strings.
5. **Whole-chapter font preload.** The reference downloads every page font for the chapter before showing the first page. Your per-page `require()` thunk + per-page `Font.loadAsync` is strictly better — a page is loaded only when navigated to, and Metro only bundles the assets visited. Keep the per-page lazy model.
6. **Flat 604-file require() literal.** Replace with a generated `Map<page, () => require>` that is *itself* generated by the build script (`scripts/generate-static-fonts.ts`) so the literal doesn't have to be hand-maintained.

### Concrete diff: what the redesign should look like

| File | Action | Notes |
|---|---|---|
| `src/view/rn/index.tsx` | Rewrite | Replace single-page model with horizontal `FlatList` of `PageListItem`. Move container-size / ratio / fit logic into a shared hook. |
| `src/view/rn/page-list-item.tsx` (new) | New | One Mushaf page: frame image + `<View>` per line + `<Word>` per word. Holds the line list. |
| `src/view/rn/line.tsx` | Refactor | Drop the per-word `onLayout` cascade. Use `createLayoutCalculator`-derived `y/height` for the line; render the words in a single flex row. Selection highlight is a single absolutely-positioned rect whose coordinates come from the layout calculator, not from a measurement map. |
| `src/view/rn/word.tsx` | Keep | Already correct: `<Pressable>` + `<Text numberOfLines={1} allowFontScaling={false}>` with the page's `fontFamily` and `word.text`. |
| `src/view/rn/hooks/use-page-data.ts` | Keep | Cancellation ref is right; only call when the page becomes the active item in the FlatList. |
| `src/view/rn/hooks/use-fonts.ts` | Tweak | Compute the needed font families up front (QuranFont for the page, BismillahFont, SurahNameFont). Skip already-loaded families. Trigger when the FlatList page is near-visible, not on mount. |
| `src/core/font-loader.rn.ts` | Keep core; add `getRequiredFamilies(layout, page)` | Returns the list of families a page needs so the hook can dedupe. |
| `src/core/static/fonts.rn.ts` | **Generate**, don't hand-write | Have `scripts/generate-static-fonts.ts` emit this file from the directory listing of `src/data/fonts/{layout}/`. Eliminates the 1 235-line literal. |
| `src/core/static/data.rn.ts` | Same | Generated from `src/data/pages/{layout}/`. |
| `tsup.config.ts` | Keep | The `**/*.rn.ts` strip-from-dist logic is correct. |
| `playground/rn-expo/` | Keep | Validation harness is fine. |
| `playground/rn-expo/assets/` | Add `mushaf-frame.png` | A Madinah-Mushaf page border image. Replace the bare `<View style={{backgroundColor}}>` in `page-list-item.tsx`. |
| `package.json` (peer deps) | Confirm `expo-font` | Already there. |

### Open questions to resolve before the redesign

1. **Where does the page frame image come from?** A Madinah-Mushaf frame is non-trivial (ornamental border + page-number badge + juz badge positions). Reuse the existing image from the reference, or generate one.
2. **What's the relationship between `hafs-v2` and `hafs-v4` on RN?** Currently both go through the same `useFonts` + `getFontAsset` path with different `layout` keys. The branch's data already has both; confirm the v4 page fonts are also in `src/data/fonts/hafs-v4/` (yes, the `develop..rn-view` diff shows 604 new `hafs-v4/p*.json` files; check that the corresponding `.ttf`s are there too).
3. **Single `<OpenQuranView>` or list-of-pages as a top-level export?** The reference exposes a single page carousel and the parent component decides what to render. The current `index.tsx` is a single page with internal navigation. Decide which shape the API contract should have. Recommendation: keep the single-page model but make the page index a controlled prop, so the consumer can wrap it in a `FlatList` or `ScrollView` themselves if they want swiping.
4. **Are the per-page fonts auto-linked or runtime-loaded?** Currently the rn-view branch auto-links only the "small always-needed" fonts (DigitalKhatt, AyatQuran, SurahName) via `react-native.config.js` and bundles the per-page QCF fonts as Metro `require()` assets (NOT auto-linked). Confirm this with a `npx react-native config` and a Metro build of the playground.

---

## 5. Recommended path forward

Three phases. Each is independently shippable.

**Phase 1 — Stop the bleeding.** Delete or `git revert` the broken parts of the `rn-view` branch; keep the solid pieces (`layout-calculator.ts`, `usePageData`, the `index.tsx` / `index.rn.ts` split, the tsup config, the Expo playground). Bump back to v0.7.0-rc.1 or freeze `develop` as v0.6.1.

**Phase 2 — Generate, don't hand-write.** Make `scripts/generate-static-fonts.ts` and `scripts/generate-static-data.ts` emit `src/core/static/{fonts,data}.rn.ts` as generated artifacts. Add them to `.gitignore` (or to a `generated/` subfolder with a clear header). This removes the 1 235-line literal and makes adding a new layout a one-line config change.

**Phase 3 — Redo `src/view/rn/`.** Adopt the reference's page-carousel model + the layout calculator. Add a `mushaf-frame.png` to the Expo playground's assets. Wire `useFonts` to load only the families needed for the current page, with a `Set<string>` dedup guard at the hook level. Add a `AppState` listener to retry failed font loads on `active`. Add a `Switch` in the playground for `hafs-v2` / `hafs-v4` / `hafs-unicode` so all three layouts can be visually validated side-by-side.

**Verification harness.** `playground/rn-expo/` running on Expo SDK 53 with `expo prebuild` + `npx expo run:ios` / `npx expo run:android`. Manual test plan:

- Page 1 Al-Fatiha loads in V2, V4, and Unicode.
- Swipe left/right through pages 1–20, watch for tofu on the first frame after each swipe.
- Tap a word; options modal opens at the tap location (not at a stale position).
- Toggle dark theme; verify text/background contrast.
- Disable network; navigate; pages should still load (everything is bundled).
- Cold start; verify the initial page renders without an `<ActivityIndicator>` flash for fonts that are already linked.

If all six pass, the rn-view branch is no longer a dead end and the `@open-quran-view/view/rn` export is real.

---

## Appendix A — File index (for the implementer)

Reference (read-only):
- `D:\benyahia-dev\react-native-quran-hafs\App.tsx`
- `D:\benyahia-dev\react-native-quran-hafs\src\layouts\quranPageLayout.tsx`
- `D:\benyahia-dev\react-native-quran-hafs\src\components\lists\pageVersesList.tsx`
- `D:\benyahia-dev\react-native-quran-hafs\src\components\lists\verseLinesWordsList.tsx`
- `D:\benyahia-dev\react-native-quran-hafs\src\hooks\controllers\usePageFontFileController.ts`
- `D:\benyahia-dev\react-native-quran-hafs\src\hooks\apis\useGetChapterByPage.ts`
- `D:\benyahia-dev\react-native-quran-hafs\src\common\constants.ts`
- `D:\benyahia-dev\react-native-quran-hafs\react-native.config.js`

Target (to be redesigned):
- `D:\benyahia-dev\open-quran-view\src\view\rn\index.tsx` — rewrite as a page carousel
- `D:\benyahia-dev\open-quran-view\src\view\rn\line.tsx` — drop onLayout cascade; rely on layout calculator
- `D:\benyahia-dev\open-quran-view\src\view\rn\word.tsx` — keep as-is
- `D:\benyahia-dev\open-quran-view\src\view\rn\hooks\use-page-data.ts` — keep; integrate with FlatList `onViewableItemsChanged`
- `D:\benyahia-dev\open-quran-view\src\view\rn\hooks\use-fonts.ts` — dedup at hook level
- `D:\benyahia-dev\open-quran-view\src\core\font-loader.rn.ts` — add `getRequiredFamilies(layout, page)` helper
- `D:\benyahia-dev\open-quran-view\src\core\layout-calculator.ts` — keep (the math is correct)
- `D:\benyahia-dev\open-quran-view\src\core\index.rn.ts` — keep
- `D:\benyahia-dev\open-quran-view\src\core\static\fonts.rn.ts` — make generated
- `D:\benyahia-dev\open-quran-view\src\core\static\data.rn.ts` — make generated
- `D:\benyahia-dev\open-quran-view\scripts\generate-static-fonts.ts` — extend to emit `.rn.ts`
- `D:\benyahia-dev\open-quran-view\scripts\generate-static-data.ts` — extend to emit `.rn.ts`
- `D:\benyahia-dev\open-quran-view\playground\rn-expo\` — keep; add mushaf-frame image; add layout switcher
- `D:\benyahia-dev\open-quran-view\tsup.config.ts` — keep

Prior plan: [artifacts/2026-06-03-rn-view-plan.md](2026-06-03-rn-view-plan.md)
