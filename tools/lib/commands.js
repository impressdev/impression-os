// @ts-check
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { build, writeBuild } from '../../builder/src/index.js';
import { validateData } from './validate.js';
import { lintPlan } from './guardrails.js';
import { readJSON, listJSON } from './fs.js';

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
    .map((d) => ({ name: d.name, detail: `${d.category} — ${d.description.split('.')[0]}` }));
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
      nav: [{ label: 'Product', href: '/product' }, { label: 'Pricing', href: '/pricing' }],
      footerColumns: [{ title: 'Product', links: [{ label: 'Overview', href: '/product' }] }],
    },
  };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(brief, null, 2) + '\n');
  return outPath;
}
