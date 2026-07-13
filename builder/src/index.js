// @ts-check
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSources } from './load.js';
import { resolveTheme } from './resolve.js';
import { buildKit } from './kit.js';
import { compileRecipe } from './template.js';
import { buildPage } from './page.js';

export { loadSources } from './load.js';
export { resolveTheme } from './resolve.js';

/**
 * @typedef {Object} Brief
 * @property {string} [theme]                       Theme name (default "light").
 * @property {{recipe:string, content:object}[]} sections  Sections to compile.
 */

/**
 * @typedef {Object} Build
 * @property {string} theme
 * @property {any} kit
 * @property {any} page
 * @property {Record<string, import('./resolve.js').Resolved>} tokens
 * @property {{name:string, template:any}[]} templates
 */

/**
 * Compile a brief into an Elementor Pro kit plus one template per section.
 * Deterministic: the same root + brief always produce identical output.
 *
 * @param {string} root  repository root
 * @param {Brief} brief
 * @returns {Build}
 */
export function build(root, brief) {
  const sources = loadSources(root);
  const theme = brief.theme ?? sources.manifest.themes.default ?? 'light';

  const tokens = resolveTheme(sources, theme);
  const kit = buildKit(tokens, sources.grid, theme);
  const page = buildPage(brief);

  const templates = (brief.sections ?? []).map((s) => {
    const recipe = sources.recipes[s.recipe];
    if (!recipe) throw new Error(`Unknown recipe: "${s.recipe}"`);
    return { name: s.recipe, template: compileRecipe(recipe, s.content ?? {}, tokens) };
  });

  return { theme, kit, page, tokens, templates };
}

/**
 * Write a build to disk: kit.json plus templates/<name>.json.
 * @param {Build} result @param {string} outDir
 */
export function writeBuild(result, outDir) {
  mkdirSync(join(outDir, 'templates'), { recursive: true });
  writeFileSync(join(outDir, 'kit.json'), JSON.stringify(result.kit, null, 2) + '\n');
  writeFileSync(join(outDir, 'page.json'), JSON.stringify(result.page, null, 2) + '\n');
  for (const t of result.templates) {
    writeFileSync(join(outDir, 'templates', `${t.name}.json`), JSON.stringify(t.template, null, 2) + '\n');
  }
  return outDir;
}
