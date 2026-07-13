# ADR-0003 — Specify components as data

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 3 — Components](../../ROADMAP.md#phase-3--components-the-atomic-units)

## Context

Components are the atomic units the generator composes into sections. The question
was *how* to author them. In a conventional design system a component is code (a
React/Vue file). But Impression OS does not ship a JavaScript runtime — its output
is an **Elementor Pro kit**. A component here is not a rendered widget; it is a
*specification* the [`builder/`](../../builder/) projects onto an Elementor widget,
and the [`tests/`](../../tests/) harness validates.

That reframes the requirement: we need a description of a component's anatomy,
props, token-bound styling, states, accessibility contract, and Elementor mapping —
in a form that is both machine-legible and reviewable — not a rendering
implementation.

## Decision

Specify every component as **data** (JSON) against a single schema,
[`components/schema/component.schema.json`](../../components/schema/component.schema.json).

Key format choices:

- **Part-keyed styling ("slots").** `base`, variants, and states are maps of
  *anatomy part → style*, so a multi-part component (card, form-field) styles each
  slot independently — the same model used by mature headless-UI systems.
- **Controlled style vocabulary.** Style keys are a fixed set; values are token
  references or law-constant literals. This keeps specs uniform and lintable.
- **Token binding rule.** Color, typography, radius, elevation, and stacking bind
  to *semantic* roles; **spacing** binds to the primitive spacing scale, which is
  itself the canonical, constrained spacing vocabulary. Recorded here because it
  refines the general "semantic over primitive" guidance for one category.
- **Accessibility and Elementor mapping are required fields**, not optional
  documentation — a component is incomplete without them.

## Consequences

**Positive**

- One schema validates every component; the builder and tests read the same specs.
- Specs are diff-friendly and reviewable, and carry no framework lock-in.
- The token binding rule is machine-checkable, so drift is caught by lint.

**Costs / trade-offs**

- A data spec cannot express arbitrary bespoke behavior; anything beyond the
  controlled vocabulary needs a schema extension (a deliberate, reviewable act).
- Interaction states are authored as variant-independent deltas for simplicity;
  variant-specific state nuances are captured in `a11y.notes` until a future
  revision justifies richer state modelling.

**Follow-ups**

- [`recipes/`](../../recipes/) ([Phase 4](../../ROADMAP.md#phase-4--recipes-composed-sections))
  compose these specs; the builder ([Phase 5](../../ROADMAP.md#phase-5--builder-the-compiler))
  projects them onto Elementor widgets.
- The [`tests/`](../../tests/) harness will validate every spec against the schema
  and enforce the token binding rule.

See [ADR-0001](0001-adopt-dtcg-token-format.md) (token format) and
[ADR-0002](0002-foundation-as-enforceable-contracts.md) (foundation contracts),
which this builds upon.
