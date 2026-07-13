// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot, readJSON, listJSON } from './lib/paths.js';

const root = repoRoot();
const REF = /\{([a-zA-Z0-9._-]+)\}/g;

/** Flatten a DTCG token doc to the set of dotted paths that carry a $value. */
function collectDefined(doc, path, out) {
  if (doc && typeof doc === 'object') {
    if ('$value' in doc) { out.add(path.join('.')); return; }
    for (const [k, v] of Object.entries(doc)) if (!k.startsWith('$')) collectDefined(v, [...path, k], out);
  }
}
function refsIn(doc, out = []) {
  if (typeof doc === 'string') { let m; while ((m = REF.exec(doc))) out.push(m[1]); }
  else if (Array.isArray(doc)) doc.forEach((v) => refsIn(v, out));
  else if (doc && typeof doc === 'object') Object.values(doc).forEach((v) => refsIn(v, out));
  return out;
}

const tokenFiles = listJSON(`${root}/tokens`).filter((f) => !f.includes('/schema/') && !f.endsWith('manifest.json'));
const defined = new Set();
for (const f of tokenFiles) collectDefined(readJSON(f), [], defined);

const componentFiles = listJSON(`${root}/components`).filter((f) => !f.includes('/schema/'));
const recipeFiles = listJSON(`${root}/recipes`).filter((f) => !f.includes('/schema/'));
const componentNames = new Set(componentFiles.map((f) => readJSON(f).name));

test('every {reference} across tokens, foundation, components, recipes resolves', () => {
  const scan = [
    ...tokenFiles,
    ...listJSON(`${root}/foundation`),
    ...componentFiles,
    ...recipeFiles,
  ];
  const unresolved = [];
  for (const f of scan) {
    for (const r of refsIn(readJSON(f))) if (!defined.has(r)) unresolved.push(`${f.replace(root + '/', '')}: {${r}}`);
  }
  assert.deepEqual(unresolved, [], `unresolved references:\n  ${unresolved.join('\n  ')}`);
});

test('components bind only semantic color/type (no primitive color or font)', () => {
  const primColor = /^color\.(white|black|neutral|brand|success|warning|danger|info)\./;
  const violations = [];
  for (const f of componentFiles) {
    for (const r of refsIn(readJSON(f))) {
      if (primColor.test(r) || r.startsWith('font.')) violations.push(`${f.replace(root + '/', '')}: {${r}}`);
    }
  }
  assert.deepEqual(violations, [], `binding violations:\n  ${violations.join('\n  ')}`);
});

test('every recipe component reference resolves to a real component', () => {
  const bad = [];
  const baseName = (ref) => ref.split(':')[0].replace(/\?$/, '');
  const walk = (region, acc) => {
    for (const c of region.components ?? []) acc.push(c);
    for (const sub of Object.values(region.regions ?? {})) walk(sub, acc);
  };
  for (const f of recipeFiles) {
    const doc = readJSON(f);
    const refs = [];
    for (const region of Object.values(doc.layout?.regions ?? {})) walk(region, refs);
    for (const c of refs) if (!componentNames.has(baseName(c))) bad.push(`${doc.name}: ${c}`);
    for (const c of doc.components ?? []) if (!componentNames.has(c)) bad.push(`${doc.name}: components[] ${c}`);
  }
  assert.deepEqual(bad, [], `bad component references:\n  ${bad.join('\n  ')}`);
});

test('the token manifest matches the files on disk', () => {
  const manifest = readJSON(`${root}/tokens/manifest.json`);
  const missing = [];
  for (const list of Object.values(manifest.layers)) {
    for (const rel of list) {
      try { readJSON(`${root}/tokens/${rel}`); } catch { missing.push(rel); }
    }
  }
  assert.deepEqual(missing, []);
});
