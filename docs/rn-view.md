# Open Quran View - React Native Implementation

This directory contains the React Native + Skia implementation of the open-quran-view library. It provides high-fidelity Quranic text rendering on mobile devices using `@shopify/react-native-skia` for hardware-accelerated canvas rendering.

## Overview

The React Native view is built with the same API as the Web/React component, making it easy for developers to use across platforms:

```tsx
import { OpenQuranView } from "open-quran-view/view/rn";

export default function QuranScreen() {
  return (
    <OpenQuranView
      page={1}
      width={350}
      height={500}
      theme="light"
      mushafLayout="hafs-v2"
      onPageChange={(page) => console.log("Page:", page)}
      onWordClick={(word) => console.log("Tapped:", word)}
    />
  );
}
```

## File Structure

```
src/view/rn/
├── index.tsx              # Main OpenQuranView component
├── page-renderer.tsx      # Skia Canvas page rendering
├── word.tsx               # Individual glyph/word component
├── glyph-loader.ts        # Glyph path data loader
├── types.ts               # TypeScript type definitions
└── index.test.ts          # Unit tests
```

## Architecture

### Data Pipeline

1. **Glyph Extraction** (`scripts/extract-glyph-paths.ts`)
   - Reads QCF binary font files using `opentype.js`
   - Extracts SVG path data for each glyph
   - Stores paths in `src/data/glyph-paths/{layout}/`
   - Run with: `yarn generate:glyph-paths`

2. **Glyph Loading** (`src/view/rn/glyph-loader.ts`)
   - Dynamically loads extracted glyph maps
   - In-memory caching for performance
   - Per-layout and per-font organization

3. **Page Rendering** (`src/view/rn/page-renderer.tsx`)
   - Uses Skia Canvas via React Native Skia
   - Positions glyphs according to layout calculator
   - Handles highlighting and interaction

### Component Hierarchy

```
OpenQuranView
├── Loads page layout data
├── Loads glyph maps
└── SkiaPageRenderer
    ├── Renders background and highlights
    └── Renders words as glyph paths
        └── SkiaWord (per glyph)
            └── Skia.Path from SVG data
```

## Props API

```typescript
type OpenQuranViewRNProps = {
  // Rendering
  page?: number; // Page number (1-604)
  width?: number; // Canvas width in pixels
  height?: number; // Canvas height in pixels
  theme?: "light" | "dark"; // Visual theme
  mushafLayout?: MushafLayout; // "hafs-v2" | "hafs-v4" | "hafs-unicode"

  // Callbacks
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: WordClickedData) => void;

  // Highlighting
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string; // rgba format
  verseHighlightColor?: string; // rgba format

  // Gestures
  enableZoom?: boolean; // Pinch-to-zoom (default: true)
  enableSwipe?: boolean; // Swipe for pagination (default: true)

  // Layout
  maintainRatio?: boolean; // Keep Mushaf aspect ratio (default: true)
  aspectRatio?: number; // Ratio to maintain (default: 0.7)
};
```

## Gesture Support

### Pinch-to-Zoom

- Two-finger pinch gesture zooms the page
- Zoom clamped between 1x and 4x
- Use `enableZoom={false}` to disable

### Swipe Navigation

- Swipe left → next page
- Swipe right → previous page
- Use `enableSwipe={false}` to disable
- Automatically clamps to valid page range (1-604)

### Pan/Scroll

- Single-finger drag when zoomed
- Auto-pans to keep content visible

## Setup & Installation

### Prerequisites

- React Native ≥ 0.79 (with new architecture)
- Expo SDK latest (or use React Native CLI)
- TypeScript 5+

### Install Dependencies

```bash
# If using Expo
npx create-expo-app@latest my-quran-app
cd my-quran-app
npx expo install @shopify/react-native-skia open-quran-view

# If using bare React Native
npm install @shopify/react-native-skia open-quran-view
```

### Generate Glyph Data

Before building, ensure glyph paths are extracted:

```bash
cd open-quran-view
yarn generate:glyph-paths
yarn build
```

### Expo Configuration

Add to `app.json`:

```json
{
  "experiments": {
    "tsconfigPaths": true
  }
}
```

## Usage Example

```tsx
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { OpenQuranView } from "open-quran-view/view/rn";

export default function QuranApp() {
  const [page, setPage] = useState(1);
  const [theme, setTheme] = useState("light");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Quran - Page {page}</Text>

      <OpenQuranView
        page={page}
        width={350}
        height={500}
        theme={theme}
        mushafLayout="hafs-v2"
        onPageChange={setPage}
        onWordClick={(word) => {
          console.log(
            `Tapped: "${word.text}" in Surah ${word.surahNumber}:${word.ayahNumber}`,
          );
        }}
        onLoad={(layout) => {
          console.log(`Loaded page with ${layout.lines.length} lines`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
```

