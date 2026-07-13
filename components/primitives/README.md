# Component primitives

The smallest, indivisible units of interface. Each is specified as data against
[`../schema/component.schema.json`](../schema/component.schema.json) and binds
every visual value to a token.

| Component | Purpose | Elementor widget |
| --------- | ------- | ---------------- |
| [`button`](button.json)   | Trigger an action or navigate. Four variants, three sizes. | `button` |
| [`heading`](heading.json) | Section/page heading; level decoupled from appearance. | `heading` |
| [`text`](text.json)       | Running text, capped at the reading measure. | `text-editor` |
| [`icon`](icon.json)       | Decorative or meaningful glyph, sized in em. | `icon` |
| [`badge`](badge.json)     | Status/category label; meaning never by color alone. | `text-editor` |
| [`media`](media.json)     | Responsive image with controlled ratio and radius. | `image` |
| [`stat`](stat.json)       | A headline metric: prominent value + describing label. | `container` |

## Conventions

- **Tokens only.** Color, type, radius, and elevation bind to semantic roles;
  spacing binds to the spacing scale.
- **Every interactive primitive specifies focus and disabled.**
- **Accessibility is part of the spec** — see each file's `a11y` block.

One component owns one concept. Variants are props, not new components.

## Status

✅ Implemented (draft) — see
[Phase 3](../../ROADMAP.md#phase-3--components-the-atomic-units).
