# Visual & Audio Direction

## Tone

- **Not:** museum exhibit, textbook, Wikipedia
- **Yes:** cinematic, time-travelling — a beautifully art-directed documentary about human history
- The map is the stage; each language node has its own flavour through region colour, speech bubble style, and ambient audio

---

## Branch Colour Palettes

Each IE branch has a distinct colour used on region outlines, node markers, and migration arrows.

| Branch | Primary | Accent |
|---|---|---|
| Proto-Indo-European | Ochre `#C4913A` | Bone `#E8DCC8` |
| Anatolian † | Terracotta `#B85C38` | Stone grey `#8C8070` |
| Indo-Iranian | Saffron `#D4813A` | Deep red `#8B2020` |
| Hellenic | Terracotta red `#C0392B` | Cream `#F5F0E8` |
| Italic / Romance | Imperial purple `#6B3FA0` | Marble white `#F0EDE8` |
| Celtic | Emerald `#2E7D52` | Gold `#C8A840` |
| Germanic | Iron blue `#3A5A7C` | Amber `#C8821A` |
| Balto-Slavic | Deep blue `#2C4A8C` | Red `#B02020` |
| Armenian | Crimson `#8C1A1A` | Lapis `#2040A0` |
| Albanian | Earthy red `#A04030` | Ochre `#C4913A` |
| Tocharian † | Dusty rose `#A07060` | Sand `#D4C4A0` |

Extinct branches: apply `filter: grayscale(80%) opacity(60%)` on top of branch colour.

---

## Typography

- **Language names + info panel headers:** EB Garamond or Cormorant Garamond (humanist serif with historical weight)
- **UI chrome** (timeline, controls, side menu labels): Inter
- **Native script rendering:** Noto font family (covers Greek, Devanagari, Cyrillic, Arabic, Armenian, Georgian, runic, cuneiform approximations, etc.)
- **PIE reconstructions:** asterisk prefix, italic, with small "reconstructed" label

---

## Speech Bubble Visual Style

Bubbles shift style as the timeline advances:

| Era | Bubble style |
|---|---|
| PIE / Bronze Age | Rough organic shape, parchment fill, heavier stroke |
| Classical (Greek, Latin) | Cleaner oval, lighter stroke, serif text |
| Medieval (Old Norse, Old English) | Slightly angular, vellum tone |
| Early Modern onward | Clean modern speech bubble shape |

---

## Node Markers on Map

- Small circle at `geo_bounds` centroid
- Filled with branch palette primary colour
- **Extinct nodes:** hollow circle with dagger (†) label
- **Active node:** pulsing glow animation (CSS `box-shadow` / SVG filter)
- **Hover:** scale up 1.2× + tooltip with language name

---

## Ambient Audio Per Branch

Audio plays as a looping ambient layer when a node is active. Fades in on enter, fades out on exit. Crossfades during transitions.

| Branch / Region | Audio character |
|---|---|
| PIE (Pontic steppe) | Wind, distant horses, sparse percussion |
| Anatolian | Stone echo, dry wind, distant crowd |
| Indo-Iranian / Sanskrit | Sitar drone, river, birds |
| Hellenic | Lyre, Aegean waves, cicadas |
| Italic / Latin | Forum crowd murmur, marble echo |
| Celtic | Tin whistle, rain, fire |
| Germanic / Norse | Wind, oar strokes, distant horn |
| Germanic / Old English | Rain on thatch, fire crackle |
| Slavic | Balalaika-adjacent drone, forest wind |
| Modern languages | Subtle city ambient |

**Controls:** Mute toggle always visible. Mobile: off by default, opt-in tap.

---

## Transition Visuals

| Moment | Visual |
|---|---|
| Node exit | Speech bubbles sink + fade; region outline fades; info panel slides out |
| Map pan (mid-transition) | Smooth GSAP transform; year counter ticks; brief zoom-out mid-flight for long jumps |
| Node enter | Region outline draws in (stroke-dashoffset); speech bubbles float up staggered; info panel slides in |
| Dead branch hover | Region desaturated + grey pulse; "last attested [date]" tooltip |
| Overview mode | All migration paths visible at low opacity; all regions faintly outlined |

---

## Shareability

- Each node has a canonical URL (`/language/old-norse`)
- OpenGraph meta per node: language name, date range, interesting fact, branch colour background
- "Share this language" button in info panel

---

## City Label Style

Historical name + modern in brackets: e.g. "Londinium [London]", "Byzantium [Istanbul]"
