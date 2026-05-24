# Build Plan — Phased Node Rollout

## Goal

Ship every language that has ever descended from PIE — living, extinct, attested, and poorly-attested. Final target: **~350–400 nodes**. The map is world-wide (excluding Antarctica) to future-proof for non-IE language families in later versions.

`youtube_id` is nullable and never required before any phase ships. Render a placeholder when absent.

---

## Node Philosophy — Critical Rules

### 1. Every node is a language, not a folder

No node may be a classification group. "West Germanic", "Indo-Aryan", "Romance languages" are academic groupings — not nodes. Every node must represent an actual named language or proto-language that real people spoke (or linguists reconstructed as a coherent speech community).

- ✅ `proto-germanic` — reconstructed language, spoken ~500 BCE–200 CE
- ✅ `old-english` — spoken ~450–1100 CE
- ❌ `west-germanic` — academic grouping, NOT a node
- ❌ `indo-aryan` — subgroup label, NOT a node

Where a named proto-language exists and is linguistically meaningful, include it. Where it doesn't, draw the edge directly from parent to child languages.

### 2. Multiple parents are a first-class feature

The graph is a **DAG (directed acyclic graph)**, not a tree. `parent_ids` is always an array. Multi-parent nodes must render correctly from day one — Middle English is the required test case.

| Language | Parent 1 | Parent 2 | Nature |
|---|---|---|---|
| Middle English | Old English | Old French (Norman) | Norman Conquest 1066; ~60% vocab from French/Latin |
| Yiddish | Middle High German | Hebrew / Aramaic | Jewish communities; massive religious lexicon |
| Afrikaans | Dutch | Malay, Khoikhoi, Portuguese Creole | Cape Colony contact language |
| Maltese | Siculo-Arabic | Sicilian / Italian | Arabic base + heavy Romance overlay |
| Ladino | Old Spanish | Hebrew / Aramaic | Sephardic diaspora |
| Romani | Sanskrit (via Prakrits) | Greek, then various European | Layer-by-layer absorption during migration |
| Hindustani | Apabhramsha | Persian / Arabic | Mughal court register |
| Urdu | Hindustani | Persian, Arabic | Same base as Hindi; distinct node |
| Tok Pisin | English | Melanesian substrate | Colonial contact language |
| Scots | Middle English | Old Norse, Scots Gaelic | Heavy Norse and Gaelic substrate |

### 3. Dialect inclusion rules

**In:** A dialect becomes a node if it has its own ISO 639-3 code AND diverged meaningfully enough that it (a) became a distinct modern language, or (b) spawned child languages of its own.

**Out:** Modern regional dialects with no children and no ISO code. Mention them in the parent node's info panel.

**Specifically excluded as nodes:** American English, Australian English, Brazilian Portuguese, Latin American Spanish, Austrian German.

**Specifically included:** Scots (`sco`), Nynorsk vs Bokmål (distinct written standards), Galician (`glg`).

---

## Node Schema

Each node in `languages.json`. The graph is a **DAG** — `parent_ids` is always an array.

```javascript
{
  id: "middle-english",
  name: "Middle English",
  native_name: null,
  parent_ids: ["old-english", "old-french-norman"],  // ARRAY — always
  parent_influence: {
    "old-english": "grammatical structure, core vocabulary",
    "old-french-norman": "~60% of vocabulary, legal/court register"
  },
  date_range: "1100–1500 CE",
  status: "extinct",  // living | extinct | liturgical | reconstructed
  region: "England",
  region_id: "region-england",
  geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
  speakers_culture: "English people post-Norman Conquest",
  split_reason: "Norman Conquest 1066; Old English absorbed massive French vocabulary and simplified its case system",
  interesting_fact: "The word 'beef' comes from Norman French (boeuf) while 'cow' comes from Old English — the animal had an English name, the food a French one.",
  sample_words: [
    { word: "knyght", lang_script: null, meaning: "knight" },
    { word: "beaute", lang_script: null, meaning: "beauty (from French)" }
  ],
  speech_bubbles: [
    { text: "Hwæt — listen.", translation: "The old word survived into this new tongue." }
  ],
  youtube_id: null,           // nullable — never a launch blocker
  youtube_start_seconds: 0,
  wikipedia_url: "https://en.wikipedia.org/wiki/Middle_English",
  groups: ["Indo-European", "Germanic", "West Germanic"],  // broadest → most specific
  glottolog_id: "midd1317",
  iso_639_3: null,
  sources: ["Glottolog", "Wikipedia"]
}
```

