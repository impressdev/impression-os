# Recipes

**Composed sections — the opinionated patterns of Impression OS.**

A recipe assembles components into a complete, self-contained section: a hero, a
feature grid, a pricing table, a testimonial block, an FAQ, a CTA, a header, a
footer. Recipes are where the system expresses *taste* — the arrangements that
read as professional rather than merely functional.

## Why this layer exists

Components answer "what is a button?" Recipes answer "what is a good pricing
section?" That second question is where most AI-generated sites fail: the parts
are fine, but the composition is naïve. Recipes capture the composition decisions
— proportion, rhythm, responsive behavior — so generation composes proven
sections instead of improvising layouts.

## What a recipe defines

- **Composition** — which components, in what arrangement.
- **Content contract** — the shape of content the recipe needs to render well
  (e.g. a pricing recipe expects N tiers, each with name, price, features).
- **Responsive behavior** — how the section reflows across breakpoints.
- **Token & foundation bindings** — spacing, rhythm, and hierarchy applied.

## Planned structure

```
recipes/
├── sections/   Hero, feature grid, pricing, testimonial, FAQ, CTA
├── chrome/     Header and footer
└── schema/     The definition of a valid recipe (composition + content contract)
```

## Conventions

- **Compose components; never re-implement them.** A recipe references components,
  it does not redraw a button or card inline.
- **Declare the content contract explicitly** so generation knows what to supply.
- **Responsive behavior is defined**, not left to chance.
- **No literals** — all values come from tokens via components and foundation.

## Dependencies

Depends on [`components/`](../components/), [`foundation/`](../foundation/), and
[`tokens/`](../tokens/). Consumed by [`prompts/`](../prompts/) and compiled by
[`builder/`](../builder/).

## Status

⬜ Not started — see [Phase 4](../ROADMAP.md#phase-4--recipes-composed-sections).
