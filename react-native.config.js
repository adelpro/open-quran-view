/**
 * react-native.config.js
 *
 * React Native asset auto-linking. The three always-needed Unicode fonts are
 * linked into the consumer app's native bundle (iOS Info.plist, Android
 * assets) automatically when the consumer runs `npx react-native-asset` or
 * the standard Expo prebuild step.
 *
 * Note: the 1,208 per-page QCF v2/v4 fonts are NOT auto-linked — they are
 * loaded lazily at runtime via expo-font's `Font.loadAsync` from the static
 * `require()` thunks in src/core/static/fonts.rn.ts. Auto-linking 1,208
 * assets would balloon the install size by ~50 MB on every device.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: [
    "./src/data/fonts/hafs-unicode/digitalkhatt.otf",
    "./src/data/fonts/hafs-unicode/AyatQuran2-PVKGm.ttf",
    "./src/data/shared/surah-name-v4.ttf",
  ],
};
