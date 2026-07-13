# Example — Northwind

The first site generated end-to-end by Impression OS: a full marketing landing
page for *Northwind*, a fictional operations-analytics company. This is **living
proof** — every file here is reproduced, byte-for-byte, from the brief by the
committed builder, and CI verifies it on every change.

## What it demonstrates

- A single [brief](brief/brief.json) → a deterministic [build plan](plan.json) →
  a complete Elementor Pro [kit](kit/) with **8 section templates** and **59
  widgets**, all styled from tokens.
- The whole layer stack working together: tokens → foundation → components →
  recipes → prompts → builder.
- **Determinism:** the recorded [provenance](provenance.json) checksum matches a
  fresh build (asserted in `tests/example.test.mjs`).

## Contents

```
northwind/
├── brief/brief.json     The structured client brief (the input)
├── plan.json            The build plan the planner produced from the brief
├── kit/
│   ├── kit.json         Elementor Site Settings (global colors, fonts, layout)
│   └── templates/       One importable template per section
│       ├── header.json  hero.json  feature-grid.json  testimonial.json
│       └── pricing.json faq.json   cta.json           footer.json
└── provenance.json      Generator version + checksum for reproducibility
```

The page, in order: **header → hero → feature-grid → testimonial → pricing → faq
→ cta → footer**.

## Reproduce it

```bash
node builder/bin/impression-build.js \
  --brief examples/northwind/plan.json \
  --out examples/northwind/kit --root .
```

The output is byte-identical to what is committed here. Verify the checksum:

```bash
node --test tests/example.test.mjs
```

## Import into WordPress + Elementor

> Automated import and screenshot verification require a live WordPress +
> Elementor Pro environment, which is outside this repository. These are the
> manual steps to apply the generated kit; the artifacts above are exactly what
> those steps consume.

1. **Apply global styles.** In WordPress, open **Elementor → Site Settings** and
   import `kit/kit.json` — this sets the Global Colors, Global Fonts, and layout
   defaults for the whole site.
2. **Import the section templates.** In **Templates → Saved Templates**, import
   each file in `kit/templates/`. Each is a standard Elementor container tree.
3. **Assemble the page** in the order above; each section already references the
   kit's globals, so styling is consistent out of the box.
4. **Verify** against the checklist below.

### Verification checklist

- [ ] One `h1` on the page (the hero); headings descend without skipping levels.
- [ ] Global colors/fonts resolve (no orphaned or hard-coded styles).
- [ ] Text and controls meet contrast (enforced by the token set; re-check after
      any manual edit).
- [ ] Nav exposes the current page; the footer is a `contentinfo` landmark.
- [ ] Layout holds from mobile to desktop per each recipe's responsive rules.

## Provenance

See [`provenance.json`](provenance.json) — generator, version, exact command,
output counts, and the SHA-256 checksum of the emitted kit + templates. Because
the builder is deterministic, that checksum is the example's fingerprint.
