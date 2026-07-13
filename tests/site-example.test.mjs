// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { repoRoot, readJSON } from './lib/paths.js';
import { buildSite } from '../builder/src/index.js';
import { stableStringify } from '../builder/src/util.js';

const root = repoRoot();

/** Multi-page examples are discovered from examples/<name>/site.json. */
const siteExamples = readdirSync(`${root}/examples`, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${root}/examples/${d.name}/site.json`))
  .map((d) => d.name);

for (const name of siteExamples) {
  const dir = `${root}/examples/${name}`;

  test(`${name}: committed site reproduces from its site plan`, () => {
    const result = buildSite(root, readJSON(`${dir}/site.json`));
    assert.deepEqual(result.kit, readJSON(`${dir}/kit/kit.json`), 'shared kit');
    for (const page of result.pages) {
      const base = `${dir}/kit/pages/${page.slug}`;
      assert.deepEqual(page.page, readJSON(`${base}/page.json`), `${page.path} metadata`);
      for (const t of page.templates) {
        assert.deepEqual(t.template, readJSON(`${base}/templates/${t.name}.json`), `${page.path}/${t.name}`);
      }
    }
  });

  test(`${name}: recorded provenance checksum matches a fresh build`, () => {
    const result = buildSite(root, readJSON(`${dir}/site.json`));
    const checksum = createHash('sha256').update(stableStringify(result)).digest('hex');
    const prov = readJSON(`${dir}/provenance.json`);
    assert.equal(checksum, prov.checksum.value, `${name}: checksum drift — regenerate the example`);
    assert.equal(prov.pages.length, result.pages.length);
  });
}
