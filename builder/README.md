# Builder

**The compiler of Impression OS.**

The builder is the engine that turns the system into a shippable artifact. It
takes a build plan (from [`prompts/`](../prompts/)), resolves it against tokens,
foundation, components, and recipes, and emits an **Elementor Pro kit**: global
styles plus importable section and page templates.

## Why this layer exists

Everything below the builder is a *description* — data and rules. The builder is
what makes those descriptions *real*, deterministically, in a format Elementor Pro
can import and a human can edit. It is the single place where the abstract system
meets the concrete platform.

## Responsibilities

- **Resolve** a build plan against the full layer stack.
- **Emit global styles** — translate semantic tokens into an Elementor Pro kit
  (global colors, fonts, and settings).
- **Emit templates** — translate recipes into importable Elementor section/page
  templates.
- **Guarantee determinism** — identical input and version produce byte-stable
  output.
- **Guarantee editability** — output is clean Elementor with no orphaned or broken
  styles.

## The pipeline

```
build plan ─▶ resolve (tokens · foundation · components · recipes)
           ─▶ emit kit globals   (colors, fonts, settings)
           ─▶ emit templates     (sections, pages)
           ─▶ Elementor Pro Kit  ─▶  import into WordPress
```

## Implementation

The builder is **Node.js (ESM, JavaScript with JSDoc types), zero dependencies,
no build step** — the pragmatic production choice for a pure-JSON toolchain that
must run and be verified anywhere Node ≥ 20 exists. See
[ADR-0005](../docs/decisions/0005-builder-runtime-and-architecture.md).

```
builder/
├── src/
│   ├── index.js      Public API: build(root, brief) → { kit, tokens, templates }
│   ├── load.js       Read tokens (via manifest), components, recipes, grid
│   ├── resolve.js    Resolve a theme's tokens into concrete values ($extends, deref)
│   ├── kit.js        Resolved tokens → Elementor Pro kit (global colors + fonts + layout)
│   ├── template.js   Recipe + content → Elementor template tree
│   ├── elementor.js  Element factories + deterministic ids
│   └── util.js       readJSON, hashId, parseDimension, stableStringify
├── bin/impression-build.js   CLI
└── test/             Smoke tests (determinism + invariants)
```

## Usage

```bash
# from the repo root
node builder/bin/impression-build.js \
  --brief builder/test/fixtures/landing.brief.json \
  --out dist --root .
```

Produces `dist/kit.json` (the Elementor Site Settings kit),
`dist/templates/<section>.json` (one importable template per section), and
`dist/page.json` (page metadata — title, meta description, Open Graph — derived
from the plan's `seo` block or from `meta.name` + the hero content). Or use the
API:

```js
import { build, writeBuild } from './builder/src/index.js';
const result = build('.', { theme: 'light', sections: [{ recipe: 'hero', content }] });
writeBuild(result, 'dist');
```

## Multi-page sites

`buildSite(root, sitePlan)` compiles a [site plan](../prompts/planning/site-plan.schema.json)
into **one shared kit** plus per-page templates and metadata; `writeSite` lays it
out as `kit.json`, a `site.json` index, `sitemap.json` + `sitemap.xml`, and
`pages/<slug>/{templates/*, page.json}`. Each page gets a distinct, SEO-friendly
title. Use it via `impression build-site`, which also warns about **orphan pages**
(generated but not linked from any nav, footer, or CTA).

## The pipeline

```
brief ─▶ load ─▶ resolve(theme) ─▶ ┌ kit.js       → kit.json (globals)
                                   └ template.js  → templates/*.json
```

## Conventions

- **Deterministic only.** Ids derive from a hash of each element's path; there is
  no randomness or wall-clock dependence. The same root + brief is byte-stable
  (asserted in `test/`).
- **Clean output.** Kits are standard Elementor Site Settings; templates are
  standard element trees — fully editable, no custom runtime.
- **No design decisions here.** The builder *renders* decisions; it never *makes*
  them. Every value it emits traces back to a token.

## Scope of this phase

Fully implemented: token resolution (per theme, with `$extends` and dereferencing)
and the kit emitter (global colors, fonts, and layout defaults). The recipe →
template compiler emits the full container/widget tree from a recipe's layout and
binds content to widgets by a documented field-matching heuristic; the complete
brief → content mapping is the job of [`prompts/`](../prompts/)
([Phase 6](../ROADMAP.md#phase-6--prompts-the-intent-layer)).

## Dependencies

Reads [`recipes/`](../recipes/), [`components/`](../components/),
[`foundation/`](../foundation/), and [`tokens/`](../tokens/); consumes a build
plan/brief that [`prompts/`](../prompts/) will produce. Output is validated by
[`tests/`](../tests/).

## Status

✅ **Implemented** — resolver, kit emitter, recipe→template compiler, CLI, and a
passing smoke test (6 checks incl. byte-stability). See
[Phase 5](../ROADMAP.md#phase-5--builder-the-compiler).
