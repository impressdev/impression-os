// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { build } from '../builder/src/index.js';
import { stableStringify } from '../builder/src/util.js';

const root = repoRoot();

test('page metadata is derived from meta.name and the hero when seo is absent', () => {
  const { page } = build(root, readJSON(`${root}/examples/northwind/plan.json`));
  assert.equal(page.title, 'Northwind — landing');
  assert.match(page.description, /Northwind turns scattered/);
  assert.ok(page.description.length <= 160);
  assert.equal(page.og.image, '/assets/dashboard.png');
  assert.equal(page.og.title, page.title);
});

test('explicit seo fields win over derivation', () => {
  const plan = {
    theme: 'light',
    meta: { name: 'Acme' },
    seo: { title: 'Acme — the fastest CRM', description: 'Custom.', ogImage: '/og.png' },
    sections: [{ recipe: 'hero', content: { heading: 'H', subheading: 'ignored', primaryCta: { label: 'x', href: '/' } } }],
  };
  const { page } = build(root, plan);
  assert.equal(page.title, 'Acme — the fastest CRM');
  assert.equal(page.description, 'Custom.');
  assert.equal(page.og.image, '/og.png');
});

test('an over-long description is clipped to <=160 chars on a word boundary', () => {
  const long = 'word '.repeat(60).trim();
  const plan = { theme: 'light', sections: [{ recipe: 'hero', content: { heading: 'H', subheading: long, primaryCta: { label: 'x', href: '/' } } }] };
  const { page } = build(root, plan);
  assert.ok(page.description.length <= 160);
  assert.match(page.description, /…$/);
  assert.ok(!page.description.includes('  '), 'no dangling partial word/space');
});

test('page metadata is deterministic', () => {
  const plan = readJSON(`${root}/examples/lumen/plan.json`);
  assert.equal(stableStringify(build(root, plan).page), stableStringify(build(root, plan).page));
});
