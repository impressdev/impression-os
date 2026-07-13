// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { planCmd } from '../lib/commands.js';
import { lintPlan } from '../lib/guardrails.js';
import { validate } from '../lib/jsonschema.js';
import { build } from '../../builder/src/index.js';
import { stableStringify } from '../../builder/src/util.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const planSchema = JSON.parse(readFileSync(`${root}/prompts/planning/build-plan.schema.json`, 'utf8'));

function planFor(brief) {
  return planCmd(root, `${root}/${brief}`, {}).plan;
}

test('a brief expands to a schema-valid, guardrail-passing plan', () => {
  const plan = planFor('prompts/brief/example.brief.json');
  assert.deepEqual(validate(planSchema, plan), []);
  assert.deepEqual(lintPlan(root, plan).filter((v) => v.severity === 'error'), []);
});

test('the expanded plan honors bookends and a single hero', () => {
  const plan = planFor('prompts/brief/example.brief.json');
  const recs = plan.sections.map((s) => s.recipe);
  assert.equal(recs[0], 'header');
  assert.equal(recs[recs.length - 1], 'footer');
  assert.equal(recs.filter((r) => r === 'hero').length, 1);
  assert.deepEqual(recs, ['header', 'hero', 'feature-grid', 'testimonial', 'pricing', 'faq', 'cta', 'footer']);
});

test('the expanded plan resolves the brief theme and compiles', () => {
  const plan = planFor('examples/lumen/brief/brief.json');
  assert.equal(plan.theme, 'brand.teal');            // from brief.brand.theme
  assert.equal(plan.sections[0].recipe, 'header');
  assert.equal(plan.sections.at(-1).recipe, 'footer');
  const { templates } = build(root, plan);           // builds without throwing
  assert.ok(templates.length >= 3);
});

test('sections without required brief content are dropped, not invented', () => {
  // The lumen brief has no pricing tiers, testimonials, or faqs.
  const plan = planFor('examples/lumen/brief/brief.json');
  const recs = plan.sections.map((s) => s.recipe);
  assert.ok(!recs.includes('pricing'));
  assert.ok(!recs.includes('faq'));
});

test('planning is deterministic', () => {
  assert.equal(stableStringify(planFor('prompts/brief/example.brief.json')), stableStringify(planFor('prompts/brief/example.brief.json')));
});
