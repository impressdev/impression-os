# Tools

**Developer utilities and the Impression OS CLI.**

Tools are the scripts and command-line utilities that make the system pleasant to
author, validate, build, and ship. This is the developer-experience layer — the
part of the project that, done well, makes doing the right thing the easy thing.

## Why this layer exists

A system is only as good as the ergonomics of working in it. Tailwind, shadcn/ui,
and Laravel earned their reputations as much through tooling as through design.
This folder is where Impression OS invests in the same: fast feedback, clear
errors, and one obvious command for every common task.

## Responsibilities (planned)

- **Author** — scaffold and edit tokens, components, and recipes correctly.
- **Validate** — run schema and accessibility checks locally before commit.
- **Build** — invoke the [`builder/`](../builder/) to produce an Elementor Pro kit.
- **Ship** — package and export kits for import into WordPress.

## Planned structure

```
tools/
├── cli/       The Impression OS command-line interface
└── scripts/   Focused, single-purpose utilities
```

## Conventions

- **One obvious command per task.** Discoverable, well-documented, boringly named.
- **Clear failures.** Errors explain what is wrong and how to fix it.
- **No hidden behavior.** Tools operate on the system; they do not make design
  decisions.

## Dependencies

Orchestrates the other layers (notably [`builder/`](../builder/) and
[`tests/`](../tests/)) but owns no design decisions of its own.

## Status

⬜ Not started — advances continuously alongside every phase. See
[Tooling & docs](../ROADMAP.md#tooling--docs-continuous).
