# Guardrails

The constraints that keep generation **inside the system**. The planner must
satisfy every rule below; the [`tests/`](../../tests/) harness enforces the
machine-checkable subset ([`guardrails.json`](guardrails.json)) against every
build plan.

A good guardrail *reduces* the model's freedom. That is the point: the
intelligence lives in the system layers, and the planner's job is to compose them
faithfully — not to improvise.

## Composition

- **Only existing recipes.** Every `section.recipe` must be the name of a recipe
  that exists in `recipes/`. Inventing a recipe is forbidden.
- **Only existing components.** Recipes already reference components; the planner
  never introduces a component or a widget.
- **Blueprints, not freestyle.** Section selection and order come from a blueprint
  in `blueprints.json`. Sections are dropped, never invented, when content is
  missing.

## Content

- **Compose, don't write.** All copy comes from the brief. The planner never
  authors new marketing text.
- **Fill required fields or drop the section.** A section appears only when every
  required content field of its recipe is satisfied from the brief.
- **No design values in content.** Content carries text, links, and asset
  references — never colors, sizes, spacing, or style. Styling is the builder's
  job, sourced from tokens.

## Theme

- **Only existing themes.** `theme` must be a name present in
  `tokens/manifest.json`. No invented themes, no inline color overrides.

## Accessibility

- **One h1 per page.** Exactly one hero; it owns the page h1.
- **Landmarks intact.** A page opens with `header` (banner) and closes with
  `footer` (contentinfo).
- **Meaningful link text.** CTA labels are specific; never "click here".

## Determinism

- **Same brief → same plan.** No randomness, no time-dependence, no run-to-run
  variation in wording, ordering, or selection.

## Machine-checkable subset

[`guardrails.json`](guardrails.json) encodes the rules a validator can enforce
without human judgement — existing recipes/themes, required-content presence,
single-h1, header/footer bookends, and the no-design-values rule. The
[`tests/`](../../tests/) harness runs these on every plan
([Phase 7](../../ROADMAP.md#phase-7--quality-harness)).
