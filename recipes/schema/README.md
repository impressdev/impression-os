# Recipe schema

[`recipe.schema.json`](recipe.schema.json) is the contract every recipe must
satisfy. A recipe is authored as data so the [`builder/`](../../builder/) can
compile it to Elementor templates and the [`tests/`](../../tests/) harness can
validate it.

## A recipe at a glance

```jsonc
{
  "name": "hero",
  "category": "section",          // section | chrome
  "landmark": "section",          // HTML/ARIA landmark
  "container": "default",         // grid container: default | wide | full
  "sectionSpacing": "spacious",   // rhythm: none | compact | default | spacious
  "layout": {
    "primitive": "split",         // a foundation layout primitive
    "regions": { /* named regions, in source order; may nest */ }
  },
  "content": { /* the content contract: fields, types, required, list shapes */ },
  "responsive": { "base": "…", "lg": "…" },
  "components": ["heading", "text", "button"],   // dependencies
  "a11y": { "headingLevel": "h1", "notes": ["…"] },
  "elementor": { "widget": "container", "mapping": { /* … */ } }
}
```

## Rules the schema encodes

- **Composition via primitives.** `layout.primitive` and every region's
  `primitive` come from the fixed set of [foundation layout
  primitives](../../foundation/hierarchy/) (stack, cluster, grid, center, cover,
  split).
- **Regions nest; components are leaves.** A region renders its `components` (real
  component references, optionally with `?` or `:variant`) then its nested
  `regions`, in source order.
- **The content contract is explicit.** Each content field declares a `type`
  (string, richtext, action, image, list, boolean, number), whether it is
  `required`, and — for lists — the item shape via `of`.
- **Accessibility and Elementor mapping are required.** Every recipe declares its
  landmark/heading expectations and the Elementor widget/template it compiles to.

The [`tests/`](../../tests/) harness validates each recipe against this schema,
checks that every component reference resolves to a real component, and checks
that token references resolve. See
[ADR-0004](../../docs/decisions/0004-recipe-composition-model.md).
