// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { planSiteCmd } from '../lib/commands.js';
import { checkInternalLinks } from '../lib/links.js';
import { lintPlan } from '../lib/guardrails.js';
import { validate } from '../lib/jsonschema.js';
import { build, buildSite, writeSite } from '../../builder/src/index.js';
import { stableStringify } from '../../builder/src/util.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const siteSchema = JSON.parse(readFileSync(`${root}/prompts/planning/site-plan.schema.json`, 'utf8'));

/** A multi-page brief derived from the example brief. */
function multiPageBriefPath() {
  const brief = JSON.parse(readFileSync(`${root}/prompts/brief/example.brief.json`, 'utf8'));
  brief.pages = [{ type: 'landing', path: '/' }, { type: 'about', path: '/about' }, { type: 'minimal', path: '/start' }];
  const dir = mkdtempSync(join(tmpdir(), 'ios-site-'));
  const p = join(dir, 'multi.brief.json');
  writeFileSync(p, JSON.stringify(brief));
  return p;
}

const briefPath = multiPageBriefPath();
const site = planSiteCmd(root, briefPath, {}).plan;

test('a multi-page brief expands to a schema-valid site plan', () => {
  assert.deepEqual(validate(siteSchema, site), []);
  assert.equal(site.pages.length, 3);
  assert.deepEqual(site.pages.map((p) => p.path), ['/', '/about', '/start']);
});

test('every page shares the theme, passes guardrails, and builds', () => {
  for (const page of site.pages) {
    const asPlan = { theme: site.theme, sections: page.sections };
    assert.deepEqual(lintPlan(root, asPlan).filter((v) => v.severity === 'error'), [], `${page.path} guardrails`);
    const { templates } = build(root, asPlan);
    assert.equal(templates.length, page.sections.length, `${page.path} template count`);
    assert.equal(page.sections[0].recipe, 'header');
    assert.equal(page.sections.at(-1).recipe, 'footer');
  }
});

test('pages differ by blueprint (landing is richer than minimal)', () => {
  const byPath = Object.fromEntries(site.pages.map((p) => [p.path, p.sections.length]));
  assert.ok(byPath['/'] > byPath['/start'], 'landing has more sections than minimal');
});

test('site planning is deterministic', () => {
  assert.equal(stableStringify(planSiteCmd(root, briefPath, {}).plan), stableStringify(site));
});

test('buildSite emits one shared kit and per-page templates + metadata', () => {
  const result = buildSite(root, site);
  assert.ok(result.kit.settings.system_colors.length > 0, 'one kit for the site');
  assert.equal(result.pages.length, 3);
  for (const page of result.pages) {
    const original = site.pages.find((p) => p.path === page.path);
    assert.equal(page.templates.length, original.sections.length, `${page.path} template count`);
    assert.ok(page.page.title, `${page.path} has page metadata`);
  }
  // slugs are unique and filesystem-safe
  const slugs = result.pages.map((p) => p.slug);
  assert.deepEqual(slugs, ['index', 'about', 'start']);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('site build is deterministic', () => {
  assert.equal(stableStringify(buildSite(root, site)), stableStringify(buildSite(root, site)));
});

test('buildSite emits a sitemap with one entry per page', () => {
  const result = buildSite(root, site);
  assert.equal(result.sitemap.length, result.pages.length);
  assert.deepEqual(result.sitemap.map((s) => s.path), site.pages.map((p) => p.path));
  for (const entry of result.sitemap) assert.ok(entry.title && entry.slug, 'sitemap entry has title + slug');
});

test('each page carries a canonical path and default index robots', () => {
  const result = buildSite(root, site);
  for (const page of result.pages) {
    assert.equal(page.page.canonical, page.path);
    assert.equal(page.page.robots, 'index, follow');
  }
});

test('a noindex page emits meta-robots noindex and a robots.txt Disallow', () => {
  const withNoindex = { ...site, pages: [...site.pages, { path: '/thanks', type: 'minimal', noindex: true, sections: site.pages[0].sections }] };
  const result = buildSite(root, withNoindex);
  const thanks = result.pages.find((p) => p.path === '/thanks');
  assert.equal(thanks.page.robots, 'noindex, nofollow');

  const dir = mkdtempSync(join(tmpdir(), 'ios-robots-'));
  writeSite(result, dir);
  const robots = readFileSync(join(dir, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: \/sitemap\.xml/);
  assert.match(robots, /Disallow: \/thanks/);
});

test('internal-link check flags orphan pages but not linked ones', () => {
  // In this site /about is linked from the footer, but /start is not linked anywhere.
  const orphans = checkInternalLinks(site).filter((w) => w.rule === 'orphan-page').map((w) => w.message);
  assert.ok(orphans.some((m) => m.includes('/start')), 'flags the unlinked /start');
  assert.ok(!orphans.some((m) => m.includes('/about')), 'does not flag the linked /about');
  assert.ok(!orphans.some((m) => m.includes('"/"')), 'never flags the home page');
});
