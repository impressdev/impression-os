// @ts-check
/**
 * Internal-link checks for a multi-page site plan. The high-signal, low-noise
 * check is the orphan page: a page that is generated but never linked from any
 * nav, footer, or CTA — you can build it, but a visitor can't reach it.
 */

/**
 * @param {any} sitePlan
 * @returns {{rule:string, severity:string, message:string}[]}
 */
export function checkInternalLinks(sitePlan) {
  const pagePaths = new Set((sitePlan.pages ?? []).map((p) => normalize(p.path)));
  const linked = new Set();
  for (const page of sitePlan.pages ?? []) {
    for (const s of page.sections ?? []) collectHrefs(s.content, linked);
  }

  /** @type {{rule:string, severity:string, message:string}[]} */
  const out = [];
  for (const page of sitePlan.pages ?? []) {
    const path = normalize(page.path);
    if (path === '/') continue; // home is reached via the logo / root
    if (!linked.has(path)) {
      out.push({ rule: 'orphan-page', severity: 'warn', message: `page "${page.path}" is not linked from any nav, footer, or CTA` });
    }
  }
  return out;
}

/** Collect every href value found in a content object. */
function collectHrefs(value, out) {
  if (Array.isArray(value)) { value.forEach((v) => collectHrefs(v, out)); return; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === 'href' && typeof v === 'string') out.add(normalize(v));
      else collectHrefs(v, out);
    }
  }
}

/** Strip a trailing slash (except root) so "/about/" and "/about" compare equal. */
function normalize(path) {
  const s = String(path);
  return s.length > 1 ? s.replace(/\/+$/, '') : s;
}
