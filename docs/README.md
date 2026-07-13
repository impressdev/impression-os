# Docs

**Long-form documentation, guides, and decision records for Impression OS.**

The top-level [README](../README.md), [PROJECT.md](../PROJECT.md), and
[CLAUDE.md](../CLAUDE.md) explain *what* the system is and *how to work in it*.
This folder is for everything that needs more room: the reasoning behind
decisions, deep dives into each layer, and the guides that turn a newcomer into a
contributor.

## Why this layer exists

In a system meant to outlive any single conversation, the *why* matters as much as
the *what*. A value in `tokens/` or a rule in `foundation/` is only safe to change
if the reasoning that produced it is written down. Docs is where that reasoning
lives, so future authors — human or AI — extend the system instead of accidentally
unwinding it.

## What lives here (planned)

- **Architecture** — how the layers fit together, in depth.
- **Decision records (ADRs)** — the significant choices and their rationale.
- **Authoring guides** — how to add a token, a component, a recipe correctly.
- **Concepts** — the vocabulary and mental models the system relies on.

## Structure

```
docs/
├── architecture/   Deep dives (e.g. token → Elementor mapping)
├── decisions/      Architecture decision records — ADR-0001 … ADR-0009
├── guides/         How-to guides: adding a token / component / recipe / theme
└── concepts/       Vocabulary and mental models (planned)
```

See also [CONTRIBUTING.md](../CONTRIBUTING.md) for the contribution workflow.

## Conventions

- **Explain the why, not just the what.** Docs that only restate the code earn
  their deletion.
- **Decision records are immutable.** Superseded decisions are marked, not erased.
- **Keep it current.** A doc that contradicts the system is a bug.

## Dependencies

Documents every layer; owns no design decisions itself.

## Status

⬜ Not started — advances continuously alongside every phase. See
[Tooling & docs](../ROADMAP.md#tooling--docs-continuous).