**Status values:** `"living"` | `"extinct"` | `"liturgical"` | `"reconstructed"`

Reconstructed forms are prefixed with `*` (asterisk). `groups[]` powers the side menu folder tree and info panel breadcrumb trail.

**Coordinate formula for SVG viewBox `"0 0 10000 5000"`:**
```javascript
x = (lng + 180) / 360 * 10000
y = (90 - lat) / 180 * 5000
```

---

## Language Groups (metadata, not nodes)

Groups are captured in `groups[]` on each node — ordered broadest to most specific:

```javascript
groups: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Eastern Indo-Aryan"]
```

The side menu builds its folder tree from this field. The info panel shows it as a breadcrumb trail. Groups are never standalone nodes.

---

## Build Order

### Alpha: English Path — Full Test Case

Build the full end-to-end experience for one branch before expanding. English is chosen for its recognisability and dramatic multi-parent inflection point.

| # | Language | Date | Status |
|---|---|---|---|
| 1 | Proto-Indo-European | ~4500–2500 BCE | Reconstructed |
| 2 | Proto-Germanic | ~500 BCE–200 CE | Reconstructed |
| 3 | Proto-West-Germanic | ~200–700 CE | Reconstructed |
| 4 | Old English (Anglo-Saxon) | 450–1100 CE | Extinct |
| 5 | Old French (Norman dialect) | 900–1300 CE | Extinct |
| 6 | Middle English | 1100–1500 CE | Extinct |
| 7 | Early Modern English | 1500–1700 CE | Extinct |
| 8 | Modern English | 1700 CE–present | Living |

Required sibling nodes: Old Norse, Gothic †, Old High German, Old Saxon, Old Frisian, Middle French.

**MVP milestone:** English path navigable end-to-end. Multi-parent edge (Old English + Norman French → Middle English) renders correctly.

---

### Phase 1: Complete Germanic (~45 nodes)

**North Germanic:** Old Norse → Faroese, Icelandic, Norwegian (Bokmål), Norwegian (Nynorsk), Swedish, Danish, Norn †, Elfdalian (`ovd`)

**West Germanic:** Old High German → Middle High German → Modern German, Luxembourgish, Pennsylvanian German; Alemannic → Swiss German (`gsw`), Alsatian; Bavarian (`bar`); Old Saxon → Middle Low German → Low German (`nds`); Old Dutch → Middle Dutch → Dutch, Afrikaans (multi-parent); Old Frisian → West Frisian (`fy`), North Frisian (`frr`), Saterland Frisian (`stq`); Yiddish (multi-parent); Scots (`sco`)

**East Germanic:** Gothic † → Crimean Gothic †

---

### Phase 2: Complete Italic / Romance (~40 nodes)

Proto-Italic → Oscan †, Umbrian †, Faliscan †, Volscian †, Sabellic †; Old Latin → Classical Latin → Vulgar Latin

From Vulgar Latin: Spanish, Portuguese, Galician (`gl`), Mozarabic †, French, Occitan (`oc`), Franco-Provençal (`frp`), Romansh (`rm`), Ladin (`lld`), Friulian (`fur`), Italian, Neapolitan (`nap`), Sicilian (`scn`), Venetian (`vec`), Sardinian (`sc`), Dalmatian †, Romanian, Aromanian (`rup`), Catalan (`ca`), Ladino (multi-parent)

---

### Phase 3: Complete Slavic + Baltic (~45 nodes)

**Slavic:** Proto-Slavic → Old Church Slavonic; East: Old East Slavic → Russian, Ukrainian, Belarusian, Rusyn (`rue`); West: Czech, Slovak, Polish, Kashubian (`csb`), Upper/Lower Sorbian, Polabian †; South: Bulgarian, Macedonian, Serbian, Croatian, Bosnian, Slovenian

**Baltic:** Proto-Baltic → Old Prussian †, Lithuanian, Latvian, Latgalian (`ltg`), Curonian †, Selonian †, Galindian †

---

### Phase 4: Hellenic + Armenian + Albanian (~20 nodes)

**Hellenic:** Proto-Greek → Mycenaean †; Ancient Greek (Attic primary + Ionic †, Doric †, Aeolic †, Arcado-Cypriot †); Koine → Byzantine → Modern Greek; Pontic (`pnt`), Tsakonian (`tsd`), Cappadocian †

