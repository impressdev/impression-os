# Tests

**The executable definition of "correct" for Impression OS.**

Tests are where the word *professional* stops being an opinion and becomes a
property the system can prove. This layer validates the structure of every token,
component, and recipe; enforces the accessibility contracts from
[`foundation/`](../foundation/); and guards generated output against visual
regressions.

## Why this layer exists

A generative system without a quality harness degrades silently — each change
risks a regression no one notices until a client does. Tests make quality a gate,
not a hope: nothing merges that fails a contract, and "it looks fine" is replaced
by "it passes."

## What this layer guarantees

- **Schema validity** — tokens, components, and recipes match their definitions.
- **Dependency integrity** — no layer depends upward; the stack stays acyclic.
- **Accessibility** — contrast, semantic structure, and focus order meet the
  foundation contracts (targeting WCAG 2.1 AA).
- **Determinism** — the same brief and version produce byte-stable output.
- **Visual regression** — generated renders are diffed against approved baselines.

## Planned structure

```
tests/
├── schema/         Structural validation of tokens, components, recipes
├── accessibility/  Contrast, semantics, and focus-order checks
├── determinism/    Byte-stability of builder output
└── visual/         Regression baselines and diffs
```

## Conventions

- **A layer is not "done" until it is guarded here.** Tests ship with the feature,
  not after it.
- **Fail closed.** An unverifiable guarantee is treated as a failing one.
- **Baselines are reviewed.** Visual baseline changes are deliberate, not
  accidental.

## Dependencies

Reads every layer and validates the output of [`builder/`](../builder/). Runs in
CI to gate every change.

## Status

⬜ Not started — see [Phase 7](../ROADMAP.md#phase-7--quality-harness).
