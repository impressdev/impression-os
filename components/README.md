# Components

**The atomic building blocks of Impression OS.**

A component is the smallest reusable unit of interface — a button, a heading, a
card, a form field — specified once and mapped to the Elementor Pro widget that
renders it. Components consume tokens and obey foundation. They are the vocabulary
that recipes compose into sections.

## Why this layer exists

Recipes and generated pages should never describe a button from scratch. They
should reference *the* button, whose every state, size, and token binding is
already decided and tested. Components turn "draw a button" into "use the button,"
which is what makes output consistent across an entire site.

## What a component defines

- **Props** — the inputs that vary (label, size, variant, icon).
- **States** — default, hover, focus, active, disabled, and their token bindings.
- **Token bindings** — which semantic tokens drive color, space, type, radius.
- **Elementor mapping** — the widget and settings this component compiles to.
- **Accessibility notes** — roles, labels, focus behavior, and contrast guarantees.

## Planned structure

```
components/
├── primitives/   Button, heading, text, media, icon, badge
├── composites/   Card, list item, form field, navigation item
└── schema/       The definition of a valid component specification
```

## Conventions

- **Tokens only.** Every visual value is a token reference — no literals.
- **Every state is specified**, including focus and disabled.
- **Accessibility is part of the spec**, not an afterthought.
- One component owns one concept; variants are props, not new components.

## Dependencies

Depends on [`tokens/`](../tokens/) and [`foundation/`](../foundation/). Consumed by
[`recipes/`](../recipes/).

## Status

✅ **Implemented (draft)** — six primitives (button, heading, text, icon, badge,
media), four composites (card, list-item, form-field, nav-item), and the
component specification schema are in place. Each component is authored as data,
binds to tokens, and carries an accessibility contract and an Elementor mapping.
See [Phase 3](../ROADMAP.md#phase-3--components-the-atomic-units), the
[primitives catalog](primitives/README.md), and the
[composites catalog](composites/README.md).

Next: [`recipes/`](../recipes/) compose these into complete sections
([Phase 4](../ROADMAP.md#phase-4--recipes-composed-sections)).
