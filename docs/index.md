# Open Quran View Documentation

High-performance universal Quran rendering library using Quran Foundation API.
  
## Overview

`open-quran-view` provides React and Web Component views for rendering Quran pages with high fidelity.

## Documentation Structure

```
docs/
├── index.md                    # This file
├── api/
│   └── views.md               # Views module API reference
├── architecture/
│   ├── open-quran-view-journey.md  # From idea to production story
│   ├── data-structure.md      # Data structures & file formats
│   └── static-assets.md       # Static assets architecture (v0.2.0+)
└── guides/
    ├── api-integration.md     # Quran Foundation API guide
    ├── data-generation.md      # Data generation scripts
    ├── font-loading.md        # Font loading strategy (v0.2.0+)
    └── mushaf-comparison.md   # Mushaf versions comparison
```

## Quick Start

### Installation

```bash
npm install open-quran-view
```

### React Component

```tsx
import { OpenQuranView } from 'open-quran-view/view';

function App() {
  return (
    <OpenQuranView
      page={1}
      mushafLayout="hafs-v2"
      width={600}
      height={850}
      onWordClick={(word) => console.log(word)}
    />
  );
}
```

### Web Component

```html
<script type="module">
  import { registerOpenQuranView } from 'open-quran-view/view/web';
  registerOpenQuranView();
</script>

<open-quran-view
  page="1"
  mushaf-layout="hafs-v2"
  width="600"
  height="850"
></open-quran-view>
```

## Features

- **Quran Foundation API** - Uses Quran Foundation API for platform-agnostic data.
- **Universal Views** - React component and Vanilla Web Component with consistent API.
- **TypeScript First** - Built with TypeScript for a robust development experience.
- **Static Assets System** - Pre-generated URLs for reliable font and data loading (v0.2.0+).
- **Multiple Mushaf Layouts** - Support for hafs-v2, hafs-v4, and hafs-unicode layouts.

## Project Structure

```
open-quran-view/
├── src/
│   ├── core/               # Platform-agnostic core logic
│   │   ├── static/         # Generated static asset URLs (v0.2.0+)
│   │   ├── data-loader.ts  # Data loading with caching
│   │   ├── font-loader.ts  # Font loading utilities
│   │   └── lookup.ts       # Navigation & verse lookup
│   ├── view/
│   │   ├── react/          # React component
│   │   └── web/            # Web Component
│   └── data/               # Quran Foundation API data assets (generated)
├── docs/                   # Documentation
│   ├── api/                # API reference
│   ├── architecture/       # Architecture docs
│   └── guides/            # How-to guides
├── scripts/                # Data generation scripts
├── playground/             # Development playgrounds
└── dist/                   # Build output
```

## Scripts

| Script | Description |
|--------|-------------|
| `yarn generate:all` | Generate all data (metadata, pages, fonts, static assets) |
| `yarn generate:pages` | Generate page data from Quran Foundation API |
| `yarn generate:metadata` | Generate surah and juz metadata |
| `yarn generate:fonts` | Download fonts from verses.quran.foundation |
| `yarn generate:static:fonts` | Generate static font URLs |
| `yarn generate:static:data` | Generate static data URLs |
| `yarn generate:static` | Generate both static fonts and data URLs |
| `yarn build` | Build the package |
| `yarn prepare` | Auto-generate + build on install |

See [Static Assets Architecture](architecture/static-assets.md) for details.

## Related

- [Open Quran View Journey](architecture/open-quran-view-journey.md) - The complete story from local files to Quran Foundation API
- [Views API](api/views.md) - Detailed API reference for React and Web Component
- [Data Structure](architecture/data-structure.md) - Data formats and file structures
- [Static Assets](architecture/static-assets.md) - Font and data URL generation (v0.2.0+)
- [Font Loading Guide](guides/font-loading.md) - Font loading strategy (v0.2.0+)
- [API Integration](guides/api-integration.md) - Quran Foundation API details
- [Data Generation](guides/data-generation.md) - Script usage and examples
- [Mushaf Comparison](guides/mushaf-comparison.md) - Choosing the right Mushaf layout
- [CHANGELOG](../CHANGELOG.md) - Version history
