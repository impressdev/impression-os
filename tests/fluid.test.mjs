// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { clampExpr, isFluid, fluidToClamp } from '../builder/src/fluid.js';
import { build, loadSources, resolveTheme } from '../builder/src/index.js';

const root = repoRoot();

test('clampExpr interpolates between the mobile and desktop viewports', () => {
  // 1.5rem (24px) at 375px → 2.25rem (36px) at 1280px
  const expr = clampExpr('1.5rem', '2.25rem');
  assert.match(expr, /^clamp\(1\.5rem, .+rem \+ .+vw, 2\.25rem\)$/);
  // slope = 12px / 905px * 100 ≈ 1.3260vw; intercept = 24 - slope*375/100 → /16 rem
  const [, mid] = expr.match(/, (.+rem \+ .+vw),/);
  const [a, b] = [parseFloat(mid), parseFloat(mid.split('+')[1])];
  const at = (vw) => a * 16 + (b * vw) / 100;
  assert.ok(Math.abs(at(375) - 24) < 0.1, `value at 375px ≈ 24 (got ${at(375)})`);
  assert.ok(Math.abs(at(1280) - 36) < 0.1, `value at 1280px ≈ 36 (got ${at(1280)})`);
});

test('equal min and max collapses to a static value', () => {
  assert.equal(clampExpr('2rem', '2rem'), '2rem');
});

test('semantic heading sizes resolve as fluid tokens', () => {
  const tokens = resolveTheme(loadSources(root), 'light');
  const h1 = tokens['text.h1'].value;
  assert.ok(isFluid(h1.fontSize), 'h1 fontSize is { min, max }');
  assert.equal(h1.fontSize.min, '1.875rem');
  assert.equal(h1.fontSize.max, '3rem');
  // body stays static for readability
  assert.equal(typeof tokens['text.body'].value.fontSize, 'string');
});

test('the kit emits fluid global fonts via the custom unit', () => {
  const { kit } = build(root, readJSON(`${root}/examples/northwind/plan.json`));
  const primary = kit.settings.system_typography.find((t) => t.title === 'Primary');
  assert.equal(primary.typography_font_size.unit, 'custom');
  assert.match(primary.typography_font_size.size, /^clamp\(1\.875rem, .+, 3rem\)$/);
  const body = kit.settings.system_typography.find((t) => t.title === 'Text');
  assert.equal(body.typography_font_size.unit, 'rem', 'body stays static');
});

test('section shells reference the kit CSS variables for rhythm', () => {
  const { templates } = build(root, readJSON(`${root}/examples/northwind/plan.json`));
  const hero = templates.find((t) => t.name === 'hero').template.content[0];
  assert.equal(hero.settings.padding.unit, 'custom');
  assert.equal(hero.settings.padding.top, 'var(--ios-section-lg)'); // spacious
  assert.equal(hero.settings.padding.left, 'var(--ios-page-inline)');
});

test('the kit carries every size as a CSS variable (custom_css)', () => {
  const { kit } = build(root, readJSON(`${root}/examples/northwind/plan.json`));
  const css = kit.settings.custom_css;
  assert.match(css, /--ios-section-lg: clamp\(5rem, .+, 8rem\);/); // fluid rhythm lives here
  assert.match(css, /--ios-radius-card: 0\.75rem;/);
  assert.match(css, /--ios-gap-md: 1rem;/);
  assert.match(css, /--ios-shadow-raised: 0 1px 3px/);
  assert.match(css, /\.ios-card \{ box-shadow: var\(--ios-shadow-raised\); \}/);
});

test('cards reference variables and bind colors to Global Colors', () => {
  const { templates } = build(root, readJSON(`${root}/examples/northwind/plan.json`));
  const fg = templates.find((t) => t.name === 'feature-grid').template.content[0];
  const findCard = (n) => n.settings?.css_classes === 'ios-card' ? n : (n.elements ?? []).map(findCard).find(Boolean);
  const card = findCard(fg);
  assert.ok(card, 'a card container exists');
  assert.equal(card.settings.border_radius.top, 'var(--ios-radius-card)');
  assert.equal(card.settings.padding.top, 'var(--ios-inset-card)');
  assert.match(card.settings.__globals__.border_color, /^globals\/colors\?id=/);
  assert.ok(!('border_color' in card.settings), 'no baked-in hex border color');
});

test('fluid emission is deterministic', () => {
  const a = fluidToClamp({ min: '1rem', max: '2rem' });
  const b = fluidToClamp({ min: '1rem', max: '2rem' });
  assert.equal(a, b);
});
