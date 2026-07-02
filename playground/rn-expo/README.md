# rn-expo playground

React Native (Expo) playground for `open-quran-view/view/rn`.

Renders one Mushaf page (Al-Fatiha, page 1) using the QCF v2 font family.
The full asset pipeline (page JSONs, per-page TTFs, surah-name TTF,
DigitalKhatt OTF, AyatQuran TTF) is bundled — disable network and the
app still renders.

## Run

```bash
# From the repo root
yarn install
yarn build              # rebuilds the library + copies dist/data
cd playground/rn-expo
npx expo prebuild --clean
yarn start
# in another terminal
yarn android   # or yarn ios
```

## What to look for

- **Page 1 (Al-Fatiha) renders** within ~2 s with all 7 lines, tashkeel
  correct, no tofu.
- **Tap a word** — selection highlight appears at the tap position.
- **Switch `mushafLayout` to `"hafs-v2"` or `"hafs-v4"`** in `App.tsx` —
  re-render, verify the QCF V2 / V4 (Tajweed) glyphs match.

## Default `mushafLayout`: `hafs-unicode`

`App.tsx` defaults to `mushafLayout="hafs-unicode"` for fast cold-start:
the KFGQPC Uthmanic Hafs layout uses a single TTF (DigitalKhatt) plus a
marker TTF (AyatQuran), so Expo Go downloads only 2 fonts + 1 surah-name
font on first launch and the bundle stays tiny.

The other layouts (`hafs-v2`, `hafs-v4`) ship as **604 per-page TTFs**
from the Quran Foundation API — that's how QCF glyphs are designed (one
PUA glyph set per page). The dynamic `forPage()` loader keeps only the
TTF for the currently rendered page in the bundle, but Metro still has
to resolve a require at runtime for the page number you render, which
means a small additional download per navigation. Change
`mushafLayout` in `App.tsx` to switch:

```tsx
// pixel-perfect Madinah Mushaf rendering (QCF V2 glyphs, 604 per-page TTFs)
<OpenQuranViewRN page={1} theme="light" mushafLayout="hafs-v2" />

// Tajweed-colored Madinah Mushaf (QCF V4 COLRv1, 604 per-page TTFs)
<OpenQuranViewRN page={1} theme="light" mushafLayout="hafs-v4" />

// single-font Unicode Arabic (KFGQPC Uthmanic Hafs, default)
<OpenQuranViewRN page={1} theme="light" mushafLayout="hafs-unicode" />
```

See [docs/guides/font-loading.md](../../docs/guides/font-loading.md) for
the full rationale on per-page vs. single-file fonts.

## Files

- `App.tsx` — entry. Renders `<OpenQuranViewRN page={1} />`.
- `app.json` — Expo config; `expo-font` plugin registers the three
  always-loaded fonts (DigitalKhatt, AyatQuran, SurahName). Per-page
  QCF v2/v4 fonts are loaded at runtime via `Font.loadAsync` from
  `dist/data/fonts/hafs-{v2,v4}-ttf/`.
- `metro.config.js` — workspace symlink resolution; adds `rn.ts` /
  `rn.tsx` to `sourceExts` so Metro picks up the platform-agnostic
  source files that tsup externalizes.
- `tsconfig.json` — strict mode, Expo base config, plus a `paths`
  mapping for the `open-quran-view/*` import in TS.
- `index.ts` — registers App as the root component.
