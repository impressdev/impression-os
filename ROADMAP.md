# Roadmap

The path from an empty repository to a system that turns a brief into a
production-grade Elementor Pro website. Phases are sequential: each one depends on
the layers established before it. Dates are intentionally omitted — the sequence
is the commitment, not the calendar.

**Legend:** ✅ done · 🚧 in progress · ⬜ not started

---

## Phase 0 — Foundation of the repository ✅

Establish the architecture, vocabulary, and rules before any code exists.

- ✅ Repository bootstrap: structure, licensing, and top-level documentation.
- ✅ Project charter, agent operating guide, and roadmap.
- ✅ Layer definitions and dependency contract.

## Phase 1 — Tokens: the source of truth ✅

Encode every design decision as versioned, machine-legible data.

- ✅ Token schema and validation rules ([`tokens/schema/`](tokens/schema/token.schema.json)).
- ✅ Core token sets: color, typography, spacing, radius, shadow, breakpoints, z-index ([`tokens/primitives/`](tokens/primitives/)).
- ✅ Semantic token layer (roles: `surface`, `text`, `accent`, `muted`, …) on top of primitives ([`tokens/semantic/`](tokens/semantic/) + [`tokens/themes/`](tokens/themes/)).
- ✅ Theming model: light/dark and brand overrides ([`tokens/themes/`](tokens/themes/)).
- ✅ Mapping strategy from tokens to Elementor Pro global styles ([docs](docs/architecture/token-to-elementor-mapping.md)).

## Phase 2 — Foundation: the design laws ✅

Turn tokens into enforceable design principles.

- ✅ Spatial system: grid, container widths, spacing rhythm ([`foundation/grid/`](foundation/grid/), [`foundation/spacing/`](foundation/spacing/)).
- ✅ Typographic system: type scale, line-length, vertical rhythm ([`foundation/typography/`](foundation/typography/)).
- ✅ Hierarchy and layout primitives ([`foundation/hierarchy/`](foundation/hierarchy/)).
- ✅ Accessibility contracts: contrast, semantics, focus order, motion ([`foundation/accessibility/`](foundation/accessibility/)).

## Phase 3 — Components: the atomic units ✅

Author the reusable building blocks, each mapped to Elementor widgets.

- ✅ Component specification format (props, states, token bindings, a11y notes) ([`components/schema/`](components/schema/component.schema.json)).
- ✅ Primitive components: button, heading, text, media, icon, badge ([`components/primitives/`](components/primitives/)).
- ✅ Composite components: card, list item, form field, navigation item ([`components/composites/`](components/composites/)).
- ✅ Component-level accessibility and state coverage (`a11y` block + focus/disabled states per spec).

## Phase 4 — Recipes: composed sections ✅

Compose components into complete, opinionated sections.

