# Testing Strategy

Testing exists to make changes safe. Every module that can be unit-tested must be. Every user-facing flow must have an E2E spec. No phase ships without its tests passing.

**Tools:** Vitest (unit + integration), Playwright (E2E), vitest-axe (accessibility).

---

## What Must Be Tested (by layer)

### 1. Data validation — `languages.json` and `graph.json`

These run as part of the build/CI pipeline. They prevent bad data from ever reaching the app.

```javascript
// src/data/__tests__/validate.test.js
describe('languages.json', () => {
  it('has no duplicate ids')
  it('every parent_id references an existing node id')
  it('has no cycles (DAG constraint)')
  it('parent_ids is always an array, never a string')
  it('every node has required fields: id, name, parent_ids, status, region_id, geo_bounds')
  it('status is one of: living | extinct | liturgical | reconstructed')
  it('geo_bounds.lat is in [-90, 90] and geo_bounds.lng is in [-180, 180]')
  it('reconstructed nodes have names prefixed with *')
  it('youtube_id is null or a non-empty string (never undefined)')
  it('groups is a non-empty array on every node')
  it('every speech_bubble has text and translation fields')
})

describe('graph.json', () => {
  it('contains every id from languages.json')
  it('parent_ids in graph.json match parent_ids in languages.json for each node')
  it('childrenOf and parentsOf are inverse of each other')
})
```

### 2. Coordinate calculation — `src/map/NodeMarkers.js`

Pure functions; test exhaustively.

```javascript
describe('geoToSvg', () => {
  it('maps (lat=0, lng=0) to (5000, 2500) — center of viewBox')
  it('maps (lat=90, lng=-180) to (0, 0) — top-left corner')
  it('maps (lat=-90, lng=180) to (10000, 5000) — bottom-right corner')
  it('maps Old English geo_bounds to the correct SVG pixel range')
  it('maps PIE Pontic steppe coords to Central Eurasian SVG region')
})
```

### 3. DAG traversal helpers — `src/data/graph.js`

The DAG logic is the most complex, highest-risk code in the project. Cover every traversal function thoroughly, with both single-parent and multi-parent cases.

```javascript
describe('findAncestors', () => {
  it('returns empty array for PIE (no parents)')
  it('returns [old-english, proto-west-germanic, proto-germanic, pie] for modern-english')
  it('returns both parent chains for middle-english (old-english path AND old-french-norman path)')
  it('does not return duplicates when two paths share an ancestor')
  it('handles the full depth of the tree without stack overflow')
})

describe('findChildren', () => {
  it('returns all direct children of proto-germanic')
  it('returns empty array for a leaf node (modern-english)')
  it('middle-english appears in children of both old-english and old-french-norman')
})

describe('findPath', () => {
  it('returns the direct path from pie to old-english')
  it('returns a valid path for middle-english (choosing one parent branch)')
  it('returns null when no path exists between unconnected nodes')
})

describe('buildAdjacencyList', () => {
  it('correctly maps parent → [children] for all nodes')
  it('multi-parent node appears in multiple parents child lists')
})
```

### 4. AudioManager — `src/audio/AudioManager.js`

Mock Howler.js at the boundary. Test the state machine, not Howler internals.

```javascript
describe('AudioManager', () => {
  it('does not load audio on instantiation')
  it('loads the correct branch track when entering a Germanic node')
  it('does not reload audio when navigating within the same branch')
  it('crossfades between tracks when changing branch')
  it('respects the muted state: does not play when muted is true')
  it('on mobile, stays silent until opt-in is called')
  it('cancels a pending load if the user navigates away before it completes')
})
```

### 5. NodeTransition — `src/transitions/NodeTransition.js`

Mock GSAP's `gsap.to()` / `gsap.from()`. Test sequencing and state, not animation internals.

