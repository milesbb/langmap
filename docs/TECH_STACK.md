# Tech Stack

## Core Libraries

| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Vite + Vanilla JS** | Fast build; no framework overhead needed for this interaction model |
| Animations | **GSAP** | Industry standard; handles map pan/zoom transitions, speech bubble entrances, migration arrow draw-on |
| Map pan/zoom | **d3-zoom** | Mouse wheel, drag, pinch-to-zoom; applies CSS transform on wrapper div |
| Graph data | **D3.js (data utilities only)** | `d3.hierarchy()` for traversal; NOT `d3.tree()` layout (geographic map, not a tree diagram) |
| Audio | **Howler.js** | Reliable cross-browser ambient audio; handles mobile autoplay gate |
| Routing | **Hash-based** (`/language/old-english`) | SPA; URL updates on each node; browser back/forward work naturally |
| Hosting | **Vercel** | Zero-config static hosting |
| SVG optimisation | **SVGO** (build step) | Runs on map SVG during build; preserves named IDs and viewBox |

---

## GSAP Usage

| Feature | GSAP tool |
|---|---|
| Map pan + zoom transition | `gsap.to()` on wrapper div `transform` |
| Migration arrows drawing on | `stroke-dashoffset` via `gsap.fromTo()` |
| Speech bubble entrance (float up, stagger) | `gsap.from()` with `stagger` on bubble elements |
| Info panel slide in/out | `gsap.to()` on panel `translateX` / `translateY` |
| Region outline draw-in | SVG `stroke-dashoffset` on region path |
| Side menu slide-in | `gsap.to()` on menu panel `translateX` |
| Timeline year counter tick | `gsap.to()` on counter object with `onUpdate` |
| Node hover glow + scale | `gsap.to()` on node marker `scale` + `filter` |

**Not used:** ScrollTrigger (no scroll interaction), MotionPath (arrows are draw-on, not path-following).

---

## Graph Model: DAG Not Tree

The language graph is a **Directed Acyclic Graph** — some nodes have multiple parents. Do **not** use `d3.tree()` or `d3.hierarchy()` for rendering. Use `d3.hierarchy()` only for data traversal utilities where a single-root path is needed (e.g. breadcrumb). Edge rendering is custom SVG lines from `geo_bounds` of parent to `geo_bounds` of child.

---

## File / Directory Structure

```
/public
  map.svg                 # World map SVG (v1: generated from Natural Earth GeoJSON; v2: Miles's illustration)

/data
  languages.json          # All node data — authoritative source
  graph.json              # Structure only — load first for fast initial render

/src
  main.js                 # Entry point
  map/
    MapRenderer.js        # SVG injection, d3-zoom setup, semantic zoom class toggling
    RegionManager.js      # Show/hide region outlines by node ID
    NodeMarkers.js        # Place and style node dots at geo_bounds coordinates
    MigrationArrows.js    # Draw and animate stroke-dashoffset paths between nodes
  transitions/
    NodeTransition.js     # 3-step transition: exit → pan/zoom → enter
    TimelineBar.js        # Year counter animation
  ui/
    InfoPanel.js          # Right panel (desktop) / bottom sheet (mobile)
    SideMenu.js           # Left drawer: search bar + groups folder tree
    SpeechBubbles.js      # Bubble creation, stagger animation, expand on tap
    YouTubeEmbed.js       # iframe embed, graceful null handling
  audio/
    AudioManager.js       # Howler.js; per-branch ambient loops, crossfade on transition
  data/
    graph.js              # DAG traversal helpers (find ancestors, find children, find path)
```

---

## Mobile Considerations

- Pan/zoom: d3-zoom handles pointer events natively (touch + mouse unified)
- Info panel: bottom sheet on mobile, right panel on desktop
- Speech bubbles: max 2 visible at once on mobile; tap to cycle
- Audio: off by default on mobile; opt-in via 🔊 icon
- `will-change: transform` on map wrapper and animated elements for GPU compositing

---

## Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | < 2s |
| Time to Interactive | < 4s |
| Lighthouse Performance | > 80 |
| Lighthouse Accessibility | > 90 |
| Initial bundle size | < 300KB gzipped |
| map.svg post-SVGO | < 1.5MB |
| Animation frame rate | 60fps on mid-range mobile |

---

## No-Go Technologies

- `d3.tree()` / `d3.cluster()` — wrong model; geographic DAG not diagram layout
- Three.js — no 3D; unnecessary complexity and bundle size
- React / Vue — no framework; vanilla JS is sufficient and faster
- Canvas-only — accessibility nightmare; SVG is correct
- jQuery — no
