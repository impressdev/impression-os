# Adding a theme

A theme supplies the semantic **color** roles. Light is the base; dark and brand
themes are deltas (`$extends`). The easiest — and safest — way to add one is to
**generate** it, so its contrast is guaranteed to meet WCAG AA.

## Generate a brand theme (recommended)

```bash
# theme against an existing ramp
node tools/bin/impression.js theme acme --accent violet --base light

# or synthesize a ramp from one brand color
node tools/bin/impression.js theme acme --accent violet --hex "#7c3aed"
```

The generator **picks the accent, link, and focus steps by contrast** so the
result meets AA — and throws if a ramp can't. It writes
`tokens/themes/brand.<name>.json`, registers it in the manifest, and (for `--hex`)
stores the synthesized ramp as a primitive in `tokens/primitives/brand-ramps.json`.
See [ADR-0009](../decisions/0009-contrast-driven-brand-themes.md).

## Hand-author a theme (advanced)

If you must write one by hand, copy [`themes/dark.json`](../../tokens/themes/dark.json)
(a full override) or [`themes/brand.example.json`](../../tokens/themes/brand.example.json)
(a `$extends` delta), and override the semantic color roles you need. Every value
is a `{reference}` to a primitive — no literals.

Then register the file under `layers.themes` and `themes.available` in
[`tokens/manifest.json`](../../tokens/manifest.json).

> The accessibility harness checks **every** theme in the manifest. Hand-authored
> themes drift — the original `brand.example` shipped at 4.47:1 and the harness
> caught it. Prefer generation.

## Make the planner aware (optional)

To let a brief's wording select your theme, ensure the accent word maps to your
theme's ramp in
[`prompts/planning/accent-lexicon.json`](../../prompts/planning/accent-lexicon.json),
then check:

```bash
node tools/bin/impression.js resolve-theme <brief.json>
```

## Verify

```bash
node --test tests/accessibility.test.mjs   # your theme meets AA across all pairings
node tools/bin/impression.js validate
node tools/bin/impression.js build <plan.json> --out dist --theme <name>
```
