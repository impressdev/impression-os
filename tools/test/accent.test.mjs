// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { resolveRamp, resolveTheme } from '../lib/accent.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { lexicon } = JSON.parse(readFileSync(`${root}/prompts/planning/accent-lexicon.json`, 'utf8'));

const ctx = {
  available: ['light', 'dark', 'brand.teal', 'brand.aurora'],
  defaultTheme: 'light',
  themeRamps: { light: 'brand', dark: 'brand', 'brand.teal': 'teal', 'brand.aurora': 'violet' },
  lexicon,
};

test('resolveRamp maps accent words to ramps (word-boundary, longest-first)', () => {
  assert.equal(resolveRamp('a trustworthy indigo', lexicon), 'brand');
  assert.equal(resolveRamp('calm teal brand', lexicon), 'teal');
  assert.equal(resolveRamp('deep violet', lexicon), 'violet');
  assert.equal(resolveRamp('warm orange energy', lexicon), 'warning');
  assert.equal(resolveRamp('no color word here', lexicon), null);
  assert.equal(resolveRamp(undefined, lexicon), null);
});

test('an explicit, available brand.theme wins', () => {
  const r = resolveTheme({ brand: { theme: 'dark', accent: 'teal' } }, ctx);
  assert.equal(r.theme, 'dark');
  assert.match(r.via, /brief\.brand\.theme/);
});

test('accent selects a matching brand theme by its ramp', () => {
  assert.equal(resolveTheme({ brand: { accent: 'calm teal' } }, ctx).theme, 'brand.teal');
  assert.equal(resolveTheme({ brand: { accent: 'deep violet' } }, ctx).theme, 'brand.aurora');
});

test('an accent with no matching theme falls back to default and hints', () => {
  const r = resolveTheme({ brand: { accent: 'warm orange' } }, ctx);
  assert.equal(r.theme, 'light');
  assert.equal(r.ramp, 'warning');
  assert.match(r.hint, /impression theme warning/);
});

test('no theme and no accent → default', () => {
  assert.equal(resolveTheme({ brand: {} }, ctx).theme, 'light');
});
