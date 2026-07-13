// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate } from './lib/jsonschema.js';
import { repoRoot, readJSON, listJSON } from './lib/paths.js';

const root = repoRoot();
const schema = (rel) => readJSON(`${root}/${rel}`);

/** Assert a set of files validate against a schema. */
function validateAll(files, schemaObj, label) {
  const failures = [];
  for (const f of files) {
    const errs = validate(schemaObj, readJSON(f));
    if (errs.length) failures.push(`${f.replace(root + '/', '')}:\n    ${errs.join('\n    ')}`);
  }
  assert.equal(failures.length, 0, `${label} schema failures:\n  ${failures.join('\n  ')}`);
}

test('tokens validate against token.schema.json', () => {
  const s = schema('tokens/schema/token.schema.json');
  const files = listJSON(`${root}/tokens`).filter((f) => !f.includes('/schema/') && !f.endsWith('manifest.json'));
  validateAll(files, s, 'token');
});

test('components validate against component.schema.json', () => {
  const s = schema('components/schema/component.schema.json');
  const files = listJSON(`${root}/components`).filter((f) => !f.includes('/schema/'));
  validateAll(files, s, 'component');
});

test('recipes validate against recipe.schema.json', () => {
  const s = schema('recipes/schema/recipe.schema.json');
  const files = listJSON(`${root}/recipes`).filter((f) => !f.includes('/schema/'));
  validateAll(files, s, 'recipe');
});

test('example brief validates against brief.schema.json', () => {
  const s = schema('prompts/brief/brief.schema.json');
  const errs = validate(s, readJSON(`${root}/prompts/brief/example.brief.json`));
  assert.deepEqual(errs, []);
});

test('example plan validates against build-plan.schema.json', () => {
  const s = schema('prompts/planning/build-plan.schema.json');
  const errs = validate(s, readJSON(`${root}/prompts/planning/example.plan.json`));
  assert.deepEqual(errs, []);
});

test('the validator rejects a malformed token (sanity check)', () => {
  const s = schema('tokens/schema/token.schema.json');
  // a "group" that also carries $value is invalid
  const bad = { color: { $type: 'color', $value: '#fff', bad: { $value: 1 } } };
  assert.ok(validate(s, bad).length > 0, 'expected validation errors');
});
