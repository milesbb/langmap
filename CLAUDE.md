# CLAUDE.md

## Project: LangMap — Proto-Indo-European Language Family Tree

An interactive website mapping the full PIE language family. Users explore a custom SVG world map — clicking language nodes pans and zooms the map, highlights geographic regions, shows speech bubbles in original script, and plays ambient audio. North star reference: fallen.io/ww2.

**Stack:** Vite + Vanilla JS (no framework), GSAP (all animations), d3-zoom (pan/zoom), D3.js (data traversal only — not tree layout), Howler.js (audio), hash-based routing (`/language/old-english`), deploy to Vercel.

**Critical decisions — never violate these:**
- The language graph is a **DAG, not a tree.** `parent_ids` is always an array. Multi-parent nodes (e.g. Middle English ← Old English + Old French Norman) must render from day one.
- Every node = a real named language or proto-language. Academic groupings ("West Germanic", "Indo-Aryan") are **never nodes** — they are metadata in the `groups[]` field only.
- Only animate `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, or SVG path `d` — these trigger layout recalculation and cause jank.
- SVG map is equirectangular, `viewBox="0 0 10000 5000"`. Region elements use `id="region-{region_id}"`, toggled via CSS `display: block`. A v1 placeholder is generated from Natural Earth GeoJSON; Miles will replace it with an illustrated version at the same IDs — no code changes needed.
- Three data files loaded in priority order: `graph.json` (~15KB, load immediately) → `languages.json` (~100KB gzipped, load after first paint) → `nodes/{id}.json` (on-demand escape hatch, not needed yet).
- `youtube_id` is always nullable and never a launch blocker. Render a placeholder when null.
- Audio off on mobile by default; opt-in via 🔊 icon.

**Spec docs — automatically included below via @ imports. Do not implement anything without reading them.**

@docs/BUILD_PLAN.md
@docs/MAP_DESIGN.md
@docs/TECH_STACK.md
@docs/VISUAL_DIRECTION.md
@docs/PERFORMANCE.md
@docs/ROADMAP.md
@docs/TESTING.md

**Note on TypeScript:** The stack is Vite + Vanilla JS. The TypeScript rules below apply if/when TypeScript is introduced; otherwise apply the same principles to JSDoc types.

---

## Keeping Docs and Roadmap in Sync — Non-Negotiable

**For every change you make, you MUST update documentation to match. Both places. Every time.**

### In the repository (`docs/`)

If your change affects any of the following, update the relevant doc file before the task is complete:

- Architecture, file structure, or tech decisions → `docs/TECH_STACK.md`
- Data schema, node rules, build phases, or node count → `docs/BUILD_PLAN.md`
- Map interactions, animation sequences, region IDs, or SVG structure → `docs/MAP_DESIGN.md`
- Visual style, colours, typography, or audio → `docs/VISUAL_DIRECTION.md`
- Data loading strategy, caching, or performance approach → `docs/PERFORMANCE.md`
- Testing strategy or new test patterns → `docs/TESTING.md`
- Phase checklists, decisions log, or risks → `docs/ROADMAP.md`

**`docs/ROADMAP.md` must always reflect reality.** When you complete a checklist item, tick it. When you add work that wasn't planned, add it. When a decision changes, update the decisions log. The roadmap is a living document, not a snapshot.

### In Notion

The Notion workspace is the source of truth for Miles and any collaborators who don't work in the codebase. If a change affects a decision, spec, or plan that is documented in Notion, update the relevant Notion page using the Notion MCP tools.

**Notion pages to keep in sync:**

| What changed | Notion page to update |
|---|---|
| Architecture or tech decisions | ⚙️ Tech Stack |
| Node schema, DAG rules, or build phases | 🛠️ Build Plan — Phased Node Rollout |
| Map interactions, animation, or SVG structure | 🗺️ Map Design Spec |
| Visual style, colours, audio | 🎨 Visual & Audio Direction |
| Data loading or performance approach | ⚡ Performance & Data Architecture |
| Phase checklists or decisions | 🛣️ Implementation Roadmap |

Use `mcp__notion__notion-update-page` or `mcp__notion__notion-create-pages` to write changes. Do not leave Notion out of date.

### The rule

A task is not done until:
1. The code change is made.
2. The relevant `docs/` file(s) are updated.
3. The relevant Notion page(s) are updated.
4. `docs/ROADMAP.md` reflects the current state (ticked if complete, added if new).

If a doc update is genuinely not needed for a change, say so explicitly before moving on.

---

## TypeScript — Non-Negotiable Rules

**Always explicit types.** Every function parameter, return type, and variable that isn't trivially inferred must be typed. All exported/public function return types must be explicit — never rely on inference for anything callable from outside the file.

**Never use `any`.** If you think you need `any`, find the real type. The only acceptable exception is third-party library boundary issues where the correct type is genuinely unavailable.

**Never use `unknown`** unless you are immediately narrowing it with a type guard in the next line.

**Never use type assertions (`as SomeType`)** except at verified external boundaries (JSON parsing, DOM event targets). If you feel you need `as`, find the real type instead.

Use `interface` for object shapes, `type` for unions and aliases. Prefer specific types over broad ones — `string` over `unknown`, `User` over `Record<string, unknown>`. Avoid `Record<string, unknown>` — always give the value a concrete type.

Prefer discriminated unions over optional fields when a value's presence depends on a state flag. Use `satisfies` to validate object literals against a type without widening. Use `as const` on literal tuples and enum-like objects.

## Functions

Functions should be **small and single-purpose.** Maximum ~20 lines; if longer, extract named helpers. Name functions after what they return or what they do, not how they do it. Prefer `async/await` over promise chains.

## Implementation Principles

**Simple over clever.** The obvious implementation is correct until proven otherwise. No abstractions unless the same pattern appears in three or more places. No defensive coding for impossible cases — trust TypeScript and internal invariants. No feature flags, backwards-compat shims, or speculative generality. Validate only at system boundaries (external API responses, user input).

## Comments

No comments by default. Only add a comment when the **why** is non-obvious — a hidden constraint, a workaround, a subtle invariant. If you'd write "this does X", don't write it.

## Imports

No barrel files (`index.ts` re-exports) except where the package boundary requires it. Import from the specific file, not a directory index.

## Error Handling

Propagate errors up — don't swallow them silently. Only catch errors you intend to handle; let others bubble to the error handler.

## Testing — Non-Negotiable

**For every change you make, you MUST:**

1. **Ask: can a Vitest unit test cover this?** If yes, write or update it. No exceptions.
2. **Ask: can a Playwright E2E test cover this?** If yes, write or update it. No exceptions.
3. **Ask: does this affect an axe-testable UI surface?** If yes, add or update the axe check.

This is not optional. Do not report a task as done if testable behaviour is uncovered by tests. The question is never "should I add a test?" — it is always "what kind of test covers this?"

**TDD order:**
1. Write a failing test that specifies the expected behaviour.
2. Write the minimum code to make it pass.
3. Refactor — keep tests green.

**Vitest (unit + integration):**
- Mock at the boundary of the layer under test. Test behaviour, not implementation.
- Pure utility functions: test before coding.
- UI components: write render and interaction tests before wiring state.
- Bug fixes: write a failing test that reproduces the bug before patching it.
- Every component test file must include an axe check: `import { axe } from 'vitest-axe'` with `it('has no accessibility violations', ...)` as the first test in the first render block.

**Playwright (E2E):**
- Every user-facing flow must have an E2E spec covering the happy path and at least one error/null/edge case.
- Do not add a new page, panel, or navigation flow without a Playwright spec.
- After any change to a transition, animation trigger, or URL routing — update the relevant E2E spec.
- The English-path E2E spec (`PIE → Modern English`) is the regression canary and must pass after every change.

**When Playwright is not applicable** (e.g. a pure data utility with no DOM output), say so explicitly before moving on. Silence is not acceptable — every change gets an explicit test decision.
