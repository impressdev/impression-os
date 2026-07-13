#!/usr/bin/env node
// @ts-check
import { resolve } from 'node:path';
import { buildCmd, buildSiteCmd, validateCmd, lintCmd, listCmd, newCmd, themeCmd, resolveThemeCmd, planCmd, planSiteCmd } from '../lib/commands.js';

const HELP = `impression — the Impression OS CLI

Usage:
  impression build <plan.json> [--out <dir>] [--theme <name>] [--root <repo>]
  impression build-site <site.json> [--out <dir>] [--root <repo>]
  impression validate [--root <repo>]
  impression lint <plan.json> [--root <repo>]
  impression list <recipes|components|themes> [--root <repo>]
  impression new <name> [--out <brief.json>]
  impression theme <name> (--accent <ramp> | --hex <#color>) [--base light|dark] [--root <repo>]
  impression resolve-theme <brief.json> [--root <repo>]
  impression plan <brief.json> [--out <plan.json>] [--root <repo>]
  impression plan-site <brief.json> [--out <site.json>] [--root <repo>]
  impression help

Commands:
  build          Compile a build plan into an Elementor Pro kit + templates.
  build-site     Compile a multi-page site plan into one kit + per-page templates.
  validate       Check every data artifact against its schema and reference integrity.
  lint           Run the build-plan guardrails against a plan.
  list           List available recipes, components, or themes.
  new            Scaffold a minimal, schema-valid brief.
  theme          Generate a brand theme (accent chosen by contrast to meet WCAG AA).
  resolve-theme  Resolve a brief's brand direction to a concrete theme.
  plan           Expand a brief into a build plan deterministically (no LLM).
  plan-site      Expand a brief into a multi-page site plan (no LLM).
`;

function main(argv) {
  const [cmd, ...rest] = argv;
  const { positionals, flags } = parse(rest);
  const root = resolve(flags.root ?? process.cwd());

  switch (cmd) {
    case 'build': {
      requireArg(positionals[0], 'build needs a <plan.json>');
      const r = buildCmd(root, resolve(positionals[0]), resolve(flags.out ?? 'dist'), flags.theme);
      log(`Built theme "${r.theme}" — ${r.colors} colors, ${r.fonts} fonts, ${r.sections.length} templates`);
      log(`  sections: ${r.sections.join(', ')}`);
      log(`  written:  ${r.out}`);
      break;
    }
    case 'build-site': {
      requireArg(positionals[0], 'build-site needs a <site.json>');
      const r = buildSiteCmd(root, resolve(positionals[0]), resolve(flags.out ?? 'dist'));
      log(`Built site (theme "${r.theme}", ${r.pages.length} pages)`);
      for (const p of r.pages) log(`  ${p.path.padEnd(10)} ${p.slug.padEnd(10)} ${p.templates} templates`);
      log(`  written: ${r.out}`);
      break;
    }
    case 'validate': {
      const errors = validateCmd(root);
      if (errors.length) { errors.forEach((e) => log(`✖ ${e}`)); fail(`${errors.length} problem(s)`); }
      log('✓ All data artifacts valid (schemas + references).');
      break;
    }
    case 'lint': {
      requireArg(positionals[0], 'lint needs a <plan.json>');
      const violations = lintCmd(root, resolve(positionals[0]));
      const errs = violations.filter((v) => v.severity === 'error');
      violations.forEach((v) => log(`${v.severity === 'error' ? '✖' : '⚠'} ${v.rule}: ${v.message}`));
      if (errs.length) fail(`${errs.length} guardrail error(s)`);
      log(`✓ Plan passes guardrails${violations.length ? ' (warnings only)' : ''}.`);
      break;
    }
    case 'list': {
      const what = positionals[0];
      if (!['recipes', 'components', 'themes'].includes(what)) fail('list needs: recipes | components | themes');
      for (const item of listCmd(root, /** @type {any} */(what))) log(`  ${item.name.padEnd(16)} ${item.detail}`);
      break;
    }
    case 'new': {
      requireArg(positionals[0], 'new needs a <name>');
      const out = newCmd(positionals[0], resolve(flags.out ?? `${positionals[0]}.brief.json`));
      log(`Scaffolded brief: ${out}`);
      break;
    }
    case 'theme': {
      requireArg(positionals[0], 'theme needs a <name>');
      if (!flags.accent && !flags.hex) fail('theme needs --accent <ramp> or --hex <#color>');
      const r = themeCmd(root, positionals[0], { accent: flags.accent, hex: flags.hex, base: flags.base ?? 'light' });
      log(`Generated theme "${r.name}" (accent ${r.choices.accent}, base ${r.choices.base})`);
      log(`  accent step ${r.choices.accentStep} → white label ${r.choices.accentContrast}:1 (AA)`);
      log(`  link step   ${r.choices.linkStep} → ${r.choices.linkContrast}:1 on surface`);
      log(`  written:    ${r.file} (+ registered in the manifest)`);
      break;
    }
    case 'resolve-theme': {
      requireArg(positionals[0], 'resolve-theme needs a <brief.json>');
      const r = resolveThemeCmd(root, resolve(positionals[0]));
      log(`Theme: ${r.theme}`);
      log(`  ${r.via}`);
      if (r.hint) log(`  hint: ${r.hint}`);
      break;
    }
    case 'plan': {
      requireArg(positionals[0], 'plan needs a <brief.json>');
      const r = planCmd(root, resolve(positionals[0]), { out: flags.out ? resolve(flags.out) : undefined });
      if (r.out) log(`Wrote build plan (theme "${r.theme}", ${r.plan.sections.length} sections): ${r.out}`);
      else log(JSON.stringify(r.plan, null, 2));
      break;
    }
    case 'plan-site': {
      requireArg(positionals[0], 'plan-site needs a <brief.json>');
      const r = planSiteCmd(root, resolve(positionals[0]), { out: flags.out ? resolve(flags.out) : undefined });
      if (r.out) log(`Wrote site plan (theme "${r.theme}", ${r.plan.pages.length} pages): ${r.out}`);
      else log(JSON.stringify(r.plan, null, 2));
      break;
    }
    case 'help':
    case undefined:
      log(HELP);
      break;
    default:
      fail(`Unknown command "${cmd}"\n\n${HELP}`);
  }
}

function parse(args) {
  const positionals = [];
  /** @type {Record<string,string>} */
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) { flags[args[i].slice(2)] = args[i + 1]; i++; }
    else positionals.push(args[i]);
  }
  return { positionals, flags };
}
function requireArg(v, msg) { if (!v) fail(msg); }
function log(m) { process.stdout.write(m + '\n'); }
function fail(m) { process.stderr.write(`error: ${m}\n`); process.exit(1); }

main(process.argv.slice(2));
