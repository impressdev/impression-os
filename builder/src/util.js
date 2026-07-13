// @ts-check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Read and parse a JSON file. @param {string} path @returns {any} */
export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Recursively list *.json files under a directory, sorted for determinism.
 * @param {string} dir @returns {string[]}
 */
export function listJSON(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listJSON(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

/**
 * Deterministic 7-character id derived from a unique string (djb2 → hex).
 * No randomness or time — the same path always yields the same id, which is
 * what keeps builds byte-stable.
 * @param {string} str @returns {string}
 */
export function hashId(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  // Keep the low (most-varying) 7 hex nibbles: paths that differ only in a
  // trailing index char differ in the low bits, so this avoids collisions.
  return h.toString(16).padStart(8, '0').slice(-7);
}

/**
 * Parse a CSS dimension string into an Elementor {unit,size} object.
 * @param {string|number} v @returns {{unit:string,size:number}}
 */
export function parseDimension(v) {
  if (typeof v === 'number') return { unit: 'px', size: v };
  const m = String(v).trim().match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
  if (!m) return { unit: 'px', size: 0 };
  return { unit: m[2] || 'px', size: Number(m[1]) };
}

/** Stable JSON stringify (sorted keys) for hashing / determinism checks. */
export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    /** @type {Record<string, any>} */
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}

/** Pick the first present, truthy field from an object. */
export function pick(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) if (obj[k] != null && obj[k] !== '') return obj[k];
  return undefined;
}
