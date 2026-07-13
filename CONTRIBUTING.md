# Contributing to Impression OS

Thanks for extending the system. Impression OS holds a high bar: every change
must keep the system coherent, deterministic, and accessible. The good news is
that the harness makes "correct" checkable — if the tests are green, your change
respects every contract.

## Principles (non-negotiable)

1. **Compose from the system; never improvise design values.** No raw hex or pixel
   values above the token layer.
2. **Depend only downward:** `prompts → recipes → components → foundation → tokens`.
3. **Determinism:** no randomness or wall-clock in generation. Same input → same
   output.
4. **Accessibility is a contract**, enforced by the harness — not a review step.
5. **Ship the test and the docs with the feature.**

Read [CLAUDE.md](CLAUDE.md) before anything structural, and
[PROJECT.md](PROJECT.md) for the vision and non-goals.

## Setup

Requires **Node ≥ 20**. There are **no dependencies to install** — the builder,
CLI, and harness use only the Node standard library.

```bash
node --test                              # run the full quality harness
node tools/bin/impression.js validate    # fast schema + reference check
node tools/bin/impression.js list recipes
```

## How to add things

Step-by-step guides live in [`docs/guides/`](docs/guides/):

- [Adding a token](docs/guides/adding-a-token.md)
- [Adding a component](docs/guides/adding-a-component.md)
- [Adding a recipe](docs/guides/adding-a-recipe.md)
- [Adding a theme](docs/guides/adding-a-theme.md)

## Before you open a PR

1. `node --test` is green (schema, references, accessibility, determinism,
   guardrails, output regression).
2. New behavior ships with a test; new artifacts are listed in their catalog
   README.
3. A significant design decision is captured as an ADR in
   [`docs/decisions/`](docs/decisions/).
4. If you changed the builder's output on purpose, regenerate the affected
   baselines (see [`tests/visual/README.md`](tests/visual/README.md)) and review
   the diff.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`docs:`, `refactor:`, `chore:`, `test:`), one logical change per commit, imperative
mood. CI runs the harness on every push and pull request.
