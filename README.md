# OPENLAB

Build more with what you already have. A searchable catalogue of low-cost STEM
projects — components, code, CAD and safety notes — plus a **cost-down engine**
that refits any project to your budget, and an inventory mode that tells you
what you can build *right now* from parts you already own.

**[Try it → anantamracing.com/hackathon/openlab/](https://anantamracing.com/hackathon/openlab/)**

An independent project, supported and showcased by
[Anantam Hackathon](https://hackathon.anantamracing.com/).

---

## The problem it is pointed at

Three separate blockers, which most "STEM resource" sites treat as one:

- **No money.** → the cost-down engine, below.
- **No equipment.** → inventory mode: enter what you have, see what is buildable.
- **No idea what exists.** → a browsable catalogue of **29 resources**, by
  subject, each with its bill of materials, code, CAD and safety notes.

## The cost-down engine

This is the part worth reading the source for. Given a resource and a budget,
it does not just report "too expensive" — it rebuilds the bill of materials:

```
while over budget and something can still change:
    take the most expensive remaining line
    swap it for the cheapest alternative that keeps the core function
        (alternative.impact <= 0.6)
    if still over budget: drop optional components entirely
```

Each component carries its alternatives with an **`impact`** score, an
`impactText` explaining what you lose, and an `availability`. The threshold is
a named constant — `MAX_CORE_IMPACT = 0.6` — above which an alternative is no
longer considered to keep the project's core function, so the engine degrades
the build rather than silently breaking it. Alternatives can chain (X → Y where
Y has its own alternatives); the engine follows **one level** of chaining,
which is a deliberate stopping point rather than an oversight.

The result is a modified parts list, a new total, and a plain statement of what
each substitution costs you in capability.

## CAD that is actually printable, or cuttable

`cad/` is not decorative — eight files, in two deliberate formats:

| OpenSCAD (`.scad`) | SVG (`.svg`) |
|---|---|
| braille-cell-plate · ldr-tracker-mount · spectrometer-body | line-follower-chassis · spectrometer-cardboard-template · tactile-graph-grid · theodolite-protractor · wind-turbine-blade |
| for a 3D printer | for a cutter, or scissors and card |

The spectrometer ships both ways — a printed body and a cardboard template for
the same instrument. That is the whole thesis of the project in one pair of
files.

## Contribution and moderation, as pages

`contribute/` and `moderation/` exist because a catalogue that only one person
can add to is a list, not an ecosystem. They are client-side — there is no
server to post to — so they are the interface for a workflow, not a live
backend. Said plainly here so nobody expects submissions to go anywhere.

## Stack

Plain HTML, CSS and ES modules across eight pages, no build step, no npm
dependencies, no backend. State is `localStorage` (your inventory, your
drafts). The only outbound requests are web fonts; licence links to
`opensource.org` and `creativecommons.org` are links, not loads.

## Getting started

```bash
git clone https://github.com/DDXPlayz/openlab.git
cd openlab
python3 -m http.server 4321
```

Then open `http://localhost:4321/`.

> **Two differences from the canonical copy, both so a bare clone works.**
> In the monorepo this project is served from `/hackathon/openlab/` and assumed
> that path in two places, so a fresh clone rendered unstyled with a broken nav.
>
> 1. **The 16 favicon and stylesheet links** in the eight HTML files are now
>    relative (`openlab.css` at the root, `../openlab.css` one level down).
> 2. **`BASE` in `js/ui.js` is derived rather than hardcoded.** That one
>    constant builds every nav link, breadcrumb, resource URL, CAD download and
>    the CAD `fetch()` — about forty call sites — so it was the real blocker:
>
>    ```js
>    export const BASE = new URL('../', import.meta.url).pathname;
>    ```
>
>    This module always lives at `<appRoot>/js/ui.js`, so `'../'` relative to
>    its own URL *is* the application root, whatever that root happens to be.
>
> Both resolve correctly at every root, production included, so this is a
> strict improvement rather than a fork — but it is a difference from the
> deployed copy and it should be said.

## Project structure

```
index.html            catalogue home, browse by subject, recent changes
search/index.html     full-text search
resource/index.html   a single resource: BOM, code, CAD, safety
costdown/index.html   budget → rebuilt bill of materials
inventory/index.html  what you own → what you can build
contribute/index.html submission form (client-side)
moderation/index.html review queue (client-side)
docs/index.html       documentation
js/
  resources.js        the catalogue — 29 resources, 1,362 lines
  components.js       component database: costs, alternatives, impact, availability
  costdown.js         the cost-down engine
  inventory.js        buildability against owned parts
  search.js           indexing and query
  store.js  ui.js
  pages/              one module per page
cad/                  3 OpenSCAD + 5 SVG files
openlab.css
```

## Status & verification

**Status:** live and working. Stable; not under active development.

| Claim | How it was checked |
|---|---|
| Live at the URL above | HTTP 200, checked 2026-11-19 |
| 29 resources in the catalogue | counted from `js/resources.js` |
| 8 CAD files, 3 OpenSCAD + 5 SVG | counted from `cad/` |
| Runs from a bare clone | **run in a browser** at a plain `/` root: 11/11 paths at 200, `BASE` resolves to `/`, nav and breadcrumbs correct from depth 0 and depth 1, all 5 tested CAD `fetch()` calls returned 200, zero console errors |
| Cost-down threshold is explicit | verified — `MAX_CORE_IMPACT = 0.6`, a named constant |
| No backend | verified — the only `fetch()` in the project loads a static CAD file; no application endpoint, no `XMLHttpRequest` |

**Not verified:** whether the component costs reflect current market prices
(they are point-in-time figures in INR); whether the CAD files have been
printed or cut and fitted; cross-browser rendering beyond the development
machine.

## Credits

Written by **Dhruva Goyal**. No third-party code is included.

## Licence

[MIT](LICENSE).
