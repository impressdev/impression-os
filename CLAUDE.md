# CLAUDE.md

Operating guide for AI agents (and humans) working inside the Impression OS
repository. Read this before making changes. It encodes the rules that keep the
system coherent as it grows.

---

## What this project is

Impression OS is an **AI-native operating system for generating professional
WordPress websites with Elementor Pro**. It is a layered design system expressed
as data, plus an engine that compiles it into an Elementor Pro kit.

It is **not** a website, **not** a template, and **not** a theme. Read
[PROJECT.md](PROJECT.md) for the full charter before proposing anything
structural.

## The one rule that matters most

> **Compose from the system. Never improvise design values.**

Every color, space, font size, radius, and shadow is owned by the `tokens/`
layer. If you find yourself typing a raw hex code, a pixel value, or a font size
into a component, recipe, or generated output — stop. That value belongs in a
token, and the thing you are editing should reference it.

## The dependency stack

Layers may depend **only downward**. Enforce this in every change.

```
prompts/    →  may reference recipes, components, foundation, tokens
recipes/    →  may reference components, foundation, tokens
components/ →  may reference foundation, tokens
foundation/ →  may reference tokens
tokens/     →  depends on nothing (source of truth)
```

A change that makes a lower layer depend on a higher one is always wrong. Flag it
rather than working around it.

## Where things live

| If you are working on…                        | Go to…          |
| --------------------------------------------- | --------------- |
| A raw design value (color, spacing, type)     | [`tokens/`](tokens/)         |
| A design law or rule (grid, rhythm, a11y)     | [`foundation/`](foundation/) |
| A single reusable unit (button, card)         | [`components/`](components/)  |
| A composed section (hero, pricing, footer)    | [`recipes/`](recipes/)       |
| How a brief becomes a build                   | [`prompts/`](prompts/)       |
| The compiler that emits the Elementor kit     | [`builder/`](builder/)       |
| A CLI or dev utility                          | [`tools/`](tools/)           |
| A reference site                              | [`examples/`](examples/)     |
| A guarantee about correctness                 | [`tests/`](tests/)           |
| Long-form docs or a decision record           | [`docs/`](docs/)             |

Each folder has its own `README.md` describing its purpose and conventions. Read
the local README before adding files to a folder.

## Working principles for agents

1. **Read before you write.** Read the relevant folder README and any linked docs
   before adding or changing files. Match the conventions already present.
2. **Prefer editing over adding.** Extend an existing token set, component, or
   recipe rather than creating a parallel one. One source of truth per decision.
3. **Stay in scope.** Do exactly the task asked. Do not scaffold components,
   recipes, or builder code unless that is the explicit request.
4. **Document as you build.** A new primitive without documentation is
   incomplete. Update the folder README when you add to it.
5. **Accessibility is not optional.** Any visual decision must satisfy the
   contracts in `foundation/` (contrast, semantics, focus order).
6. **Determinism is a feature.** Do not introduce randomness or time-dependent
   behavior into generation. Same input + same version → same output.
7. **The output must be clean Elementor.** Generated kits must be fully editable
   in Elementor Pro, with no broken or orphaned styles.

## Conventions

- **Documentation:** Markdown, sentence-case headings, wrapped prose. Every folder
  keeps an up-to-date `README.md`.
- **Naming:** kebab-case for files and directories; clear, boring, descriptive
  names over clever ones.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`). One logical change
  per commit; imperative mood.
- **Tokens over literals:** enforced everywhere above the token layer.

## What NOT to do

- ❌ Do not hard-code design values outside `tokens/`.
- ❌ Do not create a second source of truth for a decision that already has one.
- ❌ Do not add components, recipes, or builder logic ahead of the roadmap or the
  explicit request.
- ❌ Do not introduce non-determinism into the generation pipeline.
- ❌ Do not ship output that would fail the `tests/` contracts.
- ❌ Do not break the downward-only dependency rule.

## Current status

**Pre-alpha.** The repository currently contains architecture and documentation
only — no components, recipes, or builder code exist yet. If you are asked to
"build" something, first confirm it aligns with the current phase in
[ROADMAP.md](ROADMAP.md).

## Quick links

- [README.md](README.md) — the overview and pitch.
- [PROJECT.md](PROJECT.md) — the full charter, scope, and non-goals.
- [ROADMAP.md](ROADMAP.md) — what we are building and in what order.
- [`docs/`](docs/) — deep dives and architecture decision records.
