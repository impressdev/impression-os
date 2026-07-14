// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { build, renderPage } from '../builder/src/index.js';

const root = repoRoot();

function previewFor(planPath) {
  const { kit, templates, page } = build(root, readJSON(planPath));
  return renderPage(kit, templates, page);
}

test('renderPage produces a self-contained HTML document', () => {
  const html = previewFor(`${root}/examples/northwind/plan.json`);
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<style>/); // CSS is inlined (self-contained)
  assert.match(html, /--color-accent: #[0-9a-f]{6}/i); // tokens → CSS vars
});

test('the preview renders real content, not empty sections', () => {
  const html = previewFor(`${root}/examples/northwind/plan.json`);
  assert.ok(!html.includes('<div class="container"></div>'), 'no empty section containers');
  assert.match(html, /See the problem before it ships/); // hero headline
  assert.match(html, /Book a demo/);                      // CTA text
  assert.match(html, /<h1>/);                             // hero h1 rendered
  const sections = (html.match(/<section class="section">/g) || []).length;
  assert.equal(sections, 8);
});

test('the preview head carries title, description, and JSON-LD is absent for single-page', () => {
  const html = previewFor(`${root}/examples/northwind/plan.json`);
  assert.match(html, /<title>Northwind — landing<\/title>/);
  assert.match(html, /<meta name="description"/);
});

test('preview output is deterministic', () => {
  const a = previewFor(`${root}/examples/lumen/plan.json`);
  const b = previewFor(`${root}/examples/lumen/plan.json`);
  assert.equal(a, b);
});
