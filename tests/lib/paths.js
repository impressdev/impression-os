// @ts-check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path to the repository root (this file is tests/lib/paths.js). */
export function repoRoot() {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))));
}

/** @param {string} path @returns {any} */
export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Recursively list *.json under a directory, sorted. @param {string} dir @returns {string[]} */
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
