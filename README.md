# Searching for Pi

An interactive exploration of methods for calculating π, built with TypeScript and Vite.

---

## Methods implemented

| # | Method | Description |
|---|--------|-------------|
| 01 | Monte Carlo | Scatter random points inside a square and count how many land inside its inscribed circle |
| 02 | Leibniz Series | The alternating series 1 - 1/3 + 1/5 - 1/7 + … converges to π/4 |
| 03 | Buffon's Needle | Drop a needle at random onto a lined surface; the probability it crosses a line reveals π |
| 04 | Coin Toss Sequences | Toss coins until heads exceed tails; the ratio converges to π/4 |
| 05 | Bouncing Boxes | Two boxes with mass ratio 100^k collide elastically with a wall, encoding digits of π |
| 06 | Archimedes' Polygons | Squeeze π between inscribed and circumscribed regular polygons |
| 07 | Draw a Circle | Draw your own circle by clicking and dragging; circumference / diameter → π |

---

## Local development

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm

### First time setup

```bash
git clone https://github.com/YOUR-USERNAME/SearchingForPi.git
cd SearchingForPi
npm install
```

### Run the dev server

```bash
npm run dev
```

Then open http://localhost:5173/ in your browser.

Hot-module replacement is enabled, so edits to `.ts` and `.css` files reflect immediately in the browser.

### Debug configuration

The VSCode launch configuration (`.vscode/launch.json`) automatically runs a TypeScript check before starting the dev server. If TypeScript errors are found, the debug session will not start, allowing you to catch type errors early.

### Build for production

```bash
npm run build
```

Output goes to `dist/`. You can preview the production build with:

```bash
npm run preview
```

---

## Deploying to GitHub Pages

1. Push your code to the `main` branch of a GitHub repository.
2. In your repo: **Settings → Pages → Source → GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` will build and publish automatically.

> **Note:** If your repo is named something other than `SearchingForPi`, update the `base` field in `vite.config.ts` to match.

---

## Adding a new method

1. Create a new directory `src/methods/myMethod/` with the following files:
   - `index.ts` — Module barrel export
   - `page.ts` — Page factory using `createMethodPageFactory`
   - `types.ts` — State interface and constants
   - `controller.ts` — Animation control logic
   - `rendering.ts` — Canvas drawing functions
   - `preview.ts` — Home page preview animation
2. Add the page info to `src/methods/definitions.ts` in the `methodPages` array.
3. Register the factory in `src/methods/registry/factories.ts`.
4. Add preview registration in `src/methods/registry/previews.ts`.

The router handles everything else via URL hashes. See `docs/ARCHITECTURE.md` for detailed patterns.

---

## Project structure

```
SearchingForPi/
├── .github/workflows/deploy.yml    GitHub Actions deployment
├── docs/
│   └── ARCHITECTURE.md             Architecture patterns and guidelines
├── src/
│   ├── main.ts                     Entry point — registers pages, starts router
│   ├── router.ts                   Hash-based client-side router
│   ├── style.css                   Global styles and design tokens
│   ├── colors.ts                   Color getters (reads from CSS variables)
│   ├── cssVars.ts                  CSS custom property utilities
│   ├── utils.ts                    Shared utility functions
│   ├── navigation/                 Navigation components
│   │   ├── sidebar.ts              Sidebar navigation builder
│   │   ├── pageNav.ts              Page navigation controls
│   │   └── theme.ts                Light/dark theme toggle
│   └── methods/
│       ├── definitions.ts          Page metadata (titles, descriptions)
│       ├── home.ts                 Introduction / method selection page
│       ├── homePreviews.ts         Preview animations for home page
│       ├── registry/               Page factory and preview registries
│       ├── base/                   Shared base modules
│       │   ├── animation.ts        Animation loop helpers
│       │   ├── controller.ts       Animation controller factories
│       │   ├── canvas.ts           Canvas utilities
│       │   ├── stats.ts            Stats panel helpers
│       │   └── page/               Page factory system
│       ├── monteCarlo/             Monte Carlo method
│       │   ├── index.ts
│       │   ├── page.ts
│       │   ├── controller.ts
│       │   ├── types.ts
│       │   ├── rendering.ts
│       │   ├── preview.ts
│       │   └── sampling.ts         Domain-specific logic
│       ├── leibniz/                Leibniz series method
│       ├── buffon/                 Buffon's Needle method
│       ├── coinToss/               Coin toss sequences method
│       ├── bouncingBoxes/          Bouncing boxes method
│       ├── archimedes/             Archimedes' polygons method
│       ├── drawCircle/             Draw circle method
│       ├── riemann/                Riemann integral method
│       ├── basel/                  Basel problem method
│       ├── wallis/                 Wallis product method
│       ├── coprimality/            Coprimality method
│       ├── galton/                 Galton board method
│       ├── circlePacking/          Circle packing method
│       └── gasMolecules/           Gas molecules method
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```
