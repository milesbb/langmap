# LangMap — Proto-Indo-European Language Family Tree

An interactive world map exploring the full PIE language family. Click any language node to pan and zoom the map to that language's home region, see speech bubbles in the original script, and follow migration arrows to descendant languages.

**North star reference:** [fallen.io/ww2](https://fallen.io/ww2)

---

## Running locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. The map loads from `public/map.svg` and data from `public/data/`.

### Regenerate the map SVG (rarely needed)

```bash
npm run generate:map
```

Builds `public/map.svg` from Natural Earth GeoJSON. Only needed if the source GeoJSON changes — the generated file is committed.

### Production build

```bash
npm run build
```

Runs `build-graph.js` (derives `graph.json` from `languages.json`), SVGO optimisation, then Vite build. Output goes to `dist/`.

---

## Running tests

```bash
# Unit tests (Vitest)
npm test

# Unit tests in watch mode
npm run test:watch

# E2E tests (Playwright — requires the dev server to be running)
npm run test:e2e

# E2E tests with interactive UI
npm run test:e2e:ui

# Data validation only (fast, no browser)
npm run validate:data

# Lint
npm run lint
```

The full CI suite is: `lint` → `validate:data` → `npm test` → `test:e2e`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Build | Vite + Vanilla JS (no framework) |
| Animations | GSAP |
| Map pan/zoom | d3-zoom |
| Graph traversal | D3.js (data utilities only) |
| Audio | Howler.js |
| Routing | Hash-based (`#/language/old-english`) |
| Unit tests | Vitest + vitest-axe |
| E2E tests | Playwright |
| Hosting | Vercel |

---

## Project structure

```
public/
  map.svg                # World map SVG (equirectangular, viewBox 0 0 10000 5000)
  data/
    languages.json       # All node data — 273KB, do not read in full
    graph.json           # Structure only — derived from languages.json; load first

scripts/
  build-graph.js         # Derives graph.json from languages.json
  generate-map.js        # Generates map.svg from Natural Earth GeoJSON
  optimise-map.js        # Runs SVGO on map.svg

src/
  main.js                # Entry point
  map/
    MapRenderer.js       # SVG injection, d3-zoom setup, semantic zoom
    RegionManager.js     # Show/hide region outlines by node ID
    NodeMarkers.js       # Place node dots at geo_bounds coordinates
    MigrationArrows.js   # Draw animated stroke-dashoffset paths
  transitions/
    NodeTransition.js    # 3-step transition: exit → pan/zoom → enter
    TimelineBar.js       # Year counter animation
  ui/
    InfoPanel.js         # Right panel (desktop) / bottom sheet (mobile)
    SideMenu.js          # Left drawer: search + language folder tree
    SpeechBubbles.js     # Bubble creation, stagger animation
  audio/
    AudioManager.js      # Howler.js; per-branch ambient loops
  data/
    graph.js             # DAG traversal helpers
    loader.js            # fetch() wrappers for graph.json and languages.json
    types.js             # JSDoc typedefs

e2e/                     # Playwright E2E specs
docs/                    # Spec docs (BUILD_PLAN, MAP_DESIGN, TECH_STACK, etc.)
```

---

## Data

The language graph is a **DAG, not a tree.** `parent_ids` is always an array — some languages have multiple parents (e.g. Middle English ← Old English + Old French Norman).

Current node count: ~131 nodes (Alpha + Phases 1–7), all written in Notion and merged into `languages.json`. Target: ~350–400 nodes covering the full PIE family.

To spot-check data without loading the full file:

```bash
jq '.[] | select(.id=="middle-english")' public/data/languages.json
```

---

## Build phases

| Phase | Status | Nodes |
|---|---|---|
| Alpha — English path | ✅ Complete | ~23 |
| Phase 1 — Full Germanic | Pending | ~45 |
| Phase 2 — Full Italic/Romance | Pending | ~40 |
| Phase 3 — Slavic + Baltic | Pending | ~45 |
| Phase 4 — Hellenic + Armenian + Albanian | Pending | ~20 |
| Phase 5 — Full Celtic | Pending | ~25 |
| Phase 6 — Full Indo-Iranian | Pending | ~120 |
| Phase 7 — Anatolian + fringe + creoles | Pending | ~35 |

See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) and [docs/ROADMAP.md](docs/ROADMAP.md) for full detail.
