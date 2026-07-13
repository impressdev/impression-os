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

## The `impression` CLI

One command, zero dependencies (Node ≥ 20). Run it from the repo root:

```bash
node tools/bin/impression.js <command>
```

| Command | Does |
| ------- | ---- |
| `build <plan.json> [--out <dir>] [--theme <name>]` | Compile a build plan into an Elementor Pro kit + templates. |
| `validate` | Check every data artifact against its schema and reference integrity. |
| `lint <plan.json>` | Run the build-plan guardrails against a plan. |
| `list <recipes\|components\|themes>` | List what the system offers. |
| `new <name> [--out <brief.json>]` | Scaffold a minimal, schema-valid brief. |
| `help` | Usage. |

Examples:

```bash
node tools/bin/impression.js validate
node tools/bin/impression.js list recipes
node tools/bin/impression.js new Acme --out acme.brief.json
node tools/bin/impression.js build examples/northwind/plan.json --out dist --theme dark
```

## Structure

```
tools/
├── bin/impression.js   The CLI entry point (argument parsing + dispatch)
└── lib/
    ├── commands.js     One function per command
    ├── validate.js     Data validation engine (schemas + references)
    ├── guardrails.js   The machine-checkable build-plan guardrails
    ├── jsonschema.js   Zero-dependency JSON Schema validator
    └── fs.js           JSON + directory helpers
```

`lib/` is the shared home for reusable validation logic — the
[`tests/`](../tests/) harness imports `jsonschema.js` and `guardrails.js` from
here, so the CLI and CI enforce exactly the same rules.

## Conventions

- **One obvious command per task.** Discoverable, well-documented, boringly named.
- **Clear failures.** Errors explain what is wrong; a non-zero exit on failure.
- **No hidden behavior.** Tools operate on the system; they do not make design
  decisions.

## Dependencies

Orchestrates the other layers (notably [`builder/`](../builder/)) but owns no
design decisions of its own.

## Status

✅ **Implemented** — the `impression` CLI (build, validate, lint, list, new) with
its own test suite. Advances continuously alongside every phase. See
[Tooling & docs](../ROADMAP.md#tooling--docs-continuous).
