// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateBrandTheme } from '../lib/theme.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const colorDoc = JSON.parse(readFileSync(`${root}/tokens/primitives/color.json`, 'utf8'));

for (const accent of ['teal', 'violet', 'info', 'brand', 'success']) {
  for (const base of ['light', 'dark']) {
    test(`generated ${accent}/${base} theme meets AA by construction`, () => {
      const { theme, choices } = generateBrandTheme(colorDoc, { name: `t-${accent}-${base}`, accent, base });
      assert.equal(theme.$extends, base);
      assert.ok(Number(choices.accentContrast) >= 4.5, `accent white-label ${choices.accentContrast}:1`);
      assert.ok(Number(choices.linkContrast) >= 4.5, `link ${choices.linkContrast}:1`);
      assert.match(theme.color.accent.default.$value, /^\{color\.[a-z]+\.\d+\}$/);
    });
  }
}

test('generateBrandTheme fails loudly on an unknown ramp', () => {
  assert.throws(() => generateBrandTheme(colorDoc, { name: 'x', accent: 'chartreuse', base: 'light' }), /Unknown color ramp/);
});

test('generateBrandTheme rejects an invalid base', () => {
  assert.throws(() => generateBrandTheme(colorDoc, { name: 'x', accent: 'teal', base: 'sepia' }), /light.*dark/);
});