**Armenian:** Proto-Armenian → Classical Armenian (Grabar) → Middle Armenian → Eastern (`hye`), Western (`hyw`)

**Albanian:** Proto-Albanian → Old Albanian → Gheg (`aln`), Tosk (`als`), Arvanitika (`aat`), Arbëreshë (`aae`)

---

### Phase 5: Celtic (~25 nodes)

**Goidelic:** Proto-Goidelic → Old Irish → Middle Irish → Early Modern Irish → Modern Irish (`ga`), Scottish Gaelic (`gd`), Manx (`gv`)

**Brythonic:** Proto-Brythonic → Old Welsh → Welsh (`cy`); Old Cornish → Cornish (`kw`, revived); Old Breton → Breton (`br`); Cumbric †; Pictish †

**Continental Celtic:** Gaulish †, Galatian †, Celtiberian †, Lepontic †

---

### Phase 6: Complete Indo-Iranian (~120 nodes)

**Phase 6a — Iranian:** Avestan †, Old Persian → Middle Persian (Pahlavi) → Farsi, Dari, Tajik; Sogdian → Yaghnobi; Bactrian †, Khwarezmian †, Scythian †, Sarmatian †, Alan → Ossetian; Kurdish (Kurmanji `kmr`, Sorani `ckb`, Southern `sdh`); Pashto (`ps`), Balochi (`bal`), Zazaki (`zza`); Talysh (`tly`), Gilaki (`glk`), Mazanderani (`mzn`); Pamir languages

**Phase 6b — Indo-Aryan:** Vedic Sanskrit → Classical Sanskrit → Prakrits (Pali, Ardhamagadhi †, Gandhari †) → Apabhramsha †; From Apabhramsha: Hindustani (multi-parent), Bengali, Punjabi, Marathi, Gujarati, Odia, Assamese, Nepali, Sinhalese, Dhivehi; Bihari cluster; Rajasthani; Romani (multi-parent); Dardic: Kashmiri, Shina, Khowar, Kalasha; Sindhi, Saraiki, Dogri, Konkani

---

### Phase 7: Anatolian + Long Tail (~35 nodes)

**Anatolian:** Hittite †, Luwian †, Palaic †, Lycian †, Milyan †, Lydian †, Carian †, Sidetic †, Pisidian †

**Tocharian:** Tocharian A †, Tocharian B †

**Unclassified IE fringe:** Venetic †, Messapic †, Lusitanian †, Thracian †, Dacian †, Phrygian †, Illyrian †, Sicel †, Elymian †, Ligurian †, Liburnian †

**Creoles:** Tok Pisin (multi-parent), Bislama, Pijin, Sranan Tongo, Haitian Creole, Papiamento, Chavacano, Shelta

---

## Node Count Summary

| Phase | Focus | New Nodes | Cumulative |
|---|---|---|---|
| Alpha | English path | ~23 | ~23 |
| Phase 1 | Full Germanic | ~45 | ~68 |
| Phase 2 | Full Italic/Romance | ~40 | ~108 |
| Phase 3 | Slavic + Baltic | ~45 | ~153 |
| Phase 4 | Hellenic + Armenian + Albanian | ~20 | ~173 |
| Phase 5 | Full Celtic | ~25 | ~198 |
| Phase 6 | Full Indo-Iranian | ~120 | ~318 |
| Phase 7 | Anatolian + fringe + creoles | ~35 | ~353 |

**Current data status (as of 2026-05-24):** All ~131 nodes across Alpha + Phases 1–7 are written in Notion and ready to merge into `languages.json`. See the "Claude Code — Start Here" page for exact fetch instructions and reading order.

---

## Primary Data Sources

| Source | Use |
|---|---|
| [Glottolog](https://glottolog.org/resource/languoid/id/indo1319) | Authoritative family structure, parent-child relationships, glottocodes, extinct/living status |
| [Wikipedia — List of IE Languages](https://en.wikipedia.org/wiki/List_of_Indo-European_languages) | Cross-reference for structure |
| [Ethnologue](https://www.ethnologue.com/subgroup/4/) | ISO 639-3 codes, speaker counts, living language status |
| Wikipedia per-language articles | Narrative content: history, split reasons, interesting facts, sample words |
