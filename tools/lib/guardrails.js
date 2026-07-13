// @ts-check
import { loadSources } from '../../builder/src/index.js';

const DESIGN_VALUE = /#[0-9a-fA-F]{3,8}\b|\b\d+(px|rem|em)\b/;
const GENERIC_CTA = new Set(['click here', 'read more', 'learn more', 'submit']);

/**
 * Run the machine-checkable guardrails (prompts/guardrails/guardrails.json)
 * against a build plan. Returns a list of { rule, message } violations.
 * @param {string} root @param {any} plan
 * @returns {{rule:string, severity:string, message:string}[]}
 */
export function lintPlan(root, plan) {
  const sources = loadSources(root);
  const recipeNames = new Set(Object.keys(sources.recipes));
  const themes = new Set(sources.manifest.themes.available);
  /** @type {{rule:string, severity:string, message:string}[]} */
  const out = [];
  const err = (rule, message) => out.push({ rule, severity: 'error', message });
  const warn = (rule, message) => out.push({ rule, severity: 'warn', message });

  if (!themes.has(plan.theme)) err('theme-exists', `theme "${plan.theme}" is not in the manifest`);

  const recs = (plan.sections ?? []).map((s) => s.recipe);
  if (recs[0] !== 'header') err('header-footer-bookends', 'first section is not header');
  if (recs[recs.length - 1] !== 'footer') err('header-footer-bookends', 'last section is not footer');
  const heroes = recs.filter((r) => r === 'hero').length;
  if (heroes !== 1) err('single-h1', `expected exactly one hero, found ${heroes}`);

  (plan.sections ?? []).forEach((s, i) => {
    if (!recipeNames.has(s.recipe)) { err('recipe-exists', `[${i}] unknown recipe "${s.recipe}"`); return; }
    const recipe = sources.recipes[s.recipe];
    for (const [field, def] of Object.entries(recipe.content ?? {})) {
      if (def && def.required && !(field in (s.content ?? {}))) {
        err('required-content-present', `[${i}] ${s.recipe} missing required "${field}"`);
      }
    }
    walk(s.content, (v) => {
      if (typeof v === 'string' && DESIGN_VALUE.test(v)) {
        err('no-design-values-in-content', `[${i}] ${s.recipe}: content contains a design value "${v}"`);
      }
    });
    walk(s.content, (v) => {
      if (v && typeof v === 'object' && typeof v.label === 'string' && GENERIC_CTA.has(v.label.toLowerCase())) {
        warn('meaningful-cta-text', `[${i}] ${s.recipe}: generic CTA label "${v.label}"`);
      }
    });
  });

  return out;
}

function walk(v, fn) {
  fn(v);
  if (Array.isArray(v)) v.forEach((x) => walk(x, fn));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, fn));
}
