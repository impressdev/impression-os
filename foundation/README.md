# Foundation

**The design laws of Impression OS.**

Tokens supply the *values*. Foundation supplies the *rules for using them* — the
first-principle decisions that make output feel considered rather than assembled:
the grid, the spacing rhythm, the typographic scale, the layout primitives, and
the accessibility contracts every component must honor.

## Why this layer exists

A palette and a type scale do not, by themselves, produce good design. Good design
comes from *how* those values relate: consistent vertical rhythm, a sane
line-length, a predictable hierarchy, deliberate whitespace. Foundation encodes
those relationships once, so that every component and recipe inherits good
behavior instead of re-deriving it.

## Responsibilities

- **Spatial system** — grid, container widths, and the spacing rhythm that binds
  sections into a coherent page.
- **Typographic system** — the type scale, line-height and line-length rules, and
  vertical rhythm.
- **Hierarchy & layout** — how emphasis, order, and grouping are expressed.
- **Accessibility contracts** — the non-negotiable rules for contrast, semantic
  structure, focus order, and motion that everything above must satisfy.

## Structure

Each sub-law pairs prose (the *why* and *how*) with a machine-legible contract
(JSON that references tokens), so the same rule guides both authors and the
[`tests/`](../tests/) harness.

```
foundation/
├── grid/           The spatial system — 12 columns, containers, gutters (grid.json)
├── spacing/        Vertical rhythm — baseline unit, section spacing (rhythm.json)
├── typography/     Type application, reading measure, heading map (type-system.json)
├── hierarchy/      Emphasis rules and the layout primitives (primitives.json)
└── accessibility/  WCAG 2.1 AA contracts: contrast, semantics, focus, motion (contracts.json)
```

Structural law constants (column count, WCAG ratios, `ch` measures) are
foundation's own; every *dimensional* value is a token reference.

## Conventions

- Foundation states **rules and relationships**, expressed in terms of tokens.
- It never introduces new raw values — if it needs a value, that value is a token.
- Accessibility rules here are **contracts**: components and recipes must comply,
  and `tests/` enforce them.

## Dependencies

Depends only on [`tokens/`](../tokens/). Consumed by
[`components/`](../components/) and [`recipes/`](../recipes/).

## Status

✅ **Implemented** — grid, spacing rhythm, typographic system, hierarchy &
layout primitives, and the WCAG 2.1 AA accessibility contracts are all in place,
each with a machine-legible JSON contract. See
[Phase 2](../ROADMAP.md#phase-2--foundation-the-design-laws).

Next: the [`components/`](../components/) layer builds atomic units on these laws
([Phase 3](../ROADMAP.md#phase-3--components-the-atomic-units)).