## Testing

### Run Tests

```bash
# Run all tests including RN view
yarn test

# Run only RN view tests
yarn test src/view/rn
```

### Example App

An Expo-based example app is provided in `playground/rn-expo/`:

```bash
cd playground/rn-expo
npm install
npm start
```

Or from the root:

```bash
yarn playground:rn
```

- Page navigation
- Theme switching
- Layout selection
- Word interaction
- Gesture handling
- Real-time feedback

## Performance Considerations

1. **Glyph Caching**: Glyph maps are cached in-memory after first load
2. **Lazy Loading**: Only load glyphs for the current page
3. **Skia Hardware Acceleration**: Uses native GPU rendering
4. **Efficient Re-rendering**: Only re-render on prop changes

## Supported Mushaf Layouts

| Layout         | Description                 |
| -------------- | --------------------------- |
| `hafs-v2`      | Hafs reading, Version 2     |
| `hafs-v4`      | Hafs reading, Version 4     |
| `hafs-unicode` | Hafs reading, Unicode fonts |

All layouts support pages 1-604.

## Limitations & Future Work

### Current Limitations

- SVG path to Skia path conversion may need optimization for performance
- Word-level bounding boxes need fine-tuning for accurate tap detection
- Complex Arabic ligatures may need special handling

### Future Improvements

1. **Verse Range Highlighting**: Support highlighting multiple verses
2. **Search & Navigation**: Built-in Quran search UI
3. **Tafsir Integration**: Overlay with commentary/tafsir
4. **Animations**: Smooth page transitions and scrolling
5. **Accessibility**: Screen reader support and keyboard navigation
6. **Performance**: Further optimization of glyph rendering

## Troubleshooting

### Issue: Glyphs Not Rendering

**Solution**: Ensure glyph paths are extracted:

```bash
yarn generate:glyph-paths
yarn build
```

### Issue: Import Error `open-quran-view/view/rn`

**Solution**: Ensure package is built:

```bash
cd open-quran-view
yarn build
```

### Issue: Page Not Loading

**Solution**: Check console for errors. Common causes:

- Missing glyph data files
- Invalid page number (must be 1-604)
- Incorrect layout name

## Contributing

### Development Workflow

1. Make changes to `src/view/rn/`
2. Run tests: `yarn test`
3. Build: `yarn build`
4. Test in example app: `cd playground/rn-expo && npm start`

### Code Style

- TypeScript strict mode
- ESLint configuration in root
- Follow existing React patterns

## API Compatibility

The React Native API matches the React component API exactly:

| Property              | Web | React | RN  |
| --------------------- | --- | ----- | --- |
| `page`                | ✓   | ✓     | ✓   |
| `width`               | ✓   | ✓     | ✓   |
| `height`              | ✓   | ✓     | ✓   |
| `theme`               | ✓   | ✓     | ✓   |
| `mushafLayout`        | ✓   | ✓     | ✓   |
| `onPageChange`        | ✓   | ✓     | ✓   |
| `onLoad`              | ✓   | ✓     | ✓   |
| `onWordClick`         | ✓   | ✓     | ✓   |
| `highlightedWords`    | ✓   | ✓     | ✓   |
| `highlightedVerse`    | ✓   | ✓     | ✓   |
| `wordHighlightColor`  | ✓   | ✓     | ✓   |
| `verseHighlightColor` | ✓   | ✓     | ✓   |

## Resources

- [React Native Documentation](https://reactnative.dev)
- [@shopify/react-native-skia](https://shopify.github.io/react-native-skia)
- [Expo Documentation](https://docs.expo.dev)
- [Quran.com API](https://github.com/quran/quran.com-api)
- [QCF Font Project](https://fonts.quranjs.com)

## License

Same as open-quran-view root project (typically MIT/GPL).

## Changelog

### v0.5.1 (Initial Release)

- ✅ Skia-based glyph rendering
- ✅ Pinch-to-zoom support
- ✅ Swipe navigation
- ✅ Word-level interaction
- ✅ Light/dark themes
- ✅ Multiple layouts support
- ✅ Example Expo app

---

**Need help?** Open an issue on [GitHub](https://github.com/adelpro/open-quran-view/issues)
