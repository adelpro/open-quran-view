# Simple Integration Guide

This guide describes how to quickly get started with `open-quran-view` using standard React components or Vanilla Web Components. 

---

## 📦 Installation

To use `open-quran-view` in your project, install it via NPM, Yarn, or PNPM:

```bash
# Using NPM
npm install open-quran-view

# Using Yarn
yarn add open-quran-view

# Using PNPM
pnpm add open-quran-view
```

---

## ⚛️ React Integration

The easiest way to render a Quran page in a React application is by importing the `OpenQuranView` component.

### Basic Implementation

Here is a minimal React component that renders page 1 (Surah Al-Fatiha) using the `hafs-v2` layout:

```tsx
import React, { useState } from 'react';
import { OpenQuranView } from 'open-quran-view/view';

export default function QuranReader() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of 604</span>
        <button onClick={() => setCurrentPage(p => Math.min(604, p + 1))} disabled={currentPage === 604}>
          Next
        </button>
      </div>

      {/* Quran Viewer Component */}
      <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <OpenQuranView
          page={currentPage}
          mushafLayout="hafs-v2"
          width={450}
          height={650}
          theme="light"
          onPageChange={(page) => setCurrentPage(page)}
          onWordClick={(word) => console.log('Word Clicked:', word)}
        />
      </div>
    </div>
  );
}
```

### Essential React Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `page` | `number` | `1` | Page number to display (1 to 604). |
| `mushafLayout` | `"hafs-v2" \| "hafs-v4" \| "hafs-unicode"` | `"hafs-v2"` | Layout design style. |
| `theme` | `"light" \| "dark"` | `"light"` | Visual color mode. |
| `width` | `number` | `600` | Canvas layout width in pixels. |
| `height` | `number` | `850` | Canvas layout height in pixels. |
| `onPageChange` | `(page: number) => void` | - | Callback when page navigation is triggered inside the viewer. |
| `onWordClick` | `(word: WordInfo) => void` | - | Callback triggered when a single word is clicked. |

---

## 🌐 Vanilla Web Component Integration

If you are using Vanilla JavaScript, HTML, or another framework (like Vue, Angular, or Svelte), you can integrate `open-quran-view` as a native Custom Element (Web Component).

### Basic Implementation

1. Register the custom element in your JavaScript entrypoint:
   ```javascript
   import { registerOpenQuranView } from 'open-quran-view/view/web';
   registerOpenQuranView();
   ```

2. Add the custom element directly to your HTML markup:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <title>Quran Web Component Reader</title>
   </head>
   <body>
     
     <div class="reader-container">
       <button id="prevBtn">Previous</button>
       <button id="nextBtn">Next</button>
       
       <open-quran-view 
         id="quranViewer" 
         page="1" 
         mushaf-layout="hafs-v2" 
         width="450" 
         height="650" 
         theme="light">
       </open-quran-view>
     </div>

     <script type="module">
       import { registerOpenQuranView } from 'open-quran-view/view/web';
       registerOpenQuranView();

       const viewer = document.getElementById('quranViewer');
       const prevBtn = document.getElementById('prevBtn');
       const nextBtn = document.getElementById('nextBtn');

       // Attribute and Event handling
       prevBtn.addEventListener('click', () => {
         const current = parseInt(viewer.getAttribute('page'), 10);
         if (current > 1) viewer.setAttribute('page', String(current - 1));
       });

       nextBtn.addEventListener('click', () => {
         const current = parseInt(viewer.getAttribute('page'), 10);
         if (current < 604) viewer.setAttribute('page', String(current + 1));
       });

       // Listen for word click events
       viewer.addEventListener('wordclick', (event) => {
         console.log('Word Clicked (Web Component):', event.detail);
       });

       // Listen for internal page change triggers
       viewer.addEventListener('pagechange', (event) => {
         console.log('Page Changed:', event.detail.page);
       });
     </script>
   </body>
   </html>
   ```

---

## 🎨 Theme Support

The component offers built-in dark and light modes, swapping background textures and text coloring to ensure high readability under different lighting conditions.

```tsx
// React dark mode toggle
<OpenQuranView
  page={1}
  theme={isDarkMode ? 'dark' : 'light'}
  width={500}
  height={700}
/>
```

```html
<!-- HTML Web Component dark mode -->
<open-quran-view page="1" theme="dark" width="500" height="700"></open-quran-view>
```
