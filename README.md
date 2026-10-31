<p align="center">
  <img src="assets/logo.png" alt="Moneyshot" height="64" />
</p>

<p align="center">
  Open source screenshot editor.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-0bb171" /></a>
  <img alt="Chrome MV3" src="https://img.shields.io/badge/chrome-MV3-0bb171" />
</p>

Capture any page in Chrome, then give the screenshot a background, a frame and the right size
for wherever it's going. Everything runs in your browser; screenshots never leave your computer.

## Features

- **Capture**: the visible area, the full page or a selection.
- **Backgrounds**: images and wallpapers (or upload your own), mesh gradients, solids and
  gradients, with an optional pattern layer (dots, grid, waves, stripes, checks, plus).
- **Frames**: macOS light and dark, Windows, Arc, ruler and stacked cards, with corner radius and
  shadow.
- **Sizes**: ratios plus exact sizes for X, LinkedIn, Instagram, YouTube, Dribbble, Product Hunt,
  the App Store, Play Store and Chrome Web Store.
- **Layout**: padding, zoom, rotation and 3D tilt; drag the screenshot and text on the canvas with
  center guides.
- **Text**: a headline above or below the screenshot, and a corner watermark.
- **Export**: download a PNG or copy it to the clipboard.

## Repository

| Path             | What                                                 |
| ---------------- | ---------------------------------------------------- |
| `apps/extension` | Chrome extension (React, TypeScript, Tailwind, Vite) |
| `apps/site`      | Website (Astro, Tailwind)                            |

## Development

Requires Node 22 and pnpm.

```sh
pnpm install
pnpm build      # build everything
pnpm test       # run the tests
pnpm lint       # Biome
```

### Extension

```sh
pnpm --filter @moneyshot/extension dev
```

Then open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and select
`apps/extension/dist`. Click the Moneyshot icon (or press <kbd>⌥</kbd><kbd>⇧</kbd><kbd>S</kbd>)
on any page to take a screenshot.

### Site

```sh
pnpm --filter @moneyshot/site dev
```

## License

[AGPL-3.0](LICENSE)
