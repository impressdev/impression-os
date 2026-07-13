# ADR-0008 — Examples as living, reproducible proof

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 8 — First generated site](../../ROADMAP.md#phase-8--first-generated-site)

## Context

Phase 8 is the payoff: prove the whole pipeline turns a brief into a
professional site. The honest complication is that the *final* step — importing
the kit into WordPress and confirming it renders correctly in Elementor — requires
a live WordPress + Elementor Pro environment that this repository does not contain.
We needed a way to make the milestone real and verifiable anyway, without faking
the part we cannot run here.

## Decision

Commit the first generated site to [`examples/northwind/`](../../examples/northwind/)
as **living proof**, with three properties:

1. **Real input, real output.** The example is the brief, the plan derived from
   it, and the exact kit + templates the committed builder emits — no hand-editing.
2. **Reproducible and self-verifying.** A [`provenance.json`](../../examples/northwind/provenance.json)
   records the generator version, the exact command, output counts, and a SHA-256
   checksum of the emitted kit + templates. `tests/example.test.mjs` rebuilds from
   the plan and asserts the committed artifacts and the checksum match — so CI
   fails if the example ever drifts from what the current builder produces.
3. **Honest about the boundary.** The WordPress import + visual verification is
   documented as a manual procedure with a checklist in the example README, and
   explicitly called out as the one step not automated here — rather than claimed
   as done.

## Consequences

**Positive**

- The milestone is demonstrable and continuously verified: the example is not a
  screenshot that rots, it is output the harness re-derives on every change.
- The provenance checksum makes byte-stable reproduction a checked property, not a
  claim.
- The scope boundary (no live WP) is transparent, preserving the project's
  "report faithfully" standard.

**Costs / trade-offs**

- Full end-to-end confidence still awaits a WordPress render harness; until then,
  correctness of the *rendered* page is verified manually against the checklist.
  This is the same boundary recorded for visual regression in
  [ADR-0007](0007-quality-harness.md).

**Follow-ups**

- Add a WordPress + Elementor render harness to automate import and screenshot
  verification, upgrading both this example and `tests/visual/` from output
  snapshots to pixel checks.
- Add further examples (product, about, minimal blueprints) as the system grows.

Completes the arc begun in ADR-0001 and realised through ADR-0005–0007.
