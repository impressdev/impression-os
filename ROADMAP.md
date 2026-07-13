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

> **You are here.** Tokens and the design laws are complete. Next up: Components.

## Phase 3 — Components: the atomic units ⬜

Author the reusable building blocks, each mapped to Elementor widgets.

- ⬜ Component specification format (props, states, token bindings, a11y notes).
- ⬜ Primitive components: button, heading, text, media, icon, badge.
- ⬜ Composite components: card, list item, form field, navigation item.
- ⬜ Component-level accessibility and state coverage.

## Phase 4 — Recipes: composed sections ⬜

Compose components into complete, opinionated sections.

- ⬜ Recipe specification format and content contracts.
- ⬜ Core sections: hero, feature grid, pricing, testimonial, FAQ, CTA, footer, header.
- ⬜ Responsive behavior definitions per recipe.
- ⬜ Content-shape validation (what a recipe needs to render well).

## Phase 5 — Builder: the compiler ⬜

Build the engine that resolves the layers into an Elementor Pro kit.

- ⬜ Resolve a build plan against tokens, foundation, components, and recipes.
- ⬜ Emit Elementor Pro global styles (kit) from semantic tokens.
- ⬜ Emit importable section/page templates from recipes.
- ⬜ Deterministic, reproducible output guarantees.

## Phase 6 — Prompts: the intent layer ⬜

Define how a client brief becomes a deterministic build plan.

- ⬜ Brief schema (client, goals, content, brand inputs).
- ⬜ Prompt library that maps intent to recipes, content, and theme.
- ⬜ Guardrails that keep generation inside the system.

## Phase 7 — Quality harness ⬜

Make "professional" a testable property.

- ⬜ Schema validation for tokens, components, and recipes.
- ⬜ Automated accessibility checks (contrast, semantics, focus).
- ⬜ Visual regression against reference renders.
- ⬜ CI that gates every change on the full harness.

## Phase 8 — First generated site ⬜

Prove the whole pipeline end to end.

- ⬜ A structured brief → a full Elementor Pro kit.
- ⬜ Import into WordPress; verify it is clean and fully editable.
- ⬜ Commit the result to [`examples/`](examples/) as living proof.
- ⬜ Reproduce byte-stable from the same brief and version.

## Tooling & docs (continuous)

Advances alongside every phase, not as a separate stage.

- ⬜ CLI for authoring, validating, building, and shipping.
- ⬜ Architecture decision records in [`docs/`](docs/).
- ⬜ Contribution and authoring guides.

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
