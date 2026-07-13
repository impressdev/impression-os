// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { build } from '../builder/src/index.js';
import { stableStringify } from '../builder/src/util.js';

const root = repoRoot();
const plan = readJSON(`${root}/prompts/planning/example.plan.json`);

test('building the same plan twice is byte-stable', () => {
  const a = build(root, plan);
  const b = build(root, plan);
  assert.equal(stableStringify(a.kit), stableStringify(b.kit), 'kit is stable');
  assert.equal(stableStringify(a.templates), stableStringify(b.templates), 'templates are stable');
});

test('element ids are deterministic and unique enough within a template', () => {
  const { templates } = build(root, plan);
  for (const t of templates) {
    const ids = [];
    const walk = (n) => { if (n.id) ids.push(n.id); (n.elements ?? []).forEach(walk); (n.content ?? []).forEach(walk); };
    walk(t.template);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, `duplicate element ids in ${t.name} template`);
  }
});
