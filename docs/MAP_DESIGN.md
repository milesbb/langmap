# Map Design Spec

Primary implementation reference for the interactive map experience.

---

## The Map

- **Custom SVG illustration** of the world — equirectangular projection, `viewBox="0 0 10000 5000"`
- Not Google Maps, Mapbox, Leaflet, or any tile-based map
- **V1:** Generate from Natural Earth GeoJSON as functional placeholder. Miles will replace with a hand-drawn illustrated version at the same `viewBox` and same region `id`s — no code changes needed.
- **Art style (V1):** Clean editorial — Nat Geo modern atlas. Warm muted palette, flat fills, clear linework, no aged textures. Readable at all zoom levels.

### SVG Requirements

- Each geographic region has a named element: `id="region-{region_id}"` (e.g. `region-england`, `region-pontic-steppe`)
- Region shapes are approximate cultural/geographic zones, not political borders
- Regions are `display: none` by default; only the active node's region is shown
- Migration path lines are separate SVG elements animated via GSAP

**Coordinate formula:**
```javascript
x = (lng + 180) / 360 * 10000
y = (90 - lat) / 180 * 5000
```

---

## Node Experience — Step by Step

When a user navigates to a language node:

1. **Map pans and zooms** to centre on the node's `geo_bounds` (GSAP `Power2.inOut`)
2. **Region outline appears** — animated border around the speaker territory, coloured by branch palette. Only this region is highlighted.
3. **Speech bubbles rise** from within the region — 2–4 bubbles, staggered GSAP entrance, each with:
   - Original script (cuneiform, Greek, Devanagari, runic, etc.) where one exists
   - Latin-script romanisation below (IPA or standard scholarly transliteration)
   - English translation in small text
   - Reconstructed forms (PIE etc.) marked with `*` asterisk and "reconstructed" label
4. **Info panel slides in** (bottom sheet mobile / right panel desktop)
5. **YouTube embed** appears in info panel — click-to-play, graceful placeholder when `youtube_id` is null
6. **Migration arrows** pulse outward toward child nodes — click to travel

---

## Region Outlines — Key Nodes

| Language Node | Geographic Region |
|---|---|
| Proto-Indo-European | Pontic-Caspian Steppe (Ukraine, S. Russia, Kazakhstan) |
| Proto-Anatolian | Central Anatolia (modern Turkey) |
| Hittite † | Central Anatolia, centred on Hattusa |
| Proto-Indo-Iranian | Central Asian steppe (Kazakhstan, Uzbekistan) |
| Vedic Sanskrit | Northern Indian subcontinent (Indus/Gangetic plain) |
| Avestan | Eastern Iran / Afghanistan |
| Old Persian | Achaemenid heartland (Fars province, Iran) |
| Proto-Greek | Balkans / northern Greece |
| Ancient Greek | Greece, Aegean coast, Sicily |
| Classical Latin | Italian peninsula |
| Vulgar Latin | Entire Roman Empire extent |
| Proto-Celtic | Central Europe (Hallstatt region, Austria/Germany) |
| Proto-Germanic | Southern Scandinavia, N. Germany |
| Old Norse | Scandinavia + Iceland |
| Old English | England |
| Tocharian A/B † | Tarim Basin (Xinjiang, China) — far east outlier, dramatic |
| Modern English | Global (show dotted spread lines) |

---

## Map Transitions — Node-to-Node Animation

**All navigation uses this same system** — consecutive, sibling, or distant jump.

### Sequence

1. **Current node exit** (~400ms)
   - Speech bubbles fade out and sink (reverse entrance)
   - Region outline fades out
   - Info panel slides out
   - Migration arrows fade

2. **Map pan + zoom** (~700–1000ms depending on distance)
   - GSAP-animated `transform: translate + scale` on the SVG wrapper div
   - Easing: `Power2.inOut` — fast start, decelerate into position
   - Short hops: gentle pan
   - Long jumps (e.g. England → Xinjiang): zoom out to ~50% mid-flight for geographic context, then zoom back in
   - Timeline bar year counter ticks during this step

