// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { repoRoot, readJSON } from '../lib/paths.js';
import { build } from '../../builder/src/index.js';

const root = repoRoot();
const baseDir = `${root}/tests/visual/baselines`;

/**
 * Output-snapshot regression. True pixel visual regression needs an Elementor
 * renderer (a future capability); until then we regression-test the compiler's
 * *output* — the kit and every template — against committed baselines. Any
 * unintended change to emitted structure or values fails here.
 *
 * To intentionally update the baselines after a reviewed change:
 *   node builder/bin/impression-build.js \
 *     --brief prompts/planning/example.plan.json --out tests/visual/baselines --root .
 */

test('kit output matches its baseline', () => {
  const { kit } = build(root, readJSON(`${root}/prompts/planning/example.plan.json`));
  assert.deepEqual(kit, readJSON(`${baseDir}/kit.json`));
});

test('every section template matches its baseline', () => {
  const { templates } = build(root, readJSON(`${root}/prompts/planning/example.plan.json`));
  for (const t of templates) {
    const baseline = `${baseDir}/templates/${t.name}.json`;
    assert.ok(existsSync(baseline), `missing baseline for ${t.name}`);
    assert.deepEqual(t.template, readJSON(baseline), `${t.name} template drifted from baseline`);
  }
});
