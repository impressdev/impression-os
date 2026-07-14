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
export { renderPage } from './html.js';

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
export function build(root, brief, opts = {}) {
  const sources = loadSources(root);
  const theme = brief.theme ?? sources.manifest.themes.default ?? 'light';

  const tokens = resolveTheme(sources, theme, opts.extra);
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
 * @property {{path:string, slug:string, title:string}[]} sitemap
 * @property {any} manifest
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

  const siteName = sitePlan.meta?.name ?? 'Site';
  const accent = tokens['color.accent.default']?.value;
  const surface = tokens['color.surface.page']?.value;

  const pages = (sitePlan.pages ?? []).map((p) => {
    const templates = (p.sections ?? []).map((s) => {
      const recipe = sources.recipes[s.recipe];
      if (!recipe) throw new Error(`Unknown recipe: "${s.recipe}"`);
      return { name: s.recipe, template: compileRecipe(recipe, s.content ?? {}, tokens) };
    });
    const meta = buildPage({ meta: { name: pageTitle(siteName, p) }, seo: p.seo, sections: p.sections });
    const page = {
      ...meta,
      og: clean({ ...meta.og, type: 'website', url: p.path }),
      canonical: p.path,
      robots: p.noindex ? 'noindex, nofollow' : 'index, follow',
      themeColor: accent,
      structuredData: structuredData(sitePlan, p, meta),
    };
    return { path: p.path, slug: pageSlug(p.path), type: p.type, templates, page };
  });

  const sitemap = pages.map((p) => ({ path: p.path, slug: p.slug, title: p.page.title }));
  const manifest = webManifest(siteName, sitePlan.organization?.logo, accent, surface);
  return { theme, kit, pages, sitemap, manifest };
}

/** A W3C web app manifest with brand colors from the resolved theme. */
function webManifest(name, logo, themeColor, background) {
  return clean({
    name,
    short_name: name,
    start_url: '/',
    display: 'standalone',
    theme_color: themeColor,
    background_color: background,
    icons: logo ? [{ src: logo, type: iconType(logo), sizes: 'any', purpose: 'any' }] : undefined,
  });
}

function iconType(src) {
  return /\.svg($|\?)/i.test(src) ? 'image/svg+xml' : 'image/png';
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
  writeFileSync(join(outDir, 'sitemap.json'), JSON.stringify(result.sitemap, null, 2) + '\n');
  writeFileSync(join(outDir, 'sitemap.xml'), sitemapXml(result.sitemap));
  writeFileSync(join(outDir, 'robots.txt'), robotsTxt(result));
  writeFileSync(join(outDir, 'site.webmanifest'), JSON.stringify(result.manifest, null, 2) + '\n');
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

/**
 * A distinct, SEO-friendly title per page. The home page leads with the site name
 * and its hero headline; inner pages lead with the page name, then the site.
 */
function pageTitle(siteName, page) {
  const hero = (page.sections ?? []).find((s) => s.recipe === 'hero')?.content ?? {};
  if (page.path === '/' || page.path == null) {
    return hero.heading ? `${siteName} — ${hero.heading}` : siteName;
  }
  const label = titleCase(page.type || pageSlug(page.path));
  return `${label} — ${siteName}`;
}

function titleCase(s) {
  return String(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Turn a site path into a directory slug ("/" → "index", "/about" → "about"). */
function pageSlug(path) {
  return String(path).replace(/^\/+|\/+$/g, '').replace(/\//g, '-') || 'index';
}

/**
 * A sitemap.xml with path-relative <loc> entries. Consumers prepend their site's
 * base URL (WordPress/Elementor or an SEO plugin) to make the URLs absolute.
 */
function sitemapXml(sitemap) {
  const urls = sitemap.map((p) => `  <url><loc>${p.path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * schema.org JSON-LD for a page: a WebPage on every page, plus an Organization on
 * the home page when the site plan supplies organization details. Consumers inject
 * these as <script type="application/ld+json"> in the page head.
 */
function structuredData(sitePlan, page, meta) {
  const CTX = 'https://schema.org';
  const out = [];
  const org = sitePlan.organization;
  if (org && (page.path === '/' || page.path == null)) {
    out.push(clean({
      '@context': CTX, '@type': 'Organization',
      name: org.name, description: org.description, logo: org.logo, url: org.url,
    }));
  }
  out.push(clean({
    '@context': CTX, '@type': 'WebPage',
    name: meta.title, description: meta.description, url: page.path,
  }));
  const crumbs = breadcrumbList(CTX, page.path);
  if (crumbs) out.push(crumbs);
  return out;
}

/** A schema.org BreadcrumbList derived from a page's path segments (Home → …). */
function breadcrumbList(CTX, path) {
  if (!path || path === '/') return null;
  const segments = String(path).split('/').filter(Boolean);
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: '/' }];
  let acc = '';
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    items.push({ '@type': 'ListItem', position: i + 2, name: titleCase(seg), item: acc });
  });
  return { '@context': CTX, '@type': 'BreadcrumbList', itemListElement: items };
}

function clean(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ''));
}

/** A robots.txt that allows crawling, disallows any noindex page, and points at the sitemap. */
function robotsTxt(result) {
  const lines = ['User-agent: *', 'Allow: /'];
  for (const p of result.pages) {
    if (String(p.page.robots).startsWith('noindex')) lines.push(`Disallow: ${p.path}`);
  }
  lines.push('', 'Sitemap: /sitemap.xml', '');
  return lines.join('\n');
}
