# Implementation Roadmap

Phase-by-phase dev checklist. Read alongside [MAP_DESIGN.md](MAP_DESIGN.md), [BUILD_PLAN.md](BUILD_PLAN.md), and [TECH_STACK.md](TECH_STACK.md).

---

## Pre-Dev Status

| Item | Status |
|---|---|
| SVG world map | ✅ Unblocked — Claude Code generates equirectangular SVG from Natural Earth GeoJSON as v1 placeholder. Miles replaces with illustrated version later (same IDs, no code changes). |
| Projection | ✅ Equirectangular, viewBox "0 0 10000 5000" |
| Speech bubble content (Alpha nodes) | ✅ Done — all nodes in Language Tree Data have `speech_bubbles` populated |
| Art style direction | ✅ Clean editorial (Nat Geo modern atlas) |
| Migration arrow style | ✅ Animated SVG paths (stroke-dashoffset) |
| Node data | ✅ All ~131 nodes (Alpha + Phases 1–7) written in Notion, ready to merge |

YouTube IDs are **not** a pre-dev blocker. The embed component renders a placeholder when `youtube_id` is null.

---

## Phase 0 — Setup & Data (Week 1)

- [ ] Set up Vite project with GSAP, D3, d3-zoom, Howler.js
- [ ] Set up Vitest and Playwright; configure CI to run both on every PR
- [ ] Build `languages.json` — fetch all child pages from Notion "Language Tree Data" in reading order (see "Claude Code — Start Here" page for exact instructions and page URLs). Merge all JSON arrays.
  - Schema: `id`, `name`, `native_name`, `parent_ids[]`, `parent_influence{}`, `date_range`, `status`, `region_id`, `geo_bounds`, `speakers_culture`, `split_reason`, `interesting_fact`, `sample_words[]`, `speech_bubbles[]`, `groups[]`, `glottolog_id`, `iso_639_3`, `wikipedia_url`, `youtube_id` (nullable), `sources[]`
- [ ] **Tests — data validation** (write before merging `languages.json`):
  - No duplicate `id` values
  - Every `parent_id` references an existing node
  - No cycles in the DAG
  - `parent_ids` is always an array (never a string)
  - All required fields present; `status` is a valid enum value
  - `geo_bounds.lat/lng` in valid ranges
  - `youtube_id` is `null` or non-empty string (never `undefined`)
- [ ] Build `graph.json` (adjacency list derived from `languages.json`; load this first)
- [ ] **Tests — graph.json** matches `languages.json` structure; `childrenOf`/`parentsOf` are inverse
- [ ] Hash-based routing (`/language/old-english`)
- [ ] SVGO optimisation step in build pipeline (preserving named IDs and viewBox)
- [ ] Generate equirectangular SVG from Natural Earth GeoJSON with correct `#region-{id}` element IDs

---

## Phase 1 — Map Foundation (Weeks 2–3)

**Goal:** Navigable, zoomable world map with region highlights and info panels. No speech bubbles, audio, or YouTube yet.

- [ ] Render SVG world map in viewport (`preserveAspectRatio="xMidYMid meet"`)
- [ ] **Tests — `geoToSvg` coordinate calculation** (unit tests, all corner cases including PIE and Tocharian coords)
- [ ] d3-zoom: pan (drag/swipe) + scroll-wheel zoom + pinch-to-zoom (mobile)
- [ ] Zoom bounds: `scaleExtent([0.5, 10])`, `translateExtent` clamped to map bounds
- [ ] Semantic zoom: CSS class toggling on `layer-labels-region`, `layer-labels-city` based on d3-zoom scale
- [ ] Region highlight system: `display: block` + animated stroke on `#region-{id}` when node is active
- [ ] **Tests — RegionManager** (only active region shows; no error on missing region ID)
- [ ] Node markers: small circles at `geo_bounds` lat/lng, coloured by branch
- [ ] **Tests — DAG traversal helpers** (`findAncestors`, `findChildren`, `findPath`, `buildAdjacencyList`) — must cover multi-parent Middle English case explicitly
- [ ] **Map transition animation** (used for ALL navigation):
  - Step 1: current node exit — speech bubbles sink, region outline fades, info panel slides out (~400ms)
  - Step 2: map pan + zoom via GSAP `Power2.inOut` to new `geo_bounds` (~700–1000ms); for distant jumps, briefly zoom out to ~50% mid-flight
  - Step 3: new node entrance — region outline draws in, info panel slides in (~500ms)
  - Timeline bar year counter ticks during Step 2
