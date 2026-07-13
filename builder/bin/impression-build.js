#!/usr/bin/env node
// @ts-check
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, writeBuild } from '../src/index.js';

/**
 * CLI: compile a brief into an Elementor Pro kit + templates.
 *
 *   impression-build --brief brief.json --out dist [--root .]
 */
function main(argv) {
  const args = parseArgs(argv);
  const root = resolve(args.root ?? process.cwd());
  if (!args.brief) {
    console.error('Usage: impression-build --brief <brief.json> --out <dir> [--root <repo>]');
    process.exit(1);
  }
  const brief = JSON.parse(readFileSync(resolve(args.brief), 'utf8'));
  const result = build(root, brief);
  const out = writeBuild(result, resolve(args.out ?? 'dist'));

  console.log(`Impression OS build — theme "${result.theme}"`);
  console.log(`  kit:       ${result.kit.settings.system_colors.length + result.kit.settings.custom_colors.length} global colors, ` +
    `${result.kit.settings.system_typography.length + result.kit.settings.custom_typography.length} global fonts`);
  console.log(`  templates: ${result.templates.map((t) => t.name).join(', ') || '(none)'}`);
  console.log(`  written:   ${out}`);
}

function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    out[key] = argv[i + 1];
  }
  return out;
}

main(process.argv.slice(2));
