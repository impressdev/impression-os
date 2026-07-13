# Planning

Where a **brief** becomes a **build plan**: the deterministic artifact the
[`builder/`](../../builder/) compiles. Planning is the one place an AI agent
operates in the pipeline — and its freedom is deliberately narrow.

## Files

- [`system.md`](system.md) — the planner's system prompt (its role and rules).
- [`plan.md`](plan.md) — the task prompt template (with `{{placeholders}}`).
- [`blueprints.json`](blueprints.json) — page archetypes → ordered recipe
  sequences.
- [`accent-lexicon.json`](accent-lexicon.json) — brand accent words → color ramps,
  for deterministic theme selection (see `impression resolve-theme`).
- [`build-plan.schema.json`](build-plan.schema.json) — the plan contract (= the
  builder's input).
- [`example.plan.json`](example.plan.json) — the plan the planner should produce
  for [the example brief](../brief/example.brief.json).

## The transformation

```
brief  ──(system.md + plan.md + blueprints + recipe contracts)──▶  build plan  ──▶  builder
```

The planner:

1. **Picks a theme** that exists in the token manifest (or the default).
2. **Picks a blueprint** per page (default: one `landing` page).
3. **Walks the blueprint's recipes**, filling each recipe's content contract from
   the brief — dropping any section whose required content is missing.
4. **Emits a build plan** and nothing else. Order is page/reading/tab order.

## Why a separate plan artifact

The brief is *intent*; the plan is *decision*. Separating them means the plan is a
reviewable, diffable, deterministic record of exactly what will be built — and it
is the stable contract the builder depends on, independent of how it was produced.
See [ADR-0006](../../docs/decisions/0006-intent-layer-brief-vs-plan.md).

## Verified

The [example plan](example.plan.json) passes every machine-checkable
[guardrail](../guardrails/) and compiles cleanly through the builder into eight
section templates. Reproduce with:

```bash
node builder/bin/impression-build.js --brief prompts/planning/example.plan.json --out dist --root .
```

## Status

✅ Implemented — see [Phase 6](../../ROADMAP.md#phase-6--prompts-the-intent-layer).