- [ ] **Tests — NodeTransition** (exit before pan, pan before enter, distant jump triggers zoom-out, URL updates after transition)
- [ ] DAG edge rendering: multi-parent nodes show edges from all `parent_ids`; edges styled differently from single-parent edges
- [ ] Info panel (right panel desktop / bottom sheet mobile): language name, date range, speakers, split reason, interesting fact, sample words, Wikipedia link
- [ ] **Tests — InfoPanel** (all fields render; null fields omit gracefully; extinct/reconstructed badge; axe check)
- [ ] Timeline bar: always-visible top bar, year updates on node change with animated tick
- [ ] Back navigation: browser back button + swipe-back triggers reverse transition to parent node
- [ ] Overview toggle (top-right): zoom out to show full world map + all migration paths at low opacity
- [ ] **E2E — English path** (PIE → Proto-Germanic → Proto-West-Germanic → Old English → Middle English → Early Modern English → Modern English); URL updates at each step
- [ ] **E2E — Multi-parent node** (Middle English shows edges from both parents; info panel shows both influences)
- [ ] **E2E — Back navigation** (browser back returns to previous language)

**MVP milestone:** English path navigable end-to-end (PIE → Modern English). Multi-parent edge (Old English + Norman French → Middle English) renders correctly. All tests green.

---

## Phase 2 — Side Menu & Speech Bubbles (Week 4)

- [ ] **Side menu** (top-left icon, slides from left):
  - Search bar: live-filter across all node names + native names; clicking → map transition
  - Folder tree: collapsible groups from `groups[]` field; active node highlighted; extinct nodes dimmed with †
  - Desktop: 320px panel, map stays interactive behind backdrop
  - Mobile: full-width overlay, map frozen while open
- [ ] **Tests — SideMenu search** (case-insensitive match, native_name match, empty query, no-match, † on extinct nodes)
- [ ] **E2E — Side menu** (search "gothic" returns 2 results; clicking result navigates to that language; menu closes on selection)
- [ ] **Speech bubble system**:
  - Organic SVG bubble shapes rising from active region, staggered GSAP entrance
  - 2–4 bubbles per node from `speech_bubbles[]`
  - Tap/click to expand (full translation + pronunciation note)
  - Mobile: max 2 visible, tap to cycle
  - Style: older eras = aged/parchment texture; modern = clean
- [ ] **E2E — Mobile speech bubbles** (viewport 390×844; only 2 bubbles visible; tap cycles to next)
- [ ] Per-branch colour palette on region outlines and node markers
- [ ] Extinct branch treatment: `grayscale(80%) opacity(60%)` on region, dashed migration arrows, † icon on marker, tooltip "Last attested: [date]"
- [ ] Migration arrows: GSAP `stroke-dashoffset` animated SVG paths from parent region → child node; pulse on active node's children
- [ ] Node hover states: subtle glow + scale on hover
- [ ] Typography: EB Garamond / Cormorant Garamond for language names; Inter for UI chrome; Noto for native scripts
- [ ] **E2E — Accessibility** (axe on PIE node, Old English node, side menu open state — zero violations)

---

## Phase 3 — YouTube & Audio (Week 5)

- [ ] YouTube iframe embed in info panel (click-to-play)
  - Graceful placeholder/omit when `youtube_id` is null
  - Configurable start time via `youtube_start_seconds`
  - Mobile: full-width below text; desktop: bottom of right panel
- [ ] **Tests — YouTubeEmbed** (iframe renders with valid id; placeholder when null; correct src with start time; no autoplay; iframe has title for axe)
- [ ] **E2E — YouTube placeholder** (navigate to a null-youtube_id node; placeholder visible; no iframe in DOM)
- [ ] Howler.js ambient audio per branch/region
  - Fades in on node enter, fades out on node exit (crossfade)
  - Mute toggle always visible
  - Mobile: audio off by default, opt-in via 🔊 icon
