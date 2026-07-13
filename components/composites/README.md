# Composite components

Components assembled from primitives. Each declares its `dependencies` and is
specified against [`../schema/component.schema.json`](../schema/component.schema.json).

| Component | Purpose | Composes | Elementor widget |
| --------- | ------- | -------- | ---------------- |
| [`card`](card.json)             | Group related content on a surface. | media, heading, text, button | `container` |
| [`list-item`](list-item.json)   | A single row in a feature/checklist. | icon, text | `icon-list` |
| [`form-field`](form-field.json) | Labelled control with hint/error slots. | text, icon | `form` |
| [`nav-item`](nav-item.json)     | A navigation link with a current state. | text | `nav-menu` |

## Conventions

- **Compose primitives; never re-implement them.** A composite references its
  dependencies, it does not redraw a button or icon inline.
- **Own the arrangement, not the atoms.** A composite decides layout, spacing,
  and grouping; the atoms keep their own styling.
- **State the accessibility contract** for the composed whole (focus order,
  labelling, current/validation state).

## Status

✅ Implemented (draft) — see
[Phase 3](../../ROADMAP.md#phase-3--components-the-atomic-units).
