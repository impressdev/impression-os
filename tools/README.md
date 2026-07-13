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
| `theme <name> (--accent <ramp> \| --hex <#color>) [--base light\|dark]` | Generate a brand theme; accent steps chosen by contrast to meet WCAG AA. |
| `resolve-theme <brief.json>` | Resolve a brief's brand direction to a concrete theme (via the accent lexicon). |
| `help` | Usage. |

Examples:

```bash
node tools/bin/impression.js validate
node tools/bin/impression.js list recipes
node tools/bin/impression.js new Acme --out acme.brief.json
node tools/bin/impression.js build examples/northwind/plan.json --out dist --theme dark
node tools/bin/impression.js theme acme --accent violet --base dark
node tools/bin/impression.js theme sunset --hex "#ff5a1f"
```

The `theme` command **selects the accent, link, and focus steps by contrast** so
the result is guaranteed to meet WCAG 2.1 AA, writes
`tokens/themes/brand.<name>.json` as a delta over the base theme, and registers it
in the token manifest. The accessibility harness then covers it like any other
theme.

- `--accent <ramp>` themes against an existing primitive ramp (brand, teal,
  violet, info, …).
- `--hex <#color>` **synthesizes a full 50–950 ramp from one brand color**, stores
  it as a primitive in `tokens/primitives/brand-ramps.json`, and themes against it
  — still held to the same AA contract (it throws if no step can satisfy it). See
  [ADR-0009](../docs/decisions/0009-contrast-driven-brand-themes.md).

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
