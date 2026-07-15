// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot, readJSON } from './lib/paths.js';
import { build, renderPage } from '../builder/src/index.js';
import { previewSiteCmd } from '../tools/lib/commands.js';

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

test('unresolved image URLs render as branded SVG placeholders, not broken images', () => {
  const html = previewFor(`${root}/examples/northwind/plan.json`);
  assert.ok(!/<img src="\//.test(html), 'no site-relative img src remains');
  assert.match(html, /<img src="data:image\/svg\+xml/, 'placeholder data URI present');
  assert.match(html, /alt="The Northwind operations dashboard"/, 'alt text preserved');
  // the placeholder carries the brand palette (accent from the kit)
  assert.ok(html.includes(encodeURIComponent('#4f46e5')), 'brand accent inside the SVG');
});

test('preview output is deterministic', () => {
  const a = previewFor(`${root}/examples/lumen/plan.json`);
  const b = previewFor(`${root}/examples/lumen/plan.json`);
  assert.equal(a, b);
});

test('preview-site renders one linked HTML page per site page', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ios-preview-'));
  const r = previewSiteCmd(root, `${root}/examples/atlas/site.json`, dir);
  assert.deepEqual(r.pages.sort(), ['about.html', 'index.html']);
  const files = readdirSync(dir).sort();
  assert.deepEqual(files, ['about.html', 'index.html']);
  // the footer links /about → the internal link is rewritten to the preview file
  const home = readFileSync(join(dir, 'index.html'), 'utf8');
  assert.match(home, /href="about\.html"/);
  assert.ok(!home.includes('href="/about"'), 'no unrewritten internal link to a generated page');
});