```javascript
describe('NodeTransition', () => {
  it('calls exit sequence before pan sequence')
  it('calls enter sequence after pan completes')
  it('pans to the correct geo_bounds of the destination node')
  it('for a distant jump (distance > threshold), triggers mid-flight zoom-out')
  it('for a short hop, does not trigger mid-flight zoom-out')
  it('updates the URL to /language/{id} after transition completes')
  it('updates the timeline bar year counter during the pan step')
  it('reverse transition (back nav) runs exit → reverse pan → enter correctly')
})
```

### 6. RegionManager — `src/map/RegionManager.js`

DOM-level tests — use jsdom or a real SVG fixture.

```javascript
describe('RegionManager', () => {
  it('sets display:block only on the active region element')
  it('sets display:none on all other region elements')
  it('does not error if region_id does not exist in SVG (graceful no-op)')
  it('adds stroke animation class on activation')
  it('removes animation class on deactivation')
})
```

### 7. YouTubeEmbed — `src/ui/YouTubeEmbed.js`

```javascript
describe('YouTubeEmbed', () => {
  it('renders an iframe when youtube_id is a valid string')
  it('renders a placeholder div when youtube_id is null')
  it('sets the correct src with youtube_start_seconds as t= parameter')
  it('does not autoplay — no autoplay=1 in the src')
  it('passes the axe accessibility check (iframe has title attribute)')
})
```

### 8. SideMenu search — `src/ui/SideMenu.js`

```javascript
describe('SideMenu search', () => {
  it('returns all nodes when query is empty')
  it('matches on name (case-insensitive)')
  it('matches on native_name')
  it('returns empty array for a query with no matches')
  it('does not mutate the source node array during filtering')
  it('marks extinct nodes with † in results')
})
```

### 9. InfoPanel — `src/ui/InfoPanel.js`

```javascript
describe('InfoPanel', () => {
  it('renders language name, date_range, status, split_reason, interesting_fact')
  it('renders all sample_words')
  it('renders Wikipedia link when wikipedia_url is present')
  it('does not render Wikipedia link when wikipedia_url is null')
  it('shows "reconstructed" badge when status === "reconstructed"')
  it('shows "extinct" badge with last-attested date when status === "extinct"')
  it('passes the axe accessibility check')
})
```

---

## E2E Tests (Playwright)

Every E2E test covers a complete user journey from app load to result.

### Spec: English path navigation — `e2e/english-path.spec.js`

```javascript
test('user can navigate from PIE to Modern English', async ({ page }) => {
  await page.goto('/')
  // lands on PIE node
  await expect(page).toHaveURL('/language/proto-indo-european')
  // click through the chain
  await page.click('[data-node-id="proto-germanic"]')
  await expect(page).toHaveURL('/language/proto-germanic')
  // ... continue to Modern English
  await expect(page.locator('#info-panel')).toContainText('Modern English')
})
```

### Spec: Multi-parent node — `e2e/dag-multi-parent.spec.js`

```javascript
test('Middle English shows edges from both parents', async ({ page }) => {
  await page.goto('/language/middle-english')
  const edges = page.locator('.migration-arrow')
  // should show arrow from old-english AND from old-french-norman
  await expect(edges).toHaveCount(2)
  await expect(page.locator('[data-edge-from="old-english"]')).toBeVisible()
  await expect(page.locator('[data-edge-from="old-french-norman"]')).toBeVisible()
})

test('Middle English info panel shows both parent influences', async ({ page }) => {
  await page.goto('/language/middle-english')
  await expect(page.locator('#info-panel')).toContainText('Norman Conquest')
  await expect(page.locator('#info-panel')).toContainText('Old English')
})
```

### Spec: Side menu search — `e2e/side-menu.spec.js`

