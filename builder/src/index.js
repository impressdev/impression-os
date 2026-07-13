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

/**
 * @typedef {Object} SiteBuild
 * @property {string} theme
 * @property {any} kit
 * @property {{path:string, slug:string, type:string|undefined, templates:{name:string,template:any}[], page:any}[]} pages
 */

/**
 * Compile a multi-page site plan: one shared kit, one set of templates + page
 * metadata per page. Deterministic like build().
 * @param {string} root @param {any} sitePlan @returns {SiteBuild}
 */
export function buildSite(root, sitePlan) {
  const sources = loadSources(root);
  const theme = sitePlan.theme ?? sources.manifest.themes.default ?? 'light';
  const tokens = resolveTheme(sources, theme);
  const kit = buildKit(tokens, sources.grid, theme);

  const pages = (sitePlan.pages ?? []).map((p) => {
    const templates = (p.sections ?? []).map((s) => {
      const recipe = sources.recipes[s.recipe];
      if (!recipe) throw new Error(`Unknown recipe: "${s.recipe}"`);
      return { name: s.recipe, template: compileRecipe(recipe, s.content ?? {}, tokens) };
    });
    const page = buildPage({ meta: { name: `${sitePlan.meta?.name ?? 'Site'} — ${p.path}` }, seo: p.seo, sections: p.sections });
    return { path: p.path, slug: pageSlug(p.path), type: p.type, templates, page };
  });

  return { theme, kit, pages };
}

/**
 * Write a site build: kit.json, a site.json index, and pages/<slug>/{templates,page.json}.
 * @param {SiteBuild} result @param {string} outDir
 */
export function writeSite(result, outDir) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'kit.json'), JSON.stringify(result.kit, null, 2) + '\n');
  const index = { theme: result.theme, pages: result.pages.map((p) => ({ path: p.path, slug: p.slug, type: p.type, templates: p.templates.map((t) => t.name) })) };
  writeFileSync(join(outDir, 'site.json'), JSON.stringify(index, null, 2) + '\n');
  for (const p of result.pages) {
    const dir = join(outDir, 'pages', p.slug);
    mkdirSync(join(dir, 'templates'), { recursive: true });
    writeFileSync(join(dir, 'page.json'), JSON.stringify(p.page, null, 2) + '\n');
    for (const t of p.templates) {
      writeFileSync(join(dir, 'templates', `${t.name}.json`), JSON.stringify(t.template, null, 2) + '\n');
    }
  }
  return outDir;
}

/** Turn a site path into a directory slug ("/" → "index", "/about" → "about"). */
function pageSlug(path) {
  return String(path).replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'index';
}
