# Tokens

**The single source of truth for every design decision in Impression OS.**

A token is a named design value. Colors, type sizes, spacing, radii, shadows,
breakpoints, and z-index all live here — and *only* here. Every layer above this
one references tokens by name; nothing above this layer is permitted to hard-code
a raw value.

## Why this layer exists

If a design value can be reused, it must have a single name and a single home.
That is the difference between a system and a pile of pages. When a value lives in
exactly one place, a brand can be re-themed, a scale can be tuned, and the whole
site moves in lockstep — no drift, no hunting for stray hex codes.

## Responsibilities

- Define **primitive tokens** — raw, literal values (`color.blue.500`, `space.4`).
- Define **semantic tokens** — role-based aliases that map intent to primitives
  (`surface.default`, `text.muted`, `accent.emphasis`).
- Define the **theming model** — how light/dark and per-brand overrides swap
  values without changing the names that consumers depend on.
- Define the **mapping** from semantic tokens to Elementor Pro global styles.

## Planned structure

```
tokens/
├── primitives/   Raw values: color ramps, type scale, spacing, radius, shadow
├── semantic/     Role-based aliases layered on primitives
├── themes/       Light/dark and brand overrides
└── schema/       The definition of a valid token set
```

## Conventions

- **Semantic over primitive.** Components and recipes reference semantic tokens
  (`text.default`), never primitives (`color.gray.900`) directly.
- **Naming:** dot-namespaced, lowercase (`category.role.scale`).
- **No literals above this layer.** This is the rule the rest of the system is
  built to protect.

## Dependencies

Depends on **nothing**. This is the root of the dependency stack. Every other
layer depends, directly or transitively, on tokens.

## Status

⬜ Not started — see [Phase 1](../ROADMAP.md#phase-1--tokens-the-source-of-truth).
