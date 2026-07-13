# Builder

**The compiler of Impression OS.**

The builder is the engine that turns the system into a shippable artifact. It
takes a build plan (from [`prompts/`](../prompts/)), resolves it against tokens,
foundation, components, and recipes, and emits an **Elementor Pro kit**: global
styles plus importable section and page templates.

## Why this layer exists

Everything below the builder is a *description* — data and rules. The builder is
what makes those descriptions *real*, deterministically, in a format Elementor Pro
can import and a human can edit. It is the single place where the abstract system
meets the concrete platform.

## Responsibilities

- **Resolve** a build plan against the full layer stack.
- **Emit global styles** — translate semantic tokens into an Elementor Pro kit
  (global colors, fonts, and settings).
- **Emit templates** — translate recipes into importable Elementor section/page
  templates.
- **Guarantee determinism** — identical input and version produce byte-stable
  output.
- **Guarantee editability** — output is clean Elementor with no orphaned or broken
  styles.

## The pipeline

```
build plan ─▶ resolve (tokens · foundation · components · recipes)
           ─▶ emit kit globals   (colors, fonts, settings)
           ─▶ emit templates     (sections, pages)
           ─▶ Elementor Pro Kit  ─▶  import into WordPress
```

## Planned structure

```
builder/
├── resolve/    Turn a plan + layers into a fully-resolved model
├── emit/       Render the resolved model to Elementor Pro kit + templates
└── kit/        Elementor kit format helpers and output contracts
```

## Conventions

- **Deterministic only.** No randomness, no wall-clock or environment dependence.
- **Clean output.** Generated kits must be fully editable in Elementor Pro.
- **No design decisions here.** The builder *renders* decisions; it never *makes*
  them. Every value it emits traces back to a token.

## Dependencies

Consumes a build plan from [`prompts/`](../prompts/) and reads
[`recipes/`](../recipes/), [`components/`](../components/),
[`foundation/`](../foundation/), and [`tokens/`](../tokens/). Its output is
validated by [`tests/`](../tests/).

## Status

⬜ Not started — see [Phase 5](../ROADMAP.md#phase-5--builder-the-compiler).
