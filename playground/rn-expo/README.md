# React Native Expo Example

This is a complete example app demonstrating the `OpenQuranView` React Native component using Expo.

## Quick Start

```bash
cd playground/rn-expo
npm install
npm start
```

Then choose your platform:

- Press `i` for iOS
- Press `a` for Android
- Press `w` for web

## Features Demonstrated

- **Page Navigation**: Navigate through all 604 pages
- **Theme Switching**: Toggle between light and dark themes
- **Layout Selection**: Switch between hafs-v2, hafs-v4, and hafs-unicode layouts
- **Word Interaction**: Tap words to see details
- **Gesture Support**: Pinch-to-zoom and swipe navigation

## Project Structure

```
playground/rn-expo/
├── app/
│   └── index.tsx           # Main app screen
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## Dependencies

- **Expo 51.0+**: Development platform
- **React Native 0.74+**: Mobile framework
- **@shopify/react-native-skia**: Canvas rendering
- **open-quran-view**: The main library

## API Usage

```tsx
import { OpenQuranView } from "open-quran-view/view/rn";

<OpenQuranView
  page={1}
  width={350}
  height={500}
  theme="light"
  mushafLayout="hafs-v2"
  onPageChange={(page) => console.log("Page:", page)}
  onWordClick={(word) => console.log("Word tapped:", word)}
  onLoad={(layout) => console.log("Layout loaded")}
  enableZoom={true}
  enableSwipe={true}
/>;
```

## Troubleshooting

### Build Issues

Clear the cache and rebuild:

```bash
npx expo prebuild --clean
npm start
```

### Glyph Data Not Loading

Ensure the main library is built:

```bash
cd ..
yarn build
npm install
```
