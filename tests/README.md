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
├── lib/
│   ├── jsonschema.js   Zero-dependency JSON Schema (draft 2020-12 subset) validator
│   ├── contrast.js     WCAG relative-luminance contrast ratio
│   ├── guardrails.js   The machine-checkable build-plan guardrails
│   └── paths.js        Repo-root + JSON helpers
├── schema.test.mjs        Every token/component/recipe/brief/plan validates against its schema
├── references.test.mjs    All {references} resolve; binding + component-ref integrity; manifest ↔ disk
├── accessibility.test.mjs Contrast contracts (WCAG 2.1 AA) per theme, from foundation/accessibility
├── determinism.test.mjs   Builder output is byte-stable; element ids are unique
├── guardrails.test.mjs    The reference plan passes; a negative fixture is caught
├── visual/
│   ├── regression.test.mjs Output-snapshot regression vs. committed baselines
│   └── baselines/          The approved kit + templates
└── fixtures/               Test inputs (incl. an intentionally invalid plan)
```

Built on Node's built-in test runner (`node:test`), **zero dependencies** —
consistent with the [builder](../builder/). See
[ADR-0007](../docs/decisions/0007-quality-harness.md).

## Running

```bash
node --test          # the whole harness (also runs the builder's own smoke test)
```

## What is guarded

| Area | Test | Enforces |
| ---- | ---- | -------- |
| Schema | `schema.test.mjs` | Structure of tokens, components, recipes, briefs, plans. |
| References | `references.test.mjs` | No dangling `{token}`; components avoid primitive color/font; recipe component refs exist. |
| Accessibility | `accessibility.test.mjs` | Text ≥ 4.5:1, non-text ≥ 3:1, both themes. |
| Determinism | `determinism.test.mjs` | Same input → byte-stable output; unique ids. |
| Guardrails | `guardrails.test.mjs` | Build plans stay inside the system. |
| Regression | `visual/regression.test.mjs` | Emitted kit + templates match approved baselines. |

## Conventions

- **A layer is not "done" until it is guarded here.** Tests ship with the feature,
  not after it.
- **Fail closed.** An unverifiable guarantee is treated as a failing one.
- **Baselines are reviewed.** A baseline change is deliberate — regenerate it
  explicitly (see [`visual/README.md`](visual/README.md)) and review the diff.

## Dependencies

Reads every layer and validates the output of [`builder/`](../builder/). Runs in
CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) to gate every
change.

## Status

✅ **Implemented** — schema, reference, accessibility, determinism, guardrail, and
output-regression suites all pass (and caught two real defects on first run: a
sub-AA dark-accent pairing and an id-collision in the builder, both fixed). CI
gates every push and PR. See [Phase 7](../ROADMAP.md#phase-7--quality-harness).

> True *pixel* visual regression needs an Elementor renderer (a future
> capability). Until then, `visual/` regression-tests the compiler's **output**
> against committed baselines — see [`visual/README.md`](visual/README.md).
