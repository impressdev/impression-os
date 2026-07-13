// @ts-check
import { validate } from './jsonschema.js';
import { readJSON, listJSON, rel } from './fs.js';

const REF = /\{([a-zA-Z0-9._-]+)\}/g;

/**
 * Validate every data artifact in the repo: schema conformance plus reference
 * integrity. Returns a flat list of human-readable errors (empty when valid).
 * This is the engine behind `impression validate`, and mirrors the guarantees
 * the tests/ harness asserts.
 * @param {string} root @returns {string[]}
 */
export function validateData(root) {
  /** @type {string[]} */
  const errors = [];
  const schema = (p) => readJSON(`${root}/${p}`);

  // 1. schema conformance
  const groups = [
    { schema: 'tokens/schema/token.schema.json', files: tokenFiles(root) },
    { schema: 'components/schema/component.schema.json', files: dataFiles(root, 'components') },
    { schema: 'recipes/schema/recipe.schema.json', files: dataFiles(root, 'recipes') },
    { schema: 'prompts/brief/brief.schema.json', files: [`${root}/prompts/brief/example.brief.json`] },
    { schema: 'prompts/planning/build-plan.schema.json', files: [`${root}/prompts/planning/example.plan.json`] },
  ];
  for (const g of groups) {
    const s = schema(g.schema);
    for (const f of g.files) {
      for (const e of validate(s, readJSON(f))) errors.push(`schema  ${rel(root, f)}: ${e}`);
    }
  }

  // 2. reference integrity
  const defined = definedTokens(root);
  const componentNames = new Set(dataFiles(root, 'components').map((f) => readJSON(f).name));
  const scan = [
    ...tokenFiles(root),
    ...listJSON(`${root}/foundation`),
    ...dataFiles(root, 'components'),
    ...dataFiles(root, 'recipes'),
  ];
  const primColor = /^color\.(white|black|neutral|brand|success|warning|danger|info)\./;
  for (const f of scan) {
    const doc = readJSON(f);
    for (const r of refsIn(doc)) {
      if (!defined.has(r)) errors.push(`ref     ${rel(root, f)}: unresolved {${r}}`);
      if (f.includes('/components/') && (primColor.test(r) || r.startsWith('font.'))) {
        errors.push(`binding ${rel(root, f)}: component uses primitive {${r}}`);
      }
    }
  }

  // 3. recipe component references resolve to real components
  for (const f of dataFiles(root, 'recipes')) {
    const doc = readJSON(f);
    for (const c of recipeComponentRefs(doc)) {
      const base = c.split(':')[0].replace(/\?$/, '');
      if (!componentNames.has(base)) errors.push(`recipe  ${doc.name}: unknown component "${c}"`);
    }
  }

  return errors;
}

function tokenFiles(root) {
  return listJSON(`${root}/tokens`).filter((f) => !f.includes('/schema/') && !f.endsWith('manifest.json'));
}
function dataFiles(root, dir) {
  return listJSON(`${root}/${dir}`).filter((f) => !f.includes('/schema/'));
}
function definedTokens(root) {
  const out = new Set();
  const walk = (node, path) => {
    if (node && typeof node === 'object') {
      if ('$value' in node) { out.add(path.join('.')); return; }
      for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v, [...path, k]);
    }
  };
  for (const f of tokenFiles(root)) walk(readJSON(f), []);
  return out;
}
function refsIn(doc, out = []) {
  if (typeof doc === 'string') { let m; while ((m = REF.exec(doc))) out.push(m[1]); }
  else if (Array.isArray(doc)) doc.forEach((v) => refsIn(v, out));
  else if (doc && typeof doc === 'object') Object.values(doc).forEach((v) => refsIn(v, out));
  return out;
}
function recipeComponentRefs(doc) {
  const out = [];
  const walk = (region) => {
    for (const c of region.components ?? []) out.push(c);
    for (const sub of Object.values(region.regions ?? {})) walk(sub);
  };
  for (const region of Object.values(doc.layout?.regions ?? {})) walk(region);
  return out;
}
