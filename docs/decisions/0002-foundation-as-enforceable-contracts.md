# ADR-0002 — Foundation as enforceable contracts

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 2 — Foundation](../../ROADMAP.md#phase-2--foundation-the-design-laws)

## Context

The foundation layer encodes the "design laws" — grid, spacing rhythm, typographic
system, hierarchy, and accessibility. The open question was *what form* these laws
should take. A design system's principles are often written as prose guidelines
that humans are trusted to follow. In an AI-native system aiming for deterministic,
professional output ([PROJECT.md](../../PROJECT.md)), "trusted to follow" is not
good enough: an unenforceable rule is a rule that will drift.

## Decision

Author every foundation law in **two coupled forms**:

1. **Prose** (`README.md`) — the reasoning, the *why*, and the guidance an author
   needs. This is what makes the rule understandable.
2. **A machine-legible contract** (`*.json`) — the same rule as data the
   [`builder/`](../../builder/) and [`tests/`](../../tests/) can read directly.
   This is what makes the rule *enforceable*.

Two supporting conventions make this work:

- **Token references for dimensional values.** Any value that is a design decision
  (a gutter, a section gap, a focus-ring color) is a `{token}` reference, never a
  literal. Foundation adds no new raw design values.
- **Law constants may be literal.** Structural constants that are not design
  tokens — the column count (12), WCAG contrast ratios (4.5, 3.0), the reading
  measure in `ch`, the minimum target size — live in foundation as its own law.
  They are not themeable and have no home in the token layer.

## Consequences

**Positive**

- Accessibility and layout become *checked properties*, not review-time opinions.
- The builder and tests share one source of truth per law; they cannot disagree.
- Authors get the reasoning (prose) and the machine gets the rule (JSON) without
  either drifting from the other.

**Costs / trade-offs**

- Two representations of each law must be kept in sync. Mitigated by keeping the
  JSON small and the prose pointing at it as the source of record.
- Some judgement is needed on what is a "law constant" versus a "design token."
  The heuristic: if it could reasonably change per brand/theme, it is a token; if
  it is structural or externally defined (e.g. a WCAG threshold), it is a law
  constant.

**Follow-ups**

- The [`tests/`](../../tests/) harness ([Phase 7](../../ROADMAP.md#phase-7--quality-harness))
  consumes `foundation/**/contracts` and `*.json` to gate builds.
- Components ([Phase 3](../../ROADMAP.md#phase-3--components-the-atomic-units))
  must declare compliance with these contracts as part of their spec.

See [ADR-0001](0001-adopt-dtcg-token-format.md) for the token format the
references resolve against.