- [ ] **Tests — AudioManager** (no load on init; correct branch track on navigation; no reload within same branch; crossfade on branch change; muted state respected; mobile silent until opt-in)
- [ ] Performance pass: mobile FPS profiling, lazy-load audio, reduce complexity on low-end devices via `matchMedia`
- [ ] **E2E — Performance budget** (total blocking load < 1MB; graph.json loads < 100ms)

---

## Phase 4 — Shareability & SEO (Week 6)

- [ ] Per-node canonical URLs (`/language/old-norse`)
- [ ] OpenGraph meta tags dynamic per node (name, date range, interesting fact, branch colour as og:image background)
- [ ] "Share this language" button in info panel
- [ ] `prefers-reduced-motion` media query: disable or simplify all GSAP animations

---

## Phase 5 — QA & Alpha Launch (Week 7)

- [ ] **Full test suite passes on CI** (`vitest run` + `playwright test` green)
- [ ] **Zero axe violations** on all tested pages and states
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Mobile: iOS Safari, Android Chrome — full touch interaction, bottom sheet, pinch zoom
- [ ] Accessibility: keyboard navigation between nodes (Tab/Enter), ARIA labels on all interactive elements, focus management on panel open/close
- [ ] Lighthouse performance pass (target: Performance >80, Accessibility >90)
- [ ] Deploy to Vercel
- [ ] Soft launch with Alpha nodes (English path + Germanic siblings, ~23 nodes)

---

## Phase 6+ — Node Expansion (Ongoing)

Each content expansion phase maps to a deploy:

| Build Plan Phase | Nodes added | Deploy |
|---|---|---|
| Phase 1 (Full Germanic) | ~45 | v1.1 |
| Phase 2 (Full Italic/Romance) | ~40 | v1.2 |
| Phase 3 (Slavic + Baltic) | ~45 | v1.3 |
| Phase 4 (Hellenic + Armenian + Albanian) | ~20 | v1.4 |
| Phase 5 (Celtic) | ~25 | v1.5 |
| Phase 6 (Indo-Iranian) | ~120 | v2.0 |
| Phase 7 (Anatolian + long tail) | ~35 | v2.1 |

Each phase requires: node data in `languages.json`, region paths in SVG, speech bubble content. YouTube IDs are nullable — add when available.

---

## Key Decisions Log

| Decision | Resolution |
|---|---|
| Primary design concept | Concept D — Artistic Map Journey |
| Map coverage | Full world excluding Antarctica |
| Projection | Equirectangular, viewBox="0 0 10000 5000" |
| Art style | Clean editorial — Nat Geo modern atlas |
| Migration arrow style | Animated SVG paths using stroke-dashoffset |
| Extinct branches | Included with dead visual treatment |
| Guided mode | Free exploration V1; guided mode in Future Ideas |
| Node = language, not group | Groups are metadata only (groups[] field) |
| Dialect scope | ISO 639-3 + meaningful divergence; no American English etc. |
| Multi-parent (DAG) | `parent_ids[]` always array; DAG not tree |
| YouTube IDs | Added incrementally; nullable; not a launch blocker |
| 3D vs 2D | 2D SVG map |
| Speech bubble fidelity | Attested forms where possible; reconstructed marked with * |
| City label style | Historical name + modern in brackets (e.g. "Londinium [London]") |
| Node data storage | Notion child pages per branch; Claude Code reads and merges into languages.json |

---

## Risks

| Risk | Mitigation |
|---|---|
| SVG map complexity → slow initial render | Path simplification + SVGO; target <1.5MB post-optimisation |
| Mobile performance on animation-heavy nodes | Only animate `transform` + `opacity` (GPU); disable extras via `prefers-reduced-motion` |
| Linguistic accuracy contested | Cite Glottolog + Wikipedia; display dates as ranges with ~; disclaimer on site |
| PIE reconstructions presented as fact | Asterisk convention on all reconstructed forms; "reconstructed" tooltip |
| DAG rendering complexity | Solve at Alpha (Middle English multi-parent); don't defer |
| YouTube embeds going dead | `youtube_id` nullable by design; graceful omission when null |
| Scope creep during node expansion | Strict phase gating; each phase ships only when data + SVG regions complete |
