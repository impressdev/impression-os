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
| `build-site <site.json> [--out <dir>]` | Compile a multi-page site plan into one kit + per-page templates. |
| `preview <plan.json> [--out <dir>]` | Render a plan to a self-contained HTML preview (no WordPress). |
| `preview-site <site.json> [--out <dir>]` | Render a multi-page site plan to linked HTML preview pages. |
| `validate` | Check every data artifact against its schema and reference integrity. |
| `lint <plan.json>` | Run the build-plan guardrails against a plan. |
| `list <recipes\|components\|themes>` | List what the system offers. |
| `new <name> [--out <brief.json>]` | Scaffold a minimal, schema-valid brief. |
| `theme <name> (--accent <ramp> \| --hex <#color>) [--base light\|dark]` | Generate a brand theme; accent steps chosen by contrast to meet WCAG AA. |
| `resolve-theme <brief.json>` | Resolve a brief's brand direction to a concrete theme (via the accent lexicon). |
| `plan <brief.json> [--out <plan.json>]` | Expand a brief into a single-page build plan — no LLM. |
| `plan-site <brief.json> [--out <site.json>]` | Expand a brief into a multi-page site plan — no LLM. |
| `help` | Usage. |

Examples:

```bash
node tools/bin/impression.js validate
node tools/bin/impression.js list recipes
node tools/bin/impression.js new Acme --out acme.brief.json
node tools/bin/impression.js build examples/northwind/plan.json --out dist --theme dark
node tools/bin/impression.js preview examples/northwind/plan.json --out preview  # → preview/index.html
node tools/bin/impression.js theme acme --accent violet --base dark
node tools/bin/impression.js theme sunset --hex "#ff5a1f"
node tools/bin/impression.js plan brief.json --out plan.json    # brief → plan, no LLM
```

### The deterministic planner

`impression plan` runs the whole intent step **in code**: it resolves the theme
(via the accent lexicon), expands the page's blueprint, and maps the brief's
content onto each recipe's content contract — dropping any section whose required
content the brief doesn't supply, never inventing copy. For standard briefs this
makes the full pipeline **brief → plan → kit** runnable without an LLM, and
byte-stable:

```bash
node tools/bin/impression.js plan brief.json --out plan.json
node tools/bin/impression.js lint plan.json
node tools/bin/impression.js build plan.json --out dist
```

The LLM planner ([`prompts/planning/`](../prompts/planning/)) remains the path for
briefs that need judgement beyond the blueprint mapping.

**Multiple pages.** A brief's `pages` list expands into a **site plan** —
one shared theme, one page per entry (each with its own blueprint and path):

```bash
node tools/bin/impression.js plan-site brief.json --out site.json
```

Each page is an ordinary section list, so it lints and builds like any plan.
Compile the whole site at once — one shared kit, one folder per page:

```bash
node tools/bin/impression.js build-site site.json --out dist
# dist/kit.json, dist/site.json, dist/sitemap.{json,xml}, dist/robots.txt,
# dist/pages/<slug>/{templates/*, page.json}
```

Each page's `page.json` carries a `canonical` path and a `robots` directive; mark a
page `"noindex": true` in the site plan to keep it out of search (meta-robots +
`robots.txt` Disallow).

`build-site` also generates a **sitemap** and warns about **orphan pages** — pages
it built that aren't linked from any nav, footer, or CTA, so a visitor couldn't
reach them.

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
