# Views Module API

> Reference for `@open-quran-view/view` React and Web Component views.

## Table of Contents

1. [Export Paths](#export-paths)
2. [React View](#react-view)
3. [Web Component](#web-component)
4. [Comparison](#comparison)
5. [Type Definitions](#type-definitions)

---

## Export Paths

| Import | Target | Description |
|--------|--------|-------------|
| `@open-quran-view/view` | React component (default) | `import { OpenQuranView }` |
| `@open-quran-view/view/react` | React component (explicit) | Same as default |
| `@open-quran-view/view/web` | Web Component | `import { registerOpenQuranView }` |

---

## React View

### Basic Usage

```tsx
import { OpenQuranView } from '@open-quran-view/view';

function App() {
  return (
    <OpenQuranView
      page={1}
      mushafLayout="hafs-v2"
      width={600}
      height={850}
      theme="light"
      onPageChange={(page) => console.log('Page:', page)}
      onLoad={(layout) => console.log('Loaded:', layout)}
      onWordClick={(word) => console.log('Word:', word)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `page` | number | `1` | Page number (1-604) |
| `width` | number | _(optional)_ | Component width in pixels. If provided alone, height is derived from the mushaf ratio (unless `ratio={false}`) |
| `height` | number | _(optional)_ | Component height in pixels. If provided alone, width is derived from the mushaf ratio (unless `ratio={false}`) |
| `ratio` | `boolean \| number` | `true` | Aspect ratio behavior. `true` (default) uses mushaf ratio (0.7) to derive missing dimension. `false` fills container dimensions without ratio derivation. A number overrides the ratio value (e.g., `0.8`) |
| `fit` | `"width" \| "height"` | `"width"` | Which dimension to fill when neither `width` nor `height` is provided. `"width"` (default) fills container width and derives height. `"height"` fills container height and derives width. |
| `theme` | `"light" \| "dark"` | `"light"` | Color theme |
| `mushafLayout` | `"hafs-v2" \| "hafs-v4" \| "hafs-unicode"` | `"hafs-v2"` | Mushaf layout |
| `onPageChange` | `(page: number) => void` | - | Called when page changes |
| `onLoad` | `(layout: PageLayout) => void` | - | Called when page loads |
| `onWordClick` | `(word: WordInfo) => void` | - | Called when word is clicked |
| `highlightedWords` | `WordLocation[]` | `[]` | List of words to highlight |
| `highlightedVerse` | `{ surah: number, verse: number } \| null` | `null` | Verse to highlight (line background) |
| `wordHighlightColor` | `string` | `"rgba(255, 215, 0, 0.5)"` | Word highlight color |
| `verseHighlightColor` | `string` | `"rgba(135, 206, 250, 0.25)"` | Verse highlight color |
| `className` | string | - | CSS class for container |

### Ratio Prop Behavior

| `ratio` value | Width provided | Height provided | `fit` | Result |
|--------------|----------------|----------------|-------|--------|
| `true` (default) | no | no | `"width"` (default) | Fills container width, derives height (`width / 0.7`) |
| `true` (default) | no | no | `"height"` | Fills container height, derives width (`height * 0.7`) |
| `true` (default) | yes | no | any | Uses width, derives height (`width / 0.7`) |
| `true` (default) | no | yes | any | Uses height, derives width (`height * 0.7`) |
| `true` (default) | yes | yes | any | Uses both explicitly |
| `false` | any | any | any | No ratio derivation; uses explicit dims or container dims |
| `0.8` (number) | yes | no | any | Uses width, derives height (`width / 0.8`) |
| `0.8` (number) | no | yes | any | Uses height, derives width (`height * 0.8`) |

### Prop Validation Warnings

The component warns in development mode when props conflict:

| Conflicting Props | Warning Message |
|-------------------|-----------------|
| Both `width` & `height` with `fit` | `"fit" prop will be ignored` |
| `fit="height"` with `width` (no `height`) | `"fit="height"" is ignored, using width` |
| `fit="width"` with `height` (no `width`) | `"fit="width"" is ignored, using height` |
| `ratio={false}` with `fit` | `"fit" prop is ignored when ratio={false}` |
| `fullscreen` with `width` or `height` | Explicit dims are ignored in fullscreen |

```typescript
type WordInfo = {
  id: number;
  surahNumber?: number;
  ayahNumber?: number;
};
```

### Navigation Controls

The React view includes built-in navigation controls:
- Previous/Next page buttons
- Page number input
- Total pages indicator

---

## Web Component

### Registration

```typescript
import { registerOpenQuranView } from '@open-quran-view/view/web';

registerOpenQuranView();
```

### HTML Usage

```html
<open-quran-view
  page="1"
  mushaf-layout="hafs-v2"
  width="600"
  height="850"
  theme="light"
  ratio="true"
  fit="width"
></open-quran-view>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | string | `"1"` | Page number (1-604) |
| `mushaf-layout` | string | `"hafs-v2"` | Mushaf layout |
| `width` | string | _(optional)_ | Component width in pixels. If provided alone, height is derived from the mushaf ratio |
| `height` | string | _(optional)_ | Component height in pixels. If provided alone, width is derived from the mushaf ratio |
| `ratio` | string | `"true"` | Aspect ratio behavior. `"true"` (default) uses mushaf ratio. `"false"` disables derivation. A number (e.g., `"0.8"`) overrides the ratio |
| `fit` | string | `"width"` | Which dimension to fill when neither width nor height provided. `"width"` fills width and derives height. `"height"` fills height and derives width |
| `theme` | string | `"light"` | Color theme (`light` or `dark`) |
| `highlighted-words` | string | `undefined` | JSON string of `WordLocation[]` |
| `highlighted-verse` | string | `undefined` | JSON string of `{ surah: number, verse: number }` |
| `word-highlight-color` | string | `"rgba(255, 215, 0, 0.5)"` | Word highlight color |
| `verse-highlight-color` | string | `"rgba(135, 206, 250, 0.25)"` | Verse highlight color |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `load` | `PageLayout` | Fired when page loads |
| `pagechange` | `{ page: number }` | Fired when page changes |
| `wordclick` | `WordInfo` | Fired when a word is clicked |

```typescript
const viewer = document.querySelector('open-quran-view');
viewer.addEventListener('wordclick', (e: CustomEvent) => {
  console.log('Word clicked:', e.detail);
});
```

### JavaScript API

```typescript
const viewer = document.querySelector('open-quran-view') as OpenQuranView;

// Navigate to page
viewer.page = 10;
viewer.goToPage(10);

// Get current page
console.log(viewer.page);

// Change layout
viewer.setAttribute('mushaf-layout', 'hafs-v4');

// Change theme
viewer.setAttribute('theme', 'dark');

// Change dimensions
viewer.setAttribute('width', '800');
viewer.setAttribute('height', '1000');

// Highlighting (v0.4.0+)
viewer.wordsHighlight = [{ surah: 1, verse: 1, position: 1 }];
viewer.verseHighlight = { surah: 1, verse: 1 };
viewer.wordHighlightColorOverride = 'rgba(255, 215, 0, 0.5)';
viewer.verseHighlightColorOverride = 'rgba(135, 206, 250, 0.25)';
```

---

## Comparison

| Feature | React View | Web Component |
|---------|------------|---------------|
| Framework | React | Vanilla JS / Any |
| Bundle Size | ~18KB | ~19KB |
| Custom Styling | CSS-in-JS, classes | Shadow DOM, encapsulated |
| State Management | React hooks | Internal state |
| Event Handling | React props | Custom events |
| Accessibility | Keyboard + ARIA | Built-in |
| Theming | Prop-based | Attribute-based |

### When to Use React View

- React applications
- Need for easy integration with React ecosystem
- Want to use React hooks and context
- Prefer CSS-in-JS solutions

### When to Use Web Component

- Vanilla JS projects
- Any framework (Vue, Angular, Svelte)
- Need isolated styles (Shadow DOM)
- Want framework-agnostic component
- Need to use in static HTML

---

## Type Definitions

### React Props

```typescript
export type OpenQuranViewProps = {
  page?: number;
  width?: number;
  height?: number;
  ratio?: boolean | number;
  fit?: "width" | "height";
  theme?: "light" | "dark";
  mushafLayout?: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  onPageChange?: (page: number) => void;
  onLoad?: (layout: PageLayout) => void;
  onWordClick?: (word: WordInfo) => void;
  highlightedWords?: WordLocation[];
  highlightedVerse?: { surah: number; verse: number } | null;
  wordHighlightColor?: string;
  verseHighlightColor?: string;
  className?: string;
};

export type WordLocation = {
  surah: number;
  verse: number;
  position: number;
};
```

### Web Component Types

```typescript
export type OpenQuranViewProps = {
  page?: string;
  mushafLayout?: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  width?: string;
  height?: string;
  theme?: "light" | "dark";
};

export class OpenQuranView extends HTMLElement {
  page: number;
  mushafLayoutAttr: "hafs-v2" | "hafs-v4" | "hafs-unicode";
  wordsHighlight: WordLocation[];
  verseHighlight: { surah: number; verse: number } | null;
  wordHighlightColorOverride: string;
  verseHighlightColorOverride: string;
  goToPage(page: number): void;
}

export function registerOpenQuranView(): void;
```

---

## Dependencies

Both views depend on internal core modules:

```typescript
import {
  loadPage,
  loadFont,
  surahNumberToFontCode,
  createLayoutCalculator,
  type MushafLayout,
  type PageLayout,
} from "../../core";
```

### Internal Font Loading

Fonts are loaded using the static asset system (v0.2.0+):

```typescript
import { getFontUrl } from 'open-quran-view/core/static/fonts';

const fontUrl = getFontUrl('hafs-v2', 1);
```

See [Static Assets Architecture](../architecture/static-assets.md) for details.

---

## Project Structure

```
src/view/
├── react/
│   └── index.tsx    # OpenQuranView component
└── web/
    └── index.ts     # OpenQuranView + registerOpenQuranView
```

---

## Examples

### React with Custom Styling

```tsx
import { OpenQuranView } from '@open-quran-view/view';

function CustomQuranView() {
  return (
    <div className="quran-container">
      <OpenQuranView
        page={1}
        mushafLayout="hafs-v2"
        width={600}
        height={850}
        theme="dark"
        onWordClick={(word) => {
          console.log(`Surah ${word.surahNumber}:${word.ayahNumber}`);
        }}
        className="my-quran-view"
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  );
}
```

### Web Component in Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { registerOpenQuranView } from './dist/view/web/index.js';
    registerOpenQuranView();
  </script>
</head>
<body>
  <open-quran-view
    id="my-viewer"
    page="1"
    mushaf-layout="hafs-v2"
    width="600"
    height="850"
    theme="light"
  ></open-quran-view>

  <script>
    const viewer = document.getElementById('my-viewer');

    // Listen for word clicks
    viewer.addEventListener('wordclick', (e) => {
      console.log('Clicked:', e.detail);
    });

    // Listen for page changes
    viewer.addEventListener('pagechange', (e) => {
      console.log('Page changed to:', e.detail.page);
    });

    // Navigate after 3 seconds
    setTimeout(() => {
      viewer.page = 5;
    }, 3000);
  </script>
</body>
</html>
```

### Vue with Web Component

```vue
<template>
  <open-quran-view
    ref="viewer"
    page="1"
    mushaf-layout="hafs-v2"
    theme="light"
    @load="handleLoad"
    @wordclick="handleWordClick"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { registerOpenQuranView } from '@open-quran-view/view/web';

registerOpenQuranView();

const viewer = ref(null);

const handleLoad = (e) => {
  console.log('Layout loaded:', e.detail);
};

const handleWordClick = (e) => {
  console.log('Word:', e.detail);
};

onMounted(() => {
  viewer.value.page = 10;
});
</script>
```

---

## Theming

### Light Theme (Default)

| Element | Color |
|---------|-------|
| Background | `#fafafa` |
| Text | `#34495e` |
| Surah Name | `#2c3e50` |
| Navigation | `rgba(255,255,255,0.9)` |
| Buttons | `#667eea` |

### Dark Theme

| Element | Color |
|---------|-------|
| Background | `#1a1a2e` |
| Text | `#fff` |
| Surah Name | `#fff` |
| Navigation | `rgba(0,0,0,0.5)` |
| Buttons | `#333` |

### Custom Font

Fonts are loaded dynamically based on the `mushafLayout` prop/attribute using the static asset system:

```typescript
import { getFontUrl } from 'open-quran-view/core/static/fonts';

const fontFace = new FontFace("QuranFont", `url(${fontUrl})`);
await fontFace.load();
document.fonts.add(fontFace);
```

Fonts are managed internally based on the selected layout.

---

## Related Documentation

- [Static Assets Architecture](../architecture/static-assets.md) - Font and data URL generation
- [Data Structure](../architecture/data-structure.md) - Data formats and structures
