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

## Planned structure

```
foundation/
├── grid/           Columns, gutters, container widths, breakpoints in use
├── spacing/        Rhythm and the rules for applying the spacing scale
├── typography/     Type scale application, line-length, vertical rhythm
├── hierarchy/      Emphasis, order, grouping, and layout primitives
└── accessibility/  Contrast, semantics, focus, and motion contracts
```

## Conventions

- Foundation states **rules and relationships**, expressed in terms of tokens.
- It never introduces new raw values — if it needs a value, that value is a token.
- Accessibility rules here are **contracts**: components and recipes must comply,
  and `tests/` enforce them.

## Dependencies

Depends only on [`tokens/`](../tokens/). Consumed by
[`components/`](../components/) and [`recipes/`](../recipes/).

## Status

⬜ Not started — see [Phase 2](../ROADMAP.md#phase-2--foundation-the-design-laws).
