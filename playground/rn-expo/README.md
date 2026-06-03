# rn-expo — RN playground for `open-quran-view`

Validates the `open-quran-view/view/rn` export end-to-end.

## Run

```bash
# from the repo root
yarn install                 # yarn workspaces picks this up
yarn workspace rn-expo start # boots the Expo dev server
```

The default Expo dev-tools UI lists iOS, Android, and Web targets. Web is the
cheapest verification path: open `http://localhost:8081` and the page 1 of
`hafs-v2` should render.

## What it exercises

- `OpenQuranView` mounts with `page=1`, `mushafLayout="hafs-v2"`, `theme="light"`.
- Tapping a word logs a `WordClickedData` to the JS console (and shows it in the
  bottom debug strip).
- Top bar buttons:
  - **‹ Prev** / **Next ›** — go back/forward a page (clamped to 1–604).
  - **`mushafLayout`** — cycle through `hafs-v2` → `hafs-v4` → `hafs-unicode`.
  - **☀ / 🌙** — toggle light/dark theme.
- The `navigationControls` prop turns on the in-viewer prev/next/page-input
  bar (mirrors the web `NavigationControls`).

## Offline verification

After first paint, toggle Network → Offline in the dev tools and page through
1 → 50 → 100. Pages still load — assets are static `require()`s, not fetches.
