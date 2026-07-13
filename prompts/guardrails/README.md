# Guardrails

The constraints that keep generation **inside the system**. Guardrails are what
make the planner's freedom narrow on purpose: the intelligence lives in the system
layers, and the planner composes them faithfully rather than improvising.

## Files

- [`guardrails.md`](guardrails.md) — the full, human-readable constraint set.
- [`guardrails.json`](guardrails.json) — the machine-checkable subset the
  [`tests/`](../../tests/) harness enforces on every build plan.

## The rules at a glance

| Rule | Enforces |
| ---- | -------- |
| `recipe-exists` | Every section uses a real recipe. |
| `theme-exists` | The theme exists in the token manifest. |
| `required-content-present` | Each section satisfies its recipe's required content. |
| `single-h1` | Exactly one hero owns the page h1. |
| `header-footer-bookends` | Pages open with header, close with footer. |
| `no-design-values-in-content` | Content carries no colors, sizes, or style. |
| `meaningful-cta-text` | CTA labels are specific, not "click here". |

## Why machine-checkable

A guardrail that only lives in prose is a guardrail that drifts. The JSON subset
turns each rule into something a validator runs, so a non-conforming plan fails
before it ever reaches the builder. The [example plan](../planning/example.plan.json)
passes all of them.

## Status

✅ Implemented — enforcement is wired into the [`tests/`](../../tests/) harness in
[Phase 7](../../ROADMAP.md#phase-7--quality-harness).