```javascript
test('searching "gothic" finds Gothic and Crimean Gothic', async ({ page }) => {
  await page.goto('/')
  await page.click('[aria-label="Open language browser"]')
  await page.fill('[placeholder="Search languages"]', 'gothic')
  const results = page.locator('.search-result')
  await expect(results).toHaveCount(2)
})

test('clicking a search result navigates to that language', async ({ page }) => {
  await page.goto('/')
  await page.click('[aria-label="Open language browser"]')
  await page.fill('[placeholder="Search languages"]', 'old norse')
  await page.click('.search-result:has-text("Old Norse")')
  await expect(page).toHaveURL('/language/old-norse')
})
```

### Spec: Back navigation — `e2e/navigation.spec.js`

```javascript
test('browser back button returns to previous language', async ({ page }) => {
  await page.goto('/language/old-english')
  await page.click('[data-node-id="middle-english"]')
  await expect(page).toHaveURL('/language/middle-english')
  await page.goBack()
  await expect(page).toHaveURL('/language/old-english')
})
```

### Spec: YouTube placeholder — `e2e/youtube.spec.js`

```javascript
test('shows placeholder when youtube_id is null', async ({ page }) => {
  // use a node known to have youtube_id: null
  await page.goto('/language/proto-west-germanic')
  await expect(page.locator('.youtube-placeholder')).toBeVisible()
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0)
})
```

### Spec: Accessibility — `e2e/a11y.spec.js`

```javascript
test('PIE node has no accessibility violations', async ({ page }) => {
  await page.goto('/language/proto-indo-european')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

test('side menu has no accessibility violations when open', async ({ page }) => {
  await page.goto('/')
  await page.click('[aria-label="Open language browser"]')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
```

### Spec: Mobile viewport — `e2e/mobile.spec.js`

```javascript
test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14

test('info panel renders as bottom sheet on mobile', async ({ page }) => {
  await page.goto('/language/old-english')
  const panel = page.locator('#info-panel')
  const box = await panel.boundingBox()
  // bottom sheet should be anchored to bottom of viewport
  expect(box.y + box.height).toBeCloseTo(844, -1)
})

test('max 2 speech bubbles visible on mobile', async ({ page }) => {
  await page.goto('/language/old-english')
  const visible = page.locator('.speech-bubble:visible')
  await expect(visible).toHaveCount(2)
})
```

---

## Performance Budget Tests

Run against the Vite production build via Playwright.

```javascript
// e2e/performance.spec.js
test('total blocking load is under 1MB gzipped', async ({ page }) => {
  const resources = []
  page.on('response', r => resources.push(r))
  await page.goto('/')
  const total = resources
    .filter(r => ['document', 'script', 'fetch', 'xhr', 'image'].includes(r.request().resourceType()))
    .reduce((sum, r) => sum + (parseInt(r.headers()['content-length'] ?? '0')), 0)
  expect(total).toBeLessThan(1_000_000)
})

test('graph.json loads in under 100ms', async ({ page }) => {
  let graphLoadTime
  page.on('response', r => {
    if (r.url().includes('graph.json')) graphLoadTime = Date.now()
  })
  const start = Date.now()
  await page.goto('/')
  expect(graphLoadTime - start).toBeLessThan(100)
})
```

---

## CI Requirements

Every PR must pass:

1. `vitest run` — all unit + integration tests green
2. `playwright test` — all E2E specs green
3. Data validation tests — `languages.json` and `graph.json` pass schema checks
4. No new axe violations on any tested page

Do not merge if any of these fail. The DAG validation and data validation tests are particularly non-negotiable — bad data causes silent rendering failures that are hard to debug.

---

## Test-First Rules for This Project

Follow the TDD rules in this CLAUDE.md — tests first, then implementation.

**Project-specific additions:**
- Before adding a new node to `languages.json`, write the data validation test that would catch a malformed version of it.
- Before implementing any new traversal helper, write the test case that covers the multi-parent (DAG) scenario — not just the single-parent case.
- Before implementing any UI component, write the Playwright E2E spec for its happy path and at least one error/null state (e.g. `youtube_id: null`).
- The English path E2E spec is the regression canary — it must pass after every change.
