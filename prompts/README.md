# Prompts

**The intent layer — how a brief becomes a deterministic build plan.**

Prompts are the interface between human intent and the system. A client brief
enters as unstructured or semi-structured language; a build plan exits — a precise
selection of recipes, content, and theme that the builder can compile without
guessing. This layer is where "make me a site for a dental clinic" becomes an
executable plan against known-good primitives.

## Why this layer exists

The intelligence of Impression OS deliberately lives in its *system*, not in a
single clever prompt. The prompt layer's job is therefore narrow and disciplined:
translate intent into choices the system already supports, and refuse to
improvise outside it. A good prompt here *reduces* freedom rather than expanding
it — that is what makes generation deterministic and professional.

## Responsibilities

- **Brief schema** — the structured shape of a request (client, goals, content,
  brand inputs).
- **Planning prompts** — map a brief to recipes, content assignments, and a token
  theme.
- **Guardrails** — constraints that keep generation inside the system: no invented
  design values, no off-system layouts, no accessibility violations.

## Planned structure

```
prompts/
├── brief/       The schema and examples for a well-formed brief
├── planning/    Prompts that turn a brief into a build plan
└── guardrails/  Constraints that keep generation inside the system
```

## Conventions

- **Plans reference the system.** Output selects existing recipes and tokens; it
  never emits raw design values.
- **Determinism first.** No randomness, no time-dependence. Same brief + same
  version → same plan.
- **Fail loudly, not creatively.** If a brief asks for something outside the
  system, surface it — do not improvise a substitute.

## Dependencies

References [`recipes/`](../recipes/), [`components/`](../components/),
[`foundation/`](../foundation/), and [`tokens/`](../tokens/). Its output (a build
plan) is consumed by [`builder/`](../builder/).

## Status

⬜ Not started — see [Phase 6](../ROADMAP.md#phase-6--prompts-the-intent-layer).
