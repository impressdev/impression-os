# ADR-0009 — Contrast-driven brand-theme generation

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** Post-roadmap (brand theming at scale)

## Context

Impression OS generates sites for many clients, each with its own brand. The token
system already supports themes as deltas (`$extends`), but authoring one by hand
means a human picking accent shades and *hoping* the text on them is readable. That
is exactly the improvisation the project exists to remove — and it bites: the
original hand-authored `brand.example` shipped an accent whose white label measured
**4.47:1**, just under the WCAG AA floor, and nobody noticed until the harness
started checking every theme.

## Decision

Generate brand themes with `impression theme <name> --accent <ramp> [--base]`, and
make **contrast the selection criterion**, not an afterthought:

- The generator reads the primitive color ramp and, for the accent fill, **picks
  the first step (from 600 → 900) whose white label meets AA (≥ 4.5:1)**. The link
  color is likewise chosen to meet AA against the page surface, and the focus ring
  to meet the 3:1 non-text rule.
- If no step in a ramp can satisfy a contract, the generator **throws** rather than
  emitting a non-compliant theme ("fail loudly, not creatively").
- The output is a normal theme delta (`$extends` a base) registered in the
  manifest, so the accessibility harness — which now iterates **every** theme in
  the manifest — covers it automatically.

Two vetted brand ramps (`teal`, `violet`) were added to the primitives to give the
generator real choices, alongside the existing ramps.

## Consequences

**Positive**

- Brand themes meet AA **by construction**; the guarantee moves from "reviewer
  remembered to check" to "the generator cannot produce otherwise."
- The harness change (iterate all manifest themes) immediately caught the pre-
  existing `brand.example` defect, which was then fixed by regenerating it.
- Onboarding a client's brand is one command, not a careful hand-edit.

**Costs / trade-offs**

- The generator maps a brand to an *existing, vetted ramp*; it does not yet
  synthesise a full ramp from an arbitrary brand hex. That is a deliberate scope
  choice — reusing vetted ramps keeps every output accessible. Arbitrary-hex ramp
  generation (with the same contrast gate) is a natural follow-up.
- Accent hover/active are stepped deeper for AA safety, which is conventional but
  means dark-theme accents darken on press rather than lighten.

**Follow-ups**

- Synthesise ramps from a single brand color, gated by the same contrast contract.
- Let the brief's `brand.accent` wording map to a ramp automatically in the planner.

Builds on ADR-0001 (token format) and ADR-0007 (the harness that made the defect
visible).
