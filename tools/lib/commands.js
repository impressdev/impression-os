// @ts-check
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { build, writeBuild, buildSite, writeSite, renderPage } from '../../builder/src/index.js';
import { validateData } from './validate.js';
import { lintPlan } from './guardrails.js';
import { generateBrandTheme } from './theme.js';
import { synthesizeRamp } from './ramp.js';
import { resolveTheme } from './accent.js';
import { planFromBrief, planSiteFromBrief } from './plan.js';
import { checkInternalLinks } from './links.js';
import { startStudio } from './studio.js';
import { readJSON, listJSON } from './fs.js';
import { existsSync } from 'node:fs';

/**
 * Compile a build plan into a kit + templates.
 * @returns {{theme:string, sections:string[], colors:number, fonts:number, out:string}}
 */
export function buildCmd(root, planPath, outDir, theme) {
  const plan = readJSON(planPath);
  if (theme) plan.theme = theme;
  const result = build(root, plan);
  const out = writeBuild(result, outDir);
  return {
    theme: result.theme,
    sections: result.templates.map((t) => t.name),
    colors: result.kit.settings.system_colors.length + result.kit.settings.custom_colors.length,
    fonts: result.kit.settings.system_typography.length + result.kit.settings.custom_typography.length,
    out,
  };
}

/**
 * Compile a multi-page site plan into one kit + per-page templates.
 * @returns {{theme:string, pages:{path:string,slug:string,templates:number}[], out:string}}
 */
export function buildSiteCmd(root, sitePlanPath, outDir) {
  const sitePlan = readJSON(sitePlanPath);
  const site = buildSite(root, sitePlan);
  const out = writeSite(site, outDir);
  return {
    theme: site.theme,
    pages: site.pages.map((p) => ({ path: p.path, slug: p.slug, templates: p.templates.length })),
    warnings: checkInternalLinks(sitePlan),
    out,
  };
}

/**
 * Render a build plan to a self-contained HTML preview (no WordPress needed).
 * @returns {{out:string, sections:number}}
 */
export function previewCmd(root, planPath, outDir) {
  const { kit, templates, page } = build(root, readJSON(planPath));
  mkdirSync(outDir, { recursive: true });
  const html = renderPage(kit, templates, page ?? {});
  writeFileSync(join(outDir, 'index.html'), html);
  return { out: join(outDir, 'index.html'), sections: templates.length };
}

/**
 * Render a multi-page site plan to a set of linked HTML preview pages. Internal
 * links that point at a generated page are rewritten to the preview file, so
 * navigation works when you open it locally.
 * @returns {{out:string, pages:string[]}}
 */
export function previewSiteCmd(root, sitePlanPath, outDir) {
  const site = buildSite(root, readJSON(sitePlanPath));
  mkdirSync(outDir, { recursive: true });
  const fileFor = (p) => `${p.slug}.html`;
  const map = Object.fromEntries(site.pages.map((p) => [p.path, fileFor(p)]));

  for (const p of site.pages) {
    let html = renderPage(site.kit, p.templates, p.page);
    for (const [path, file] of Object.entries(map)) {
      html = html.split(`href="${path}"`).join(`href="${file}"`);
    }
    writeFileSync(join(outDir, fileFor(p)), html);
  }
  return { out: outDir, pages: site.pages.map(fileFor) };
}

/** Start the local Studio web app. Long-running; returns the handle. */
export function studioCmd(root, port) {
  return startStudio(root, port);
}

/** Validate every data artifact (schemas + references). @returns {string[]} errors */
export function validateCmd(root) {
  return validateData(root);
}

/** Run the machine-checkable guardrails against a build plan. */
export function lintCmd(root, planPath) {
  return lintPlan(root, readJSON(planPath));
}

/**
 * List a catalog. @param {'recipes'|'components'|'themes'} what
 * @returns {{name:string, detail:string}[]}
 */
