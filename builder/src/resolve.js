// @ts-check
import { readJSON } from './util.js';
import { themeNameOf } from './load.js';

/**
 * A resolved token: its concrete value plus its declared type.
 * @typedef {{ value: any, type: string|undefined }} Resolved
 */

/**
 * Flatten a DTCG token document into a map of dotted-path → { $value, $type },
 * carrying the nearest ancestor $type down to each leaf.
 * @param {any} doc @param {Record<string, any>} out @param {string[]} path @param {string=} type
 */
function flatten(doc, out, path = [], type) {
  if (doc && typeof doc === 'object') {
    const t = doc.$type ?? type;
    if ('$value' in doc) {
      out[path.join('.')] = { $value: doc.$value, $type: t };
      return;
    }
    for (const [k, v] of Object.entries(doc)) {
      if (k.startsWith('$')) continue;
      flatten(v, out, [...path, k], t);
    }
  }
}

const REF = /^\{([a-zA-Z0-9._-]+)\}$/;

/**
 * Resolve the token layer for a single theme into a flat map of concrete values.
 * Primitives and semantic tokens are theme-independent; the named theme (and any
 * theme it $extends) supplies the semantic color roles. All {references} are
 * dereferenced to concrete values.
 *
 * @param {import('./load.js').Sources} sources
 * @param {string} theme  e.g. "light" | "dark" | "brand.example"
 * @returns {Record<string, Resolved>}
 */
export function resolveTheme(sources, theme) {
  /** @type {Record<string, any>} */
  const defs = {};

  // 1. primitives + semantic (theme-independent)
  for (const f of sources.tokenFiles) {
    if (f.includes('/themes/')) continue;
    flatten(readJSON(f), defs);
  }

  // 2. the requested theme, honoring $extends (base first, then override)
  applyTheme(sources, theme, defs, new Set());

  // 3. dereference every value
  /** @type {Record<string, Resolved>} */
  const resolved = {};
  const resolving = new Set();
  const resolvePath = (path) => {
    if (path in resolved) return resolved[path].value;
    const def = defs[path];
    if (!def) throw new Error(`Unknown token reference: {${path}}`);
    if (resolving.has(path)) throw new Error(`Cyclic token reference at {${path}}`);
    resolving.add(path);
    const value = deref(def.$value);
    resolving.delete(path);
    resolved[path] = { value, type: def.$type };
    return value;
  };
  const deref = (v) => {
    if (typeof v === 'string') {
      const m = v.match(REF);
      return m ? resolvePath(m[1]) : v;
    }
    if (Array.isArray(v)) return v.map(deref);
    if (v && typeof v === 'object') {
      /** @type {Record<string, any>} */
      const o = {};
      for (const [k, val] of Object.entries(v)) o[k] = deref(val);
      return o;
    }
    return v;
  };

  for (const path of Object.keys(defs)) resolvePath(path);
  return resolved;
}

/** Merge a theme file (and its $extends base) into defs. */
function applyTheme(sources, theme, defs, seen) {
  if (seen.has(theme)) throw new Error(`Cyclic theme $extends at "${theme}"`);
  seen.add(theme);
  const file = sources.tokenFiles.find((f) => f.includes('/themes/') && themeNameOf(f) === theme);
  if (!file) throw new Error(`Unknown theme: "${theme}"`);
  const doc = readJSON(file);
  if (doc.$extends) applyTheme(sources, doc.$extends, defs, seen);
  flatten(doc, defs);
}

/** List the available theme names from the manifest. */
export function themeList(sources) {
  return sources.manifest.themes.available;
}
