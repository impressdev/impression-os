# ADR-0006 — The intent layer: brief vs. build plan

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 6 — Prompts](../../ROADMAP.md#phase-6--prompts-the-intent-layer)

## Context

The prompts layer is where human intent enters the system and where the one AI
step in the pipeline lives. The risk is obvious: an LLM turning a vague request
into a site is exactly the non-deterministic, improvising behavior Impression OS
exists to eliminate ([PROJECT.md](../../PROJECT.md)). We needed a structure that
lets an agent do the genuinely useful part (mapping messy intent onto the system)
while making the *output* deterministic, reviewable, and safe to compile.

## Decision

Split the intent layer into **two artifacts with a hard boundary**:

1. **The brief** ([`brief.schema.json`](../../prompts/brief/brief.schema.json)) —
   structured client intent and all raw content. Human-authored, validated input.
2. **The build plan** ([`build-plan.schema.json`](../../prompts/planning/build-plan.schema.json)) —
   a theme plus an ordered list of `{ recipe, content }` sections. This is the
   deterministic decision, and it is exactly the builder's input.

The planner (an LLM, driven by [`system.md`](../../prompts/planning/system.md) +
[`plan.md`](../../prompts/planning/plan.md)) transforms brief → plan using
**blueprints** (page archetype → recipe sequence) and the recipes' own content
contracts. Its freedom is bounded by **guardrails**
([`guardrails.md`](../../prompts/guardrails/guardrails.md) + a machine-checkable
[`guardrails.json`](../../prompts/guardrails/guardrails.json)).

Key consequences of the split:

- **The plan is the contract, not the prompt.** The builder depends on the plan
  schema, never on how the plan was produced. A human could write a plan by hand;
  an LLM could write it; the builder cannot tell and does not care.
- **Determinism is enforced downstream.** Even though an LLM produces the plan,
  the plan is validated against guardrails before it compiles — so a bad or
  non-deterministic plan fails a check rather than shipping.
- **Reviewability.** The plan is a small, diffable JSON artifact — the exact
  record of what will be built.

## Consequences

**Positive**

- The single non-deterministic step (the LLM) is fenced by a validated input
  (brief) and a validated output (plan). Its blast radius is contained.
- Blueprints capture composition taste as data, so "what sections, in what order"
  is a system decision, not a per-run guess.
- The builder stays pure: plan in, kit out.

**Costs / trade-offs**

- Two schemas and a set of prompts to maintain. Justified: the boundary is the
  whole point.
- The planner itself is an LLM and cannot be unit-tested for byte-stability the
  way the builder can; we compensate by validating its *output* (the plan) with
  guardrails, and by shipping a reference `example.plan.json` that is verified to
  pass all guardrails and compile cleanly.

**Follow-ups**

- The [`tests/`](../../tests/) harness ([Phase 7](../../ROADMAP.md#phase-7--quality-harness))
  runs `guardrails.json` on every plan and validates briefs/plans against their
  schemas.
- [Phase 8](../../ROADMAP.md#phase-8--first-generated-site) runs a brief all the
  way to an imported site and commits it to [`examples/`](../../examples/).

Builds on ADR-0004 (recipe content contracts) and ADR-0005 (the builder that
consumes the plan).
