# ADR-0007 — The quality harness

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 7 — Quality harness](../../ROADMAP.md#phase-7--quality-harness)

## Context

Through Phases 1–6 the project accumulated correctness checks that were run
ad hoc (a scratch script for reference resolution, a manual contrast claim, the
builder's own smoke test). "Professional" and "accessible" were asserted but not
*continuously enforced*. Phase 7's job is to turn those guarantees into a single,
committed harness that gates every change — so a regression fails a check instead
of shipping.

## Decision

Build the harness on **Node's built-in test runner (`node:test`), with zero
dependencies**, consistent with the builder ([ADR-0005](0005-builder-runtime-and-architecture.md)).

Six suites, each enforcing one guarantee:

1. **Schema** — a compact, zero-dependency JSON Schema (draft 2020-12 subset)
   validator (`tests/lib/jsonschema.js`) checks every token, component, recipe,
   brief, and plan against its schema. Writing our own validator (rather than
   adding `ajv`) keeps the harness dependency-free and auditable; the subset is
   exactly the keywords our schemas use.
2. **References** — every `{token}` resolves; components avoid primitive
   color/font; recipe component references exist; the manifest matches disk.
3. **Accessibility** — contrast ratios computed from resolved tokens are checked
   against the thresholds in `foundation/accessibility/contracts.json`, per theme.
4. **Determinism** — the builder's output is byte-stable across runs, and element
   ids are unique.
5. **Guardrails** — the machine-checkable build-plan guardrails run against the
   reference plan (must pass) and a negative fixture (must be caught).
6. **Output regression** — the emitted kit and templates are diffed against
   committed baselines. This is an honest stand-in for pixel visual regression,
   which needs an Elementor renderer we do not yet have; the scope boundary is
   documented rather than hidden.

CI (`.github/workflows/ci.yml`) runs `node --test` on every push and PR.

## Consequences

**Positive**

- Correctness, accessibility, and determinism become *checked properties*. The
  harness immediately earned its keep: on first run it caught two real defects —
  a dark-theme accent/label pairing at 4.47:1 (just under AA) and an
  id-collision in the builder's hash — both fixed in the same phase.
- Zero dependencies means the harness runs anywhere Node ≥ 20 does, with no
  install and no supply chain.
- The schema validator and guardrail linter are reusable beyond tests.

**Costs / trade-offs**

- We maintain a small JSON Schema validator instead of using a full library. It
  supports only the keywords our schemas use; extending a schema may mean
  extending the validator (a deliberate, contained act).
- Output-snapshot regression is not pixel regression. It catches compiler-output
  drift, not rendering differences. Documented as such; upgraded when a renderer
  exists.

**Follow-ups**

- [Phase 8](../../ROADMAP.md#phase-8--first-generated-site) runs a brief to an
  imported site; when a render harness lands, `visual/` gains screenshot
  baselines.

Depends on ADR-0001–0006 (the artifacts and contracts this harness enforces).
