# Component schema

[`component.schema.json`](component.schema.json) is the contract every component
spec must satisfy. A component is authored as data so the [`builder/`](../../builder/)
can compile it to Elementor and the [`tests/`](../../tests/) harness can validate
it.

## A spec at a glance

```jsonc
{
  "name": "button",              // kebab-case identifier
  "category": "primitive",       // primitive | composite
  "description": "...",
  "anatomy": ["root", "label"],  // named parts, in source order
  "props":   { /* the inputs that vary: enum | boolean | string | number */ },
  "base":    { /* part -> style bindings applied to every instance */ },
  "variants":{ /* prop -> value -> part -> style delta */ },
  "states":  { /* hover | active | focus | disabled -> part -> style delta */ },
  "a11y":    { /* role, nameFrom, focusVisible, targetSize, contrast, notes */ },
  "elementor": { "widget": "...", "mapping": { /* prop -> widget setting */ } },
  "dependencies": ["media", "heading"]   // composites only
}
```

## Rules the schema encodes

- **Part-keyed styling.** `base`, each variant value, and each state are maps of
  anatomy part → style, so multi-part components style each slot independently.
- **Controlled style vocabulary.** Style keys are a fixed set (`background`,
  `color`, `radius`, `paddingX`, `elevation`, …); values are token references or
  law-constant literals.
- **Token binding.** Color, typography, radius, elevation, and stacking bind to
  semantic roles; spacing binds to the spacing scale. (Enforced by the token lint
  in [`tests/`](../../tests/).)
- **Accessibility is required.** Every spec carries an `a11y` block; interactive
  components must define `focus` and `disabled` states.
- **Elementor mapping is required.** Every spec declares the widget it compiles to.

See [ADR-0003](../../docs/decisions/0003-component-specification-format.md) for the
rationale behind specifying components as data.
