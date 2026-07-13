// @ts-check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

/** Strip a repo-root prefix for tidy reporting. */
export function rel(root, path) {
  return path.startsWith(root + '/') ? path.slice(root.length + 1) : path;
}
