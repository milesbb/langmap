# Performance & Data Architecture

## Reality Check

~350 language nodes is not much data. A fully-populated `languages.json` at ~350 nodes will be roughly **300–500KB raw, ~80–120KB gzipped** — smaller than one high-res photo. The SVG world map (~1.5MB post-SVGO) is the only genuinely large asset.

The real goals are:
1. SVG feels instantly responsive at all zoom levels
2. Don't load things the user hasn't asked for yet
3. Keep animations on the GPU so they never stutter
4. Feel instant on return visits

---

## Data Storage Architecture

Three files, loaded in priority order:

```
/data
  graph.json          ← Load first, on app init (~15KB)
  languages.json      ← Load second, after first paint (~80–120KB gzipped)
  nodes/
    {id}.json         ← Load on demand, only when user visits that node (Phase 2+ escape hatch)
```

### `graph.json` — structure only, load immediately

Contains only what's needed to render the map before the user clicks anything: node IDs, coordinates, `parent_ids`, branch, status, `date_range`, `region_id`, `geo_bounds`.

```json
[
  {
    "id": "old-english",
    "parent_ids": ["proto-west-germanic"],
    "branch": "germanic",
    "status": "extinct",
    "date_range": "450–1100 CE",
    "region_id": "region-old-english",
    "geo_bounds": { "lat": 52.5, "lng": -1.5, "zoom": 6 }
  }
]
```

Size: ~15–25KB for 350 nodes. Parsed in <5ms. Loaded in parallel with `map.svg` so the map renders node markers and migration arrows before `languages.json` arrives.

### `languages.json` — full data, load after first paint

Contains everything: `speech_bubbles`, `sample_words`, `interesting_fact`, `groups[]`, `wikipedia_url`, etc. Loaded in the background after the map is visible and interactive.

Size: ~300–500KB raw, ~80–120KB gzipped. Parsed once, stored in a JS `Map` keyed by node ID for O(1) lookup.

### `nodes/{id}.json` — per-node rich content, load on demand (optional escape hatch)

Not needed in base architecture. Only use this if `languages.json` grows unwieldy (unlikely until well past 350 nodes with large media URLs). Once fetched, cached by the browser for the session.

---

## SVG Map Performance

### The SVG loads once

Fetched once, inlined into the DOM. Subsequent pan/zoom never touches the network.

### Pan/zoom is GPU-only — no SVG re-render

The entire SVG sits inside a wrapper `<div>`. d3-zoom applies `transform: translate(Xpx, Ypx) scale(k)` to that div via CSS. The GPU compositor handles this — the browser never re-paints the SVG paths.

```javascript
<div id="map-wrapper" style="transform: translate(0px, 0px) scale(1)">
  <svg>... entire world map ...</svg>
</div>
```

### Semantic zoom via CSS classes — no JS on every frame

Subscribe to d3-zoom's `zoom` event and toggle CSS classes on threshold crossings only:

```javascript
zoom.on('zoom', (event) => {
  mapWrapper.style.transform = `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`;

  // Only toggle on threshold crossing, not every frame
  const k = event.transform.k;
  if (k > 3 && !showingLevel3) { showLevel3(); showingLevel3 = true; }
  if (k < 3 && showingLevel3)  { hideLevel3(); showingLevel3 = false; }
});
```

Hiding elements uses `display: none` / `display: block` — no layout recalculation since hidden elements are out of flow.

### Region outlines — only the active one renders

All ~350 region outline paths are in the SVG but `display: none` by default. Only the active node's region is shown. The browser never paints 350 filled paths simultaneously.

### Migration arrows — generated on demand, removed on exit

Arrows are drawn as SVG `<path>` elements when a node activates, then removed on exit. Typically 2–8 paths at any given moment, never 350.

---

## Animation Performance

### Only animate GPU-composited properties

Only ever animate:
- `transform` (translate, scale, rotate)
- `opacity`

**Never animate:** `width`, `height`, `top`, `left`, `x`, `y`, path `d`, `fill`, `stroke-width`. These trigger layout or paint recalculation and cause jank.

### `will-change` on animated elements

```css
#map-wrapper {
  will-change: transform;
}
.speech-bubble {
  will-change: transform, opacity;
}
```

Use sparingly — promoting too many elements wastes VRAM. Only the map wrapper and actively-animating elements.

### GSAP handles frame timing

GSAP uses `requestAnimationFrame` internally and batches DOM reads/writes. It outperforms manual RAF loops.

---

## Caching Strategy

### HTTP cache headers (set at Vercel)

```
graph.json          Cache-Control: public, max-age=86400      (1 day)
languages.json      Cache-Control: public, max-age=86400      (1 day)
map.svg             Cache-Control: public, max-age=31536000   (1 year, immutable)
audio/*.mp3         Cache-Control: public, max-age=31536000   (1 year, immutable)
```

### Cache busting on deploy

Vite adds content hashes to filenames on build (`languages.a3f9c.json`). Old cached versions are automatically invalidated when content changes. No manual cache busting needed.

### Service Worker (Phase 4+)

After first visit: service worker caches `graph.json`, `languages.json`, and `map.svg`. Return visits load entirely from cache — 0 network requests for the core experience.

---

## Audio Loading

- Never preload audio
- Load the current branch's ambient track only when the user navigates to a node in that branch
- If the user leaves before it loads, cancel the request
- Cache once loaded (browser cache + Howler's internal cache)
- Mobile: don't attempt to load until the user taps the 🔊 icon

---

## What Loads on First Visit

| Asset | Size (gzipped) | When |
|---|---|---|
| HTML + JS bundle | ~150KB | Immediately |
| `graph.json` | ~8KB | Immediately, parallel with JS |
| `map.svg` | ~600KB | Immediately, parallel |
| `languages.json` | ~100KB | After first paint |
| Branch audio file | ~200KB | On first node navigation |
| YouTube iframe | 0 | On user click only |

**Total blocking load: ~760KB gzipped.** Target first interactive: <2.5s on 4G. Return visit (cached): <0.5s.

---

## In-Memory Data Structure After Load

```javascript
// Built once on load, never rebuilt
const nodeMap = new Map(languages.map(n => [n.id, n]));

// O(1) lookup anywhere in the app
const node = nodeMap.get('old-english');

// DAG traversal helpers built from graph.json
const childrenOf = new Map(); // id -> [child ids]
const parentsOf = new Map();  // id -> [parent ids]

for (const node of graph) {
  for (const parentId of node.parent_ids) {
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(node.id);
  }
  parentsOf.set(node.id, node.parent_ids);
}
```

Side menu search: flat array of `{ id, name, native_name, groups }` pre-computed once, filtered with `String.includes()` on keypress. At 350 nodes, brute-force filter is fast enough — no search index library needed.

---

## What Makes It Feel Fast

| Technique | Effect |
|---|---|
| Split data loading (graph first, narrative after) | Map interactive before language detail arrives |
| CSS transform on GPU | 60fps pan/zoom with zero repaint |
| Region outlines: only active one rendered | Browser paints 1 region, not 350 |
| Migration arrows: generated on demand, removed on exit | Minimal live DOM elements |
| Semantic zoom via threshold toggling | No JS on every animation frame |
| Audio loaded on navigation, not on page load | No audio blocking initial render |
| YouTube: iframe only on user click | No Google request until wanted |
| Long-lived HTTP cache headers | Near-instant return visits |
| Service worker (Phase 4) | Fully offline-capable on return |
| `will-change` on animated elements | GPU layer promotion only where needed |
| SVGO on build | SVG file 60–80% smaller than raw export |
| Brotli compression on Vercel | All text assets 15–20% smaller than gzip |
