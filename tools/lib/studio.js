// @ts-check
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, writeBuild, renderPage } from '../../builder/src/index.js';
import { briefToPlan } from './commands.js';
import { synthesizeRamp } from './ramp.js';
import { generateBrandTheme } from './theme.js';
import { zip } from './zip.js';

const here = dirname(fileURLToPath(import.meta.url));

/**
 * Build a brief, synthesizing an ad-hoc brand theme from brand.hex when present
 * (contrast-chosen, never persisted) — this powers the Studio's live color picker.
 */
function buildFromBrief(root, brief) {
  const plan = briefToPlan(root, brief);
  const hex = brief && brief.brand && brief.brand.hex;
  if (typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex)) {
    const base = ['light', 'dark'].includes(brief.brand.theme) ? brief.brand.theme : 'light';
    try {
      const ramp = synthesizeRamp(hex);
      const rampDTCG = Object.fromEntries(Object.entries(ramp).map(([k, v]) => [k, { $value: v }]));
      const { theme } = generateBrandTheme({ color: { custom: rampDTCG } }, { name: 'custom', accent: 'custom', base });
      plan.theme = base;
      const r = build(root, plan, { extra: { primitives: { color: { $type: 'color', custom: rampDTCG } }, theme } });
      return { ...r, warning: null };
    } catch (e) {
      // Fail gracefully: the color can't meet AA — fall back to the base theme.
      plan.theme = base;
      return { ...build(root, plan), warning: `Kleur kan geen AA halen — teruggevallen op thema "${base}". (${msg(e)})` };
    }
  }
  return build(root, plan);
}

/**
 * Start the local Studio: a zero-dependency web app that turns a brief into a
 * live HTML preview and can write the Elementor kit to disk. Wraps the existing
 * builder library — no framework, no cloud.
 * @param {string} root @param {number} port
 * @returns {{ port:number, url:string, close:()=>void, server:import('node:http').Server }}
 */
export function startStudio(root, port = 4321) {
  const ui = readFileSync(join(here, 'studio.html'), 'utf8');

  const server = createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(ui);
    }

    if (req.method === 'POST' && req.url === '/api/preview') {
      return readBody(req, (brief) => {
        try {
          const r = buildFromBrief(root, brief);
          json(res, 200, { html: renderPage(r.kit, r.templates, r.page), sections: r.templates.map((t) => t.name), theme: r.theme, warning: r.warning || null });
        } catch (e) { json(res, 400, { error: msg(e) }); }
      });
    }

    if (req.method === 'POST' && req.url === '/api/build') {
      return readBody(req, (brief) => {
        try {
          const r = buildFromBrief(root, brief);
          const out = join(root, 'studio-output');
          writeBuild(r, out);
          json(res, 200, { out, files: ['kit.json', 'page.json', ...r.templates.map((t) => `templates/${t.name}.json`)] });
        } catch (e) { json(res, 400, { error: msg(e) }); }
      });
    }

    if (req.method === 'POST' && req.url === '/api/download') {
      return readBody(req, (brief) => {
        try {
          const r = buildFromBrief(root, brief);
          const files = [
            { name: 'kit.json', data: JSON.stringify(r.kit, null, 2) },
            { name: 'page.json', data: JSON.stringify(r.page, null, 2) },
            ...r.templates.map((t) => ({ name: `templates/${t.name}.json`, data: JSON.stringify(t.template, null, 2) })),
          ];
          const buf = zip(files);
          res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': 'attachment; filename="impression-kit.zip"' });
          res.end(buf);
        } catch (e) { json(res, 400, { error: msg(e) }); }
      });
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
  });

  const ready = new Promise((res) => server.once('listening', res));
  server.listen(port);
  return { port, url: `http://localhost:${port}`, ready, close: () => server.close(), server };
}

function readBody(req, cb) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 5_000_000) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(body || '{}')); } catch (e) { /* ignore malformed */ } });
}
function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function msg(e) { return String((e && e.message) || e); }
