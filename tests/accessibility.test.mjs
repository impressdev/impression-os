// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { contrastRatio } from '../tools/lib/contrast.js';
import { loadSources, resolveTheme } from '../builder/src/index.js';

const root = repoRoot();
const sources = loadSources(root);
const contracts = readJSON(`${root}/foundation/accessibility/contracts.json`);
const NORMAL = contracts.contrast.text.normal; // 4.5
const NONTEXT = contracts.contrast.nonText;    // 3.0
const THEMES = sources.manifest.themes.available;

/** Text-on-surface pairings that must meet AA (normal text). */
const TEXT_PAIRINGS = [
  ['color.text.default', 'color.surface.page'],
  ['color.text.muted', 'color.surface.page'],
  ['color.text.subtle', 'color.surface.page'],
  ['color.text.default', 'color.surface.raised'],
  ['color.text.onAccent', 'color.accent.default'],
  ['color.feedback.success.text', 'color.feedback.success.surface'],
  ['color.feedback.warning.text', 'color.feedback.warning.surface'],
  ['color.feedback.danger.text', 'color.feedback.danger.surface'],
  ['color.feedback.info.text', 'color.feedback.info.surface'],
];

/** Non-text pairings that must meet the 3:1 rule. */
const NONTEXT_PAIRINGS = [
  ['color.border.focus', 'color.surface.page'],
];

for (const theme of THEMES) {
  test(`${theme}: text roles meet WCAG AA (${NORMAL}:1)`, () => {
    const tokens = resolveTheme(sources, theme);
    const fails = [];
    for (const [fg, bg] of TEXT_PAIRINGS) {
      const ratio = contrastRatio(tokens[fg].value, tokens[bg].value);
      if (ratio < NORMAL) fails.push(`${fg} on ${bg}: ${ratio.toFixed(2)}:1 (< ${NORMAL})`);
    }
    assert.deepEqual(fails, [], `contrast failures:\n  ${fails.join('\n  ')}`);
  });

  test(`${theme}: non-text roles meet ${NONTEXT}:1`, () => {
    const tokens = resolveTheme(sources, theme);
    const fails = [];
    for (const [fg, bg] of NONTEXT_PAIRINGS) {
      const ratio = contrastRatio(tokens[fg].value, tokens[bg].value);
      if (ratio < NONTEXT) fails.push(`${fg} on ${bg}: ${ratio.toFixed(2)}:1 (< ${NONTEXT})`);
    }
    assert.deepEqual(fails, [], `contrast failures:\n  ${fails.join('\n  ')}`);
  });
}
