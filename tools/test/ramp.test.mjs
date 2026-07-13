// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { synthesizeRamp, hexToHsl, hslToHex } from '../lib/ramp.js';
import { generateBrandTheme } from '../lib/theme.js';

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

test('synthesizeRamp produces 11 valid, monotonically darkening steps', () => {
  for (const seed of ['#ff5a1f', '#7c3aed', '#0d9488', '#e11d48']) {
    const ramp = synthesizeRamp(seed);
    assert.deepEqual(Object.keys(ramp), STEPS);
    let prevL = 2;
    for (const step of STEPS) {
      assert.match(ramp[step], /^#[0-9a-f]{6}$/, `${seed} ${step}`);
      const { l } = hexToHsl(ramp[step]);
      assert.ok(l < prevL, `${seed}: lightness should decrease at step ${step}`);
      prevL = l;
    }
  }
});

test('a synthesized ramp still meets AA through the theme generator', () => {
  for (const seed of ['#ff5a1f', '#7c3aed', '#2563eb', '#db2777']) {
    const ramp = synthesizeRamp(seed);
    const colorLike = { color: { brandx: Object.fromEntries(Object.entries(ramp).map(([k, v]) => [k, { $value: v }])) } };
    const { choices } = generateBrandTheme(colorLike, { name: 'brandx', accent: 'brandx', base: 'light' });
    assert.ok(Number(choices.accentContrast) >= 4.5, `${seed} accent ${choices.accentContrast}:1`);
    assert.ok(Number(choices.linkContrast) >= 4.5, `${seed} link ${choices.linkContrast}:1`);
  }
});

test('hex ↔ hsl round-trips within tolerance', () => {
  for (const hex of ['#ff5a1f', '#123456', '#00aa88']) {
    const back = hslToHex(hexToHsl(hex));
    const d = (a, b, i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16));
    assert.ok(d(hex, back, 1) <= 2 && d(hex, back, 3) <= 2 && d(hex, back, 5) <= 2, `${hex} → ${back}`);
  }
});

test('hexToHsl rejects an invalid color', () => {
  assert.throws(() => hexToHsl('not-a-color'), /Invalid hex/);
});
