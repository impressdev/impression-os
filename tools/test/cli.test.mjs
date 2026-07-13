// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { buildCmd, validateCmd, lintCmd, listCmd, newCmd } from '../lib/commands.js';
import { validate } from '../lib/jsonschema.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tmp = resolve(dirname(fileURLToPath(import.meta.url)), '.tmp');

test.after(() => { try { rmSync(tmp, { recursive: true, force: true }); } catch {} });

test('validate reports no problems for the repo', () => {
  assert.deepEqual(validateCmd(root), []);
});

test('lint passes the reference plan (no errors)', () => {
  const v = lintCmd(root, `${root}/prompts/planning/example.plan.json`);
  assert.deepEqual(v.filter((x) => x.severity === 'error'), []);
});

test('list surfaces recipes, components, and themes', () => {
  assert.ok(listCmd(root, 'recipes').some((r) => r.name === 'hero'));
  assert.ok(listCmd(root, 'components').some((c) => c.name === 'button'));
  assert.ok(listCmd(root, 'themes').some((t) => t.name === 'light'));
});

test('build produces a kit + templates on disk', () => {
  const out = `${tmp}/dist`;
  const r = buildCmd(root, `${root}/prompts/planning/example.plan.json`, out, undefined);
  assert.equal(r.sections.length, 8);
  assert.ok(existsSync(`${out}/kit.json`));
  assert.ok(existsSync(`${out}/templates/hero.json`));
});

test('build honors a theme override', () => {
  const r = buildCmd(root, `${root}/prompts/planning/example.plan.json`, `${tmp}/dark`, 'dark');
  assert.equal(r.theme, 'dark');
});

test('new scaffolds a brief that validates against the schema', () => {
  const path = `${tmp}/acme.brief.json`;
  newCmd('Acme', path);
  const brief = JSON.parse(readFileSync(path, 'utf8'));
  const schema = JSON.parse(readFileSync(`${root}/prompts/brief/brief.schema.json`, 'utf8'));
  assert.deepEqual(validate(schema, brief), []);
});
