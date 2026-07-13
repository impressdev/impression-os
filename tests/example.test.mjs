// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { repoRoot, readJSON, listJSON } from './lib/paths.js';
import { build } from '../builder/src/index.js';
import { stableStringify } from '../builder/src/util.js';

const root = repoRoot();
const dir = `${root}/examples/northwind`;

/**
 * The committed Northwind example must reproduce byte-for-byte from its plan,
 * and its recorded checksum must match a fresh build. This makes the example
 * living, CI-verified proof — not a stale artifact.
 */

test('the committed example kit reproduces from its plan', () => {
  const { kit } = build(root, readJSON(`${dir}/plan.json`));
  assert.deepEqual(kit, readJSON(`${dir}/kit/kit.json`));
});

test('every committed example template reproduces from its plan', () => {
  const { templates } = build(root, readJSON(`${dir}/plan.json`));
  for (const t of templates) {
    assert.deepEqual(t.template, readJSON(`${dir}/kit/templates/${t.name}.json`), `${t.name} drifted`);
  }
});

test('the recorded provenance checksum matches a fresh build', () => {
  const r = build(root, readJSON(`${dir}/plan.json`));
  const checksum = createHash('sha256').update(stableStringify({ kit: r.kit, templates: r.templates })).digest('hex');
  const prov = readJSON(`${dir}/provenance.json`);
  assert.equal(checksum, prov.checksum.value, 'checksum drift — regenerate the example and its provenance');
  assert.equal(prov.output.sections, r.templates.length);
});

test('the example brief validates and its plan uses only real recipes', () => {
  const sources = readJSON(`${root}/tokens/manifest.json`); // sanity: manifest readable
  assert.ok(sources.themes.available.includes('light'));
  const plan = readJSON(`${dir}/plan.json`);
  const recipeNames = new Set(listJSON(`${root}/recipes`).filter((f) => !f.includes('/schema/')).map((f) => readJSON(f).name));
  for (const s of plan.sections) assert.ok(recipeNames.has(s.recipe), `unknown recipe ${s.recipe}`);
});
