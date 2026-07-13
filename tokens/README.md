# Tokens

**The single source of truth for every design decision in Impression OS.**

A token is a named design value. Colors, type, spacing, radii, shadows,
breakpoints, and stacking all live here — and *only* here. Every layer above this
one references tokens by name; nothing above this layer is permitted to hard-code
a raw value.

## Format

Tokens are authored in the [**W3C Design Tokens (DTCG)**](https://tr.designtokens.org/format/)
format — a portable, tool-agnostic JSON standard. A token is an object with a
`$value` (and optional `$type`, `$description`); a group is an object of nested
tokens. References use the `{dot.path}` syntax:

```json
{
  "color": {
    "$type": "color",
    "brand": { "600": { "$value": "#4f46e5" } }
  }
}
```

```json
{
  "color": {
    "accent": { "default": { "$value": "{color.brand.600}" } }
  }
}
```

See [`schema/token.schema.json`](schema/token.schema.json) for the exact contract
and [ADR-0001](../docs/decisions/0001-adopt-dtcg-token-format.md) for why this
format was chosen.

## Structure

Three layers, resolved in order (see [`manifest.json`](manifest.json)):

```
tokens/
├── primitives/   Raw, theme-independent values
│   ├── color.json        Full color ramps (neutral, brand, status)
│   ├── typography.json   Families, weights, sizes, line-heights, tracking
│   ├── space.json        4px-based spacing scale
│   ├── radius.json       Corner-radius scale
│   ├── shadow.json       Elevation shadows
│   ├── breakpoint.json   Responsive stops
│   └── z-index.json      Raw stacking ladder
├── semantic/     Theme-independent role aliases → primitives
│   ├── typography.json   Named type styles (display, h1…, body, caption)
│   ├── space.json        gap / inset / section roles
│   ├── radius.json       control / card / surface / pill roles
│   ├── shadow.json       elevation roles (flat, raised, overlay, modal)
│   └── z-index.json      layer roles (dropdown, sticky, modal, toast…)
├── themes/       Theme-dependent semantic COLOR roles
│   ├── light.json        Base semantic color mapping (source of truth)
│   ├── dark.json         Dark override of the same role names
│   └── brand.example.json A brand delta ($extends a base theme)
├── schema/
│   └── token.schema.json Definition of a valid token file
└── manifest.json         Sources + resolution order + available themes
```

### Why color is split from the other semantics

Semantic **color** is theme-dependent, so it lives in `themes/`. Every other
semantic role (type styles, spacing, radius, elevation, stacking) is
theme-independent and lives in `semantic/`. This keeps exactly one source of truth
per decision: swapping a theme changes color roles only, never the type or spatial
system.

## Conventions

- **Semantic over primitive.** Components and recipes bind **color, typography,
  radius, elevation, and stacking** to semantic roles
  (`{color.text.default}`, `{radius.control}`, `{elevation.raised}`), never to
  primitives. **Spacing** is the exception: the primitive spacing scale
  (`{space.4}`) *is* the canonical, constrained spacing vocabulary, so components
  may reference it directly, alongside the semantic `space.*` roles for
  composition rhythm.
- **Naming:** dot-namespaced, lowercase (`category.role.scale`).
- **No literals above this layer.** This is the rule the rest of the system is
  built to protect.
- **Themes are deltas.** `light` is the base; `dark` and brand themes override
  only the roles they change (`$extends`).

## Dependencies

Depends on **nothing**. This is the root of the dependency stack; every other
layer depends on tokens, directly or transitively.

## Accessibility

Semantic text roles are chosen to meet **WCAG 2.1 AA** against their intended
surfaces (documented inline in the theme files). The
[`tests/`](../tests/) accessibility harness will enforce this once implemented
([Phase 7](../ROADMAP.md#phase-7--quality-harness)).

## Status

✅ **Implemented** — primitives, semantic roles, light/dark themes, a brand
override example, the validation schema, and the manifest are all in place. See
[Phase 1](../ROADMAP.md#phase-1--tokens-the-source-of-truth).

Next: the [`foundation/`](../foundation/) layer turns these values into design
laws ([Phase 2](../ROADMAP.md#phase-2--foundation-the-design-laws)).
