# Visual / output regression

True **pixel** visual regression requires rendering the generated Elementor kit in
a real WordPress + Elementor environment and diffing screenshots. That renderer is
a future capability. Until it exists, this suite protects the next best thing: the
compiler's **output**.

## What it does

[`regression.test.mjs`](regression.test.mjs) builds the reference
[example plan](../../prompts/planning/example.plan.json) and asserts that the
emitted **kit** and **every section template** are byte-for-byte identical to the
approved baselines in [`baselines/`](baselines/). Because the builder is
deterministic, any unintended change to emitted structure, ids, or values shows up
here as a diff.

## Updating the baselines

Baseline changes must be **deliberate and reviewed**. After an intentional change
to the builder, tokens, or the example plan, regenerate:

```bash
node builder/bin/impression-build.js \
  --brief prompts/planning/example.plan.json \
  --out tests/visual/baselines --root .
```

Then review the diff before committing — a baseline change is a statement that the
new output is the intended output.

## Roadmap

When an Elementor render harness is available, this folder gains screenshot
baselines and perceptual diffs on top of the output snapshots. Tracked under
[Phase 7](../../ROADMAP.md#phase-7--quality-harness) / future work.
