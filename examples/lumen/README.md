# Example — Lumen

A second site generated end-to-end by Impression OS, chosen to exercise different
parts of the system than [Northwind](../northwind/): the **`lead` blueprint**
(ending in a contact form) and a **brand theme** (`brand.teal`) rather than the
default light theme.

## What it demonstrates

- A [brief](brief/brief.json) → [build plan](plan.json) → a complete Elementor Pro
  [kit](kit/) with **6 sections** and **41 widgets**, styled entirely from the
  `brand.teal` theme's tokens.
- The lead-generation shape: **header → hero → feature-grid → stats → contact →
  footer**, with the `stats` and `contact` recipes and a real Elementor Form.
- Brand theming in action — the accent, links, and buttons resolve to the teal
  brand globals rather than the default indigo.
- **Determinism** — the [provenance](provenance.json) checksum matches a fresh
  build (asserted in `tests/example.test.mjs`).

## Reproduce it

```bash
node tools/bin/impression.js build examples/lumen/plan.json --out examples/lumen/kit
node --test tests/example.test.mjs
```

The output is byte-identical to what is committed here.

## Import into WordPress + Elementor

The steps are the same as for [Northwind](../northwind/README.md#import-into-wordpress--elementor):
apply `kit/kit.json` in **Site Settings**, import each `kit/templates/*.json`, and
assemble the page in section order. (Live WordPress verification needs a WordPress
environment and is the one manual step.)

## Provenance

See [`provenance.json`](provenance.json) — theme, blueprint, exact command, output
counts, and the SHA-256 checksum of the emitted kit + templates.