export function listCmd(root, what) {
  if (what === 'themes') {
    return readJSON(`${root}/tokens/manifest.json`).themes.available.map((t) => ({ name: t, detail: 'theme' }));
  }
  const dir = what === 'components' ? 'components' : 'recipes';
  return listJSON(`${root}/${dir}`)
    .filter((f) => !f.includes('/schema/'))
    .map((f) => readJSON(f))
    .map((d) => ({ name: d.name, detail: `${d.category} — ${d.description.split('. ')[0]}` }));
}

/**
 * Generate a brand theme (a delta over light/dark) whose accent + link steps are
 * chosen by contrast to meet WCAG AA, write it to tokens/themes/, and register it
 * in the token manifest.
 * @returns {{file:string, name:string, choices:Record<string,any>}}
 */
export function themeCmd(root, name, { accent, base = 'light', hex }) {
  let colorDoc;
  if (hex) {
    // Synthesize a ramp from the brand hex, store it as a primitive (in its own
    // file so color.json stays hand-authored), and theme against it.
    accent = slug(name);
    const ramp = synthesizeRamp(hex);
    addSynthesizedRamp(root, accent, hex, ramp);
    colorDoc = { color: { [accent]: toDTCG(ramp) } };
  } else {
    if (!accent) throw new Error('theme needs --accent <ramp> or --hex <#color>');
    colorDoc = readJSON(`${root}/tokens/primitives/color.json`);
  }
  const { theme, choices } = generateBrandTheme(colorDoc, { name, accent, base });

  const fileName = name.includes('.') ? name : `brand.${name}`;
  const rel = `themes/${fileName}.json`;
  writeFileSync(`${root}/tokens/${rel}`, JSON.stringify(theme, null, 2) + '\n');

  // Register in the manifest (sources list + available themes), idempotently.
  const manifestPath = `${root}/tokens/manifest.json`;
  const manifest = readJSON(manifestPath);
  if (!manifest.layers.themes.includes(rel)) manifest.layers.themes.push(rel);
  if (!manifest.themes.available.includes(fileName)) manifest.themes.available.push(fileName);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  return { file: `tokens/${rel}`, name: fileName, choices };
}

const SYNTH_RAMPS = 'primitives/brand-ramps.json';

