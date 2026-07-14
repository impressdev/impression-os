// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON } from './lib/paths.js';
import { lintPlan } from '../tools/lib/guardrails.js';

const root = repoRoot();

test('the reference example plan passes every guardrail (no errors)', () => {
  const plan = readJSON(`${root}/prompts/planning/example.plan.json`);
  const errors = lintPlan(root, plan).filter((v) => v.severity === 'error');
  assert.deepEqual(errors, [], `unexpected guardrail errors:\n  ${errors.map((e) => `${e.rule}: ${e.message}`).join('\n  ')}`);
});

test('an optional announcement-bar may precede the header', () => {
  const plan = readJSON(`${root}/prompts/planning/example.plan.json`);
  const withBar = { ...plan, sections: [{ recipe: 'announcement-bar', content: { message: 'Hi' } }, ...plan.sections] };
  const bookend = lintPlan(root, withBar).filter((v) => v.rule === 'header-footer-bookends');
  assert.deepEqual(bookend, [], 'announcement-bar before header should not trip the bookend rule');
});

test('a malformed plan is caught by the guardrails', () => {
  const plan = readJSON(`${root}/tests/fixtures/bad.plan.json`);
  const rules = new Set(lintPlan(root, plan).map((v) => v.rule));
  for (const expected of ['theme-exists', 'recipe-exists', 'header-footer-bookends', 'no-design-values-in-content', 'meaningful-cta-text']) {
    assert.ok(rules.has(expected), `expected guardrail "${expected}" to fire`);
  }
});