- ✅ Recipe specification format and content contracts ([`recipes/schema/`](recipes/schema/recipe.schema.json)).
- ✅ Core sections: hero, feature grid, pricing, testimonial, FAQ, CTA, footer, header ([`recipes/sections/`](recipes/sections/), [`recipes/chrome/`](recipes/chrome/)).
- ✅ Responsive behavior definitions per recipe (`responsive` block).
- ✅ Content-shape validation (each recipe's `content` contract; component references linted).

## Phase 5 — Builder: the compiler ✅

Build the engine that resolves the layers into an Elementor Pro kit.

- ✅ Resolve a build plan against tokens, foundation, components, and recipes ([`builder/src/`](builder/src/)).
- ✅ Emit Elementor Pro global styles (kit) from semantic tokens ([`builder/src/kit.js`](builder/src/kit.js)).
- ✅ Emit importable section/page templates from recipes ([`builder/src/template.js`](builder/src/template.js)).
- ✅ Deterministic, reproducible output guarantees (hash-derived ids; byte-stability asserted in [`builder/test/`](builder/test/)).

## Phase 6 — Prompts: the intent layer ✅

Define how a client brief becomes a deterministic build plan.

- ✅ Brief schema (client, goals, content, brand inputs) ([`prompts/brief/`](prompts/brief/brief.schema.json)).
- ✅ Prompt library that maps intent to recipes, content, and theme ([`prompts/planning/`](prompts/planning/) — system + task prompts, blueprints, build-plan contract).
- ✅ Guardrails that keep generation inside the system ([`prompts/guardrails/`](prompts/guardrails/) — prose + machine-checkable).

## Phase 7 — Quality harness ✅

Make "professional" a testable property.

- ✅ Schema validation for tokens, components, and recipes (plus briefs and plans) — zero-dependency validator ([`tests/lib/jsonschema.js`](tests/lib/jsonschema.js), [`tests/schema.test.mjs`](tests/schema.test.mjs)).
- ✅ Automated accessibility checks — contrast contracts per theme ([`tests/accessibility.test.mjs`](tests/accessibility.test.mjs)).
- ✅ Regression against reference output — snapshot baselines ([`tests/visual/`](tests/visual/)); pixel regression awaits a renderer.
- ✅ CI that gates every change on the full harness ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Phase 8 — First generated site ✅

Prove the whole pipeline end to end.

- ✅ A structured brief → a full Elementor Pro kit ([`examples/northwind/`](examples/northwind/): 8 sections, 59 widgets).
- ◑ Import into WordPress; verify it is clean and fully editable — **manual step documented** with an import guide + verification checklist ([example README](examples/northwind/README.md)); live WordPress verification needs a WP environment ([ADR-0008](docs/decisions/0008-example-as-living-proof.md)).
- ✅ Commit the result to [`examples/`](examples/) as living proof.
- ✅ Reproduce byte-stable from the same brief and version (provenance checksum, verified in [`tests/example.test.mjs`](tests/example.test.mjs)).

> **You are here.** The full pipeline runs end-to-end and is committed as a
> reproducible, CI-verified example. The one remaining step — rendering the kit in
> a live WordPress + Elementor environment — is documented as a manual procedure.

---

## Post-roadmap: what's next

The eight phases establish the system end-to-end. Progress since:

- ✅ **More recipes and components** — stat, stats, logo-cloud, team, gallery,
  contact (lead form), announcement-bar; `lead` blueprint.
- ✅ **Brand theming at scale** — `impression theme` generates per-client brand
  themes with accent steps chosen by contrast to meet AA, including **ramp
  synthesis from a single brand hex** ([ADR-0009](docs/decisions/0009-contrast-driven-brand-themes.md)).
- ✅ **Multi-page sites** — `plan-site` / `build-site`: one shared kit, per-page
  templates + metadata, sitemap, robots.txt, web manifest, JSON-LD
  (Organization, WebPage, BreadcrumbList), orphan-page warnings.
- ✅ **A first-class CLI** in [`tools/`](tools/) — 13 commands wrapping the
  builder, the planner, theming, and the harness.
- ✅ **HTML preview** — `preview` / `preview-site` render the compiled output to
  self-contained HTML, so generated sites are visible without WordPress.
- ✅ **The Studio** — `impression studio`: a local, zero-dependency GUI with a
  brief form, a live preview, a contrast-safe brand-color picker, and a
  kit download.

Still open:

- ◑ A **WordPress + Elementor render harness** — the import half exists and is
  proven: [`tools/wp/import-kit.php`](tools/wp/import-kit.php) applies a
  generated kit to a live Elementor install and renders it (validated against
  MAMP + Elementor Pro; the first import surfaced and fixed a Global Colors
  mapping bug). Still open: automated screenshots + pixel regression.
- Richer dark-mode packaging (the open questions in the
  [token → Elementor mapping](docs/architecture/token-to-elementor-mapping.md)).
- Multi-page support in the Studio.

## Tooling & docs (continuous)

Advances alongside every phase, not as a separate stage.

- ◑ CLI for authoring, validating, building, and shipping — the `impression` CLI ([`tools/`](tools/)) covers build, validate, lint, list, and new; packaging/shipping still to come.
- ✅ Architecture decision records in [`docs/decisions/`](docs/decisions/) — ADR-0001 through ADR-0009.
- ✅ Contribution and authoring guides — [`CONTRIBUTING.md`](CONTRIBUTING.md) + [`docs/guides/`](docs/guides/) (token, component, recipe, theme).

---

## Guiding constraints

These hold across every phase and override local convenience:

1. **Lower layers land before higher ones.** No recipe before its components; no
   builder before what it compiles.
2. **Every phase ships its tests.** A layer is not "done" until it is guarded.
3. **Determinism is never traded away** for a faster path.
4. **Documentation is part of the deliverable**, not a follow-up.

See [PROJECT.md](PROJECT.md) for the full charter and [CLAUDE.md](CLAUDE.md) for
the working rules that apply while executing this roadmap.
