// @ts-check
import { join, basename } from 'node:path';
import { readJSON, listJSON } from './util.js';

/**
 * @typedef {Object} Sources
 * @property {any} manifest
 * @property {string[]} tokenFiles          Absolute paths, in resolution order.
 * @property {Record<string, any>} components  name → component spec.
 * @property {Record<string, any>} recipes     name → recipe spec.
 * @property {any} grid                         foundation grid contract.
 */

/**
 * Load every source the builder needs from a repository root.
 * @param {string} root @returns {Sources}
 */
export function loadSources(root) {
  const manifest = readJSON(join(root, 'tokens', 'manifest.json'));

  // Token files in manifest order (primitives → semantic → themes).
  /** @type {string[]} */
  const tokenFiles = [];
  for (const layer of manifest.resolution.order) {
    for (const rel of manifest.layers[layer]) tokenFiles.push(join(root, 'tokens', rel));
  }

  /** @type {Record<string, any>} */
  const components = {};
  for (const f of listJSON(join(root, 'components'))) {
    if (f.includes('/schema/')) continue;
    const spec = readJSON(f);
    components[spec.name] = spec;
  }

  /** @type {Record<string, any>} */
  const recipes = {};
  for (const f of listJSON(join(root, 'recipes'))) {
    if (f.includes('/schema/')) continue;
    const spec = readJSON(f);
    recipes[spec.name] = spec;
  }

  const grid = readJSON(join(root, 'foundation', 'grid', 'grid.json'));

  return { manifest, tokenFiles, components, recipes, grid };
}

/** The theme name for a token file path, e.g. themes/dark.json → "dark". */
export function themeNameOf(path) {
  return basename(path).replace(/\.json$/, '');
}
