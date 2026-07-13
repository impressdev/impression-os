# ADR-0004 — Recipe composition model

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 4 — Recipes](../../ROADMAP.md#phase-4--recipes-composed-sections)

## Context

Recipes are where the system expresses *taste*: complete sections (hero, pricing,
FAQ, footer) that read as professional rather than merely functional. The question
was how to model a section so that it is (a) composed from existing components and
foundation primitives — never bespoke markup, (b) explicit about the content it
needs, and (c) validatable and deterministically compilable to Elementor.

Two failure modes to avoid:

- **Re-implementation.** A recipe that restyles a button or re-draws a card breaks
  the single-source-of-truth guarantee.
- **Implicit content.** A recipe that assumes content shape leads the generator to
  improvise, which is exactly the non-determinism the system exists to remove.

## Decision

Model a recipe as **data** against
[`recipes/schema/recipe.schema.json`](../../recipes/schema/recipe.schema.json),
with three coupled parts:

1. **Layout by primitives + nested regions.** The section's arrangement is built
   from the fixed set of [foundation layout primitives](../../foundation/hierarchy/)
   (stack, cluster, grid, center, cover, split). Regions nest; a region renders
   its `components` (references to real components) then its nested `regions`, in
   source order. Source order is defined to equal reading, tab, and mobile-stacking
   order.
2. **An explicit content contract.** Each recipe declares the content it consumes:
   field names, types, whether they are required, and — for repeating content —
   the item shape. This is what lets `prompts/` map a brief to a section without
   guessing.
3. **A required accessibility + Elementor contract.** Each recipe states its
   landmark, its heading-level contribution to the page outline, and the Elementor
   widget/template it compiles to.

## Consequences

**Positive**

- Recipes compose the system and cannot silently re-implement components — a
  lint checks that every component reference resolves.
- The content contract makes generation deterministic: the planner knows exactly
  what a section needs.
- Nesting keeps `components` arrays clean (leaves only), which keeps validation
  simple and the reading/tab order unambiguous.

**Costs / trade-offs**

- The primitive set bounds what a recipe can express; a genuinely new layout needs
  a new foundation primitive (a deliberate, reviewable act) rather than ad-hoc
  markup. This is the intended constraint, not a limitation to route around.
- Responsive behavior is authored as human-readable per-breakpoint rules for now;
  a fully declarative responsive grammar is deferred until the builder needs it.

**Follow-ups**

- [`prompts/`](../../prompts/) ([Phase 6](../../ROADMAP.md#phase-6--prompts-the-intent-layer))
  maps a brief onto recipes using their content contracts.
- The [`builder/`](../../builder/) ([Phase 5](../../ROADMAP.md#phase-5--builder-the-compiler))
  compiles recipes into Elementor section/page templates.

Builds on [ADR-0002](0002-foundation-as-enforceable-contracts.md) (layout
primitives) and [ADR-0003](0003-component-specification-format.md) (components).
