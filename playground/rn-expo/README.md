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
- **Switch `mushafLayout` to `"hafs-v4"` or `"hafs-unicode"`** in
  `App.tsx` — re-render, verify the v4 / DigitalKhatt glyphs match.

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
