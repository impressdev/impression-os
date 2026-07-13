// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build, resolveTheme, loadSources } from '../src/index.js';
import { stableStringify } from '../src/util.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const brief = JSON.parse(readFileSync(resolve(here, 'fixtures', 'landing.brief.json'), 'utf8'));

/** Collect every widget in a template tree. */
function widgets(node, out = []) {
  if (node.elType === 'widget') out.push(node);
  for (const child of node.elements ?? []) widgets(child, out);
  for (const child of node.content ?? []) widgets(child, out);
  return out;
}

test('resolves tokens to concrete values (no dangling references)', () => {
  const sources = loadSources(root);
  const tokens = resolveTheme(sources, 'light');
  const accent = tokens['color.accent.default'];
  assert.ok(accent, 'color.accent.default resolved');
  assert.match(accent.value, /^#[0-9a-f]{6}$/i, 'accent is a concrete hex');
  // typography composite is fully dereferenced
  const h1 = tokens['text.h1'].value;
  assert.match(h1.fontSize, /rem$/);
  assert.equal(typeof h1.fontWeight, 'number');
});

test('dark theme overrides semantic color roles', () => {
  const sources = loadSources(root);
  const light = resolveTheme(sources, 'light')['color.surface.page'].value;
  const dark = resolveTheme(sources, 'dark')['color.surface.page'].value;
  assert.notEqual(light, dark, 'surface.page differs between themes');
});

test('kit exposes named global colors and fonts', () => {
  const { kit } = build(root, brief);
  const names = [...kit.settings.system_colors, ...kit.settings.custom_colors].map((c) => c.title);
  assert.ok(names.includes('Accent'));
  assert.ok(names.includes('Text'));
  const accent = kit.settings.system_colors.find((c) => c.title === 'Accent');
  assert.match(accent.color, /^#[0-9a-f]{6}$/i);
  assert.ok(kit.settings.system_typography.length + kit.settings.custom_typography.length >= 8);
});

test('hero compiles to an h1 with the brief headline', () => {
  const { templates } = build(root, brief);
  const hero = templates.find((t) => t.name === 'hero');
  const ws = widgets(hero.template);
  const h1 = ws.find((w) => w.widgetType === 'heading' && w.settings.header_size === 'h1');
  assert.ok(h1, 'hero has an h1');
  assert.equal(h1.settings.title, 'Ship websites, not guesswork');
  const primary = ws.find((w) => w.widgetType === 'button' && w.settings.text === 'Get started');
  assert.ok(primary, 'primary CTA present');
});

test('feature-grid repeats once per feature', () => {
  const { templates } = build(root, brief);
  const fg = templates.find((t) => t.name === 'feature-grid');
  const headings = widgets(fg.template).filter((w) => w.widgetType === 'heading' && w.settings.header_size === 'h3');
  assert.equal(headings.length, 3, 'three feature titles');
  assert.deepEqual(headings.map((h) => h.settings.title), ['Fast', 'Accessible', 'Consistent']);
});

test('build is deterministic (byte-stable across runs)', () => {
  const a = build(root, brief);
  const b = build(root, brief);
  assert.equal(stableStringify(a.kit), stableStringify(b.kit));
  assert.equal(stableStringify(a.templates), stableStringify(b.templates));
});