/** Store a synthesized ramp in the dedicated brand-ramps primitive file + manifest. */
function addSynthesizedRamp(root, name, seedHex, ramp) {
  const path = `${root}/tokens/${SYNTH_RAMPS}`;
  const doc = existsSync(path)
    ? readJSON(path)
    : { $description: 'Brand ramps synthesized from a seed hex by `impression theme --hex`. Generated — do not hand-edit.', color: { $type: 'color' } };
  doc.color[name] = { $description: `Synthesized from ${seedHex}.`, ...toDTCG(ramp) };
  writeFileSync(path, JSON.stringify(doc, null, 2) + '\n');

  const manifestPath = `${root}/tokens/manifest.json`;
  const manifest = readJSON(manifestPath);
  if (!manifest.layers.primitives.includes(SYNTH_RAMPS)) {
    manifest.layers.primitives.push(SYNTH_RAMPS);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
}

/** Map { step: "#hex" } → { step: { $value: "#hex" } }. */
function toDTCG(ramp) {
  const out = {};
  for (const [step, value] of Object.entries(ramp)) out[step] = { $value: value };
  return out;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
}

/**
 * Resolve a brief to a concrete theme via the accent lexicon.
 * @returns {{theme:string, ramp:string|null, via:string, hint?:string}}
 */
export function resolveThemeCmd(root, briefPath) {
  return resolveThemeForBrief(root, readJSON(briefPath));
}

/** Shared brand-direction → theme resolution used by resolve-theme and plan. */
function resolveThemeForBrief(root, brief) {
  const manifest = readJSON(`${root}/tokens/manifest.json`);
  const { lexicon } = readJSON(`${root}/prompts/planning/accent-lexicon.json`);

  // Map each available theme to the primitive ramp its accent uses.
  /** @type {Record<string,string>} */
  const themeRamps = {};
  for (const name of manifest.themes.available) {
    try {
      const doc = readJSON(`${root}/tokens/themes/${name}.json`);
      const ref = doc?.color?.accent?.default?.$value ?? '';
      const m = String(ref).match(/^\{color\.([a-z0-9-]+)\./);
      if (m) themeRamps[name] = m[1];
    } catch { /* base themes without an accent override inherit; skip */ }
  }

  return resolveTheme(brief, {
    available: manifest.themes.available,
    defaultTheme: manifest.themes.default,
    themeRamps,
    lexicon,
  });
}

/**
 * Deterministically expand a brief into a build plan (no LLM). Resolves the
 * theme, expands the page's blueprint, and maps brief content onto each recipe.
 * @returns {{plan:any, out:string|null, theme:string}}
 */
export function planCmd(root, briefPath, { out } = {}) {
  const plan = briefToPlan(root, readJSON(briefPath));
  if (out) writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
  return { plan, out: out ?? null, theme: plan.theme };
}

/** Load all recipe specs, keyed by name. */
function loadRecipes(root) {
  /** @type {Record<string,any>} */
  const recipes = {};
  for (const f of listJSON(`${root}/recipes`)) {
    if (f.includes('/schema/')) continue;
    const r = readJSON(f);
    recipes[r.name] = r;
  }
  return recipes;
}

/** Turn a brief *object* into a single-page build plan (used by the CLI and the Studio). */
export function briefToPlan(root, brief) {
  const { theme } = resolveThemeForBrief(root, brief);
  const blueprints = readJSON(`${root}/prompts/planning/blueprints.json`);
  return planFromBrief(brief, { blueprints, recipes: loadRecipes(root), theme });
}

/**
 * Deterministically expand a brief into a multi-page site plan (no LLM).
 * @returns {{plan:any, out:string|null, theme:string}}
 */
export function planSiteCmd(root, briefPath, { out } = {}) {
  const brief = readJSON(briefPath);
  const { theme } = resolveThemeForBrief(root, brief);
  const blueprints = readJSON(`${root}/prompts/planning/blueprints.json`);
  const plan = planSiteFromBrief(brief, { blueprints, recipes: loadRecipes(root), theme });
  if (out) writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
  return { plan, out: out ?? null, theme };
}

/** Scaffold a minimal, schema-valid brief. @returns {string} the written path */
export function newCmd(name, outPath) {
  const brief = {
    business: { name, description: `What ${name} does, in a sentence or two.`, tone: 'confident, plain-spoken' },
    goals: { primary: 'The single most important outcome.', secondary: [] },
    audience: 'Who the site speaks to.',
    brand: { theme: 'light', accent: 'trustworthy indigo', logo: '/assets/logo.svg' },
    pages: [{ type: 'landing', path: '/' }],
    content: {
      eyebrow: 'Category',
      headline: 'The one-line promise',
      valueProposition: 'What the product does and why it matters, in one or two sentences.',
      primaryCta: { label: 'Get started', href: '/start' },
      secondaryCta: { label: 'See how it works', href: '/product' },
      features: [{ icon: 'bolt', title: 'Feature one', body: 'A short benefit statement.' }],
      faqs: [{ question: 'A common question?', answer: 'A clear answer.' }],
      formFields: [
        { label: 'Your name', type: 'text', required: true },
        { label: 'Work email', type: 'email', required: true },
        { label: 'Message', type: 'textarea' },
      ],
      nav: [{ label: 'Product', href: '/product' }, { label: 'Pricing', href: '/pricing' }],
      footerColumns: [{ title: 'Product', links: [{ label: 'Overview', href: '/product' }] }],
    },
  };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(brief, null, 2) + '\n');
  return outPath;
}
