// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { repoRoot, readJSON } from './lib/paths.js';
import { build } from '../builder/src/index.js';
import { stableStringify } from '../builder/src/util.js';

const root = repoRoot();

/** Every committed example must reproduce byte-for-byte from its plan, and its
 *  recorded provenance checksum must match a fresh build. Examples are living,
 *  CI-verified proof — discovered automatically from examples/<name>/plan.json. */
const examples = readdirSync(`${root}/examples`, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${root}/examples/${d.name}/plan.json`))
  .map((d) => d.name);

test('at least two examples exist', () => {
  assert.ok(examples.length >= 2, `found examples: ${examples.join(', ')}`);
});

for (const name of examples) {
  const dir = `${root}/examples/${name}`;

  test(`${name}: committed kit reproduces from its plan`, () => {
    const { kit } = build(root, readJSON(`${dir}/plan.json`));
    assert.deepEqual(kit, readJSON(`${dir}/kit/kit.json`));
  });

  test(`${name}: every committed template reproduces from its plan`, () => {
    const { templates } = build(root, readJSON(`${dir}/plan.json`));
    for (const t of templates) {
      assert.deepEqual(t.template, readJSON(`${dir}/kit/templates/${t.name}.json`), `${t.name} drifted`);
    }
  });

  test(`${name}: recorded provenance checksum matches a fresh build`, () => {
    const r = build(root, readJSON(`${dir}/plan.json`));
    const checksum = createHash('sha256').update(stableStringify({ kit: r.kit, templates: r.templates })).digest('hex');
    const prov = readJSON(`${dir}/provenance.json`);
    assert.equal(checksum, prov.checksum.value, `${name}: checksum drift — regenerate the example`);
    assert.equal(prov.output.sections, r.templates.length);
  });
}
