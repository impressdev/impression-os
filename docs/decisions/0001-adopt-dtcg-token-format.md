# ADR-0001 — Adopt the W3C Design Tokens (DTCG) format

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 1 — Tokens](../../ROADMAP.md#phase-1--tokens-the-source-of-truth)

## Context

Impression OS treats every design decision as data (see
[PROJECT.md](../../PROJECT.md), principle 1). The token layer is the root of the
dependency stack and the single source of truth for color, type, spacing, and
elevation. Before authoring any tokens we had to choose the file format they are
expressed in. The format needs to be:

- **Machine-legible and unambiguous** — the builder compiles it deterministically.
- **Human-authorable** — design engineers edit it by hand and in review.
- **Referenceable** — semantic tokens must alias primitives without copying values.
- **Portable** — not locked to one vendor's tooling, so the ecosystem can grow.

### Options considered

1. **Bespoke JSON shape.** Maximum freedom, zero ecosystem. We would reinvent
   references, typing, and validation, and every future tool would be custom.
2. **A CSS-variables source of truth.** Native to the web, but weakly typed, hard
   to validate structurally, and awkward to express references and composite
   tokens (like a full type style) cleanly.
3. **The W3C Design Tokens (DTCG) format.** A JSON standard with `$value`,
   `$type`, `$description`, group nesting, `{reference}` aliasing, and composite
   types. Growing tool support (Style Dictionary, Tokens Studio, and others).

## Decision

Adopt the **W3C Design Tokens (DTCG) format** as the authoring format for all
tokens.

We use a deliberate **subset**: the types we actually need (`color`, `dimension`,
`number`, `fontFamily`, `fontWeight`, `shadow`, `typography`) plus one local
extension, `$extends`, on theme files to express brand deltas over a base theme.
The subset and the extension are pinned in
[`tokens/schema/token.schema.json`](../../tokens/schema/token.schema.json).

Layering is fixed as **primitives → semantic → themes**, declared in
[`tokens/manifest.json`](../../tokens/manifest.json), so references always resolve
against an already-loaded layer.

## Consequences

**Positive**

- References (`{color.brand.600}`) give us single-source-of-truth for free.
- Structural validation is straightforward via JSON Schema.
- Existing DTCG tooling can consume our tokens without a custom exporter.
- Composite `typography` tokens let a named type style live as one object.

**Costs / trade-offs**

- The DTCG spec is still stabilising; we mitigate by pinning a strict subset and
  validating against our own schema rather than tracking the spec's every change.
- `shadow` is authored as a CSS string rather than the spec's composite object,
  for readability now; revisiting this is cheap and localised if a tool requires
  the structured form.

**Follow-ups**

- The [`builder/`](../../builder/) will consume this format when emitting the
  Elementor Pro kit — see
  [token-to-Elementor mapping](../architecture/token-to-elementor-mapping.md).
- The [`tests/`](../../tests/) harness will validate every token file against the
  schema and check that all references resolve.