3. **New node entrance** (~500ms, starts as pan settles)
   - Region outline draws in via `stroke-dashoffset` animation
   - Speech bubbles float up, staggered
   - Info panel slides in
   - Migration arrows pulse in

**Feel:** a film camera pan, not a teleport. The user always feels the geographic distance. No jarring cuts. Mobile: same animation, duration reduced ~20%.

### Back Navigation

- Browser back button / swipe-back triggers reverse transition to parent node
- URL updates on each node visit (`/language/old-english`)

---

## Speech Bubbles

### Content Fidelity

Both scripts and romanisation:
1. Original script where one exists
2. Latin-script romanisation (IPA or standard scholarly)
3. For reconstructed languages: asterisked forms (`*h₁éḱwos`), clearly marked
4. English translation

```
𒀭𒂗𒍪        ← original script (cuneiform)
ḫaššu-        ← romanisation
"king"         ← translation
```

```
*h₁éḱwos      ← reconstructed, asterisk required
"horse"
[reconstructed — never written]
```

### Design

- Organic SVG bubble shapes (not perfect CSS rectangles)
- Style shifts per era: PIE/Bronze Age = rough parchment fill; modern = clean
- 2–4 per node, staggered GSAP `from()` with `stagger`
- Tap/click to expand (full translation + pronunciation note)
- Mobile: max 2 visible, tap to cycle

---

## Extinct Branch Treatment

- Region outline: `filter: grayscale(80%) opacity(60%)`
- Region fill: faint cross-hatch or "withered" overlay
- Node marker: hollow circle + dagger (†) symbol
- Migration arrows to extinct nodes: dashed, faded, no pulse
- Speech bubbles: same content, faded/aged style
- Tooltip: "This language is no longer spoken. Last attested: [date]."

---

## Migration Arrows

- SVG `<path>` elements drawn programmatically when a node activates, removed on exit
- At any given moment, only the active node's child arrows exist in the DOM (typically 2–8 paths)
- Animated via GSAP `stroke-dashoffset`
- Style: tapered, colour matches destination branch palette
- Pulse animation draws attention (subtle)
- Click triggers pan+zoom to destination
- Overview mode: all paths visible at low opacity, non-interactive

---

## Side Menu — Language Browser

**Trigger:** Top-left icon, slides in from left (desktop: ~320px panel; mobile: full-width overlay).

### Search Bar
- Live-filter across all node names (including native-script names)
- Clicking a result: menu closes → map animates to that node
- Mobile: auto-focuses on open

### Folder Tree (Language Groups)
Built from `groups[]` field — groups are folder labels, never nodes themselves:

```
▶ Germanic
  ▶ West Germanic
      English  ← active (highlighted)
      German
      Dutch
  ▶ North Germanic
      Old Norse
      ...
▶ Indo-Iranian
  ▶ Indo-Aryan
    ...
```

- Default collapsed except current node's branch
- Extinct languages shown with † and dimmed
- Each language name is clickable → map animates to that node
- Desktop: map stays interactive behind transparent backdrop
- Mobile: map frozen while menu is open

---

## Map Interaction Model

| Interaction | Behaviour |
|---|---|
| Click node / arrow | Transition animation → new node |
| Side menu → select language | Same transition (zoom-out-pan-in if distant) |
| Pinch / scroll zoom | Free zoom within bounds |
| Drag / swipe | Free pan |
| Overview icon (top-right) | Zoom out, show all migration paths |
| Back button / swipe-back | Reverse transition to parent node |
| Top-left menu icon | Open language browser |

**d3-zoom config:** `scaleExtent([0.5, 10])`, `translateExtent` clamped to map bounds.

---

## YouTube Embeds

- Standard iframe inside info panel, **click-to-play** (not autoplay)
- Start timestamp configurable via `youtube_start_seconds`
- Mobile: full-width below text content
- Desktop: bottom of right panel
- Render nothing (or a placeholder) when `youtube_id` is null — this is expected, not an error

---

## Mobile

- Map takes full viewport; info panel is bottom sheet
- Speech bubbles: max 2 visible, tap to cycle
- Region outlines: min 44px touch target on node markers
- d3-zoom handles touch + pointer events natively
- Audio: off by default, opt-in via 🔊 icon
