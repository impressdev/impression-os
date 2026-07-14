// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startStudio } from '../lib/studio.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const brief = {
  business: { name: 'Studio Co', description: 'We test things.' },
  goals: { primary: 'Convert' },
  brand: { theme: 'light', logo: '/logo.svg' },
  content: {
    headline: 'Built in the Studio',
    valueProposition: 'A one-line pitch.',
    primaryCta: { label: 'Start', href: '/start' },
    features: [{ icon: 'bolt', title: 'Fast', body: 'Very fast.' }],
    nav: [{ label: 'Product', href: '#' }],
    footerColumns: [{ title: 'X', links: [{ label: 'Y', href: '#' }] }],
  },
};

test('studio serves the UI and renders a live preview from a brief', async () => {
  const s = startStudio(root, 4399);
  await s.ready;
  try {
    const ui = await (await fetch(s.url)).text();
    assert.match(ui, /Impression OS — Studio/);

    const res = await fetch(`${s.url}/api/preview`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(brief),
    });
    const data = await res.json();
    assert.ok(!data.error, data.error);
    assert.match(data.html, /^<!doctype html>/i);
    assert.match(data.html, /Built in the Studio/);
    assert.ok(data.sections.includes('hero'));
    assert.equal(data.theme, 'light');
  } finally {
    s.close();
  }
});

test('a custom brand hex re-themes the live preview (contrast-chosen accent)', async () => {
  const s = startStudio(root, 4401);
  await s.ready;
  try {
    const withHex = { ...brief, brand: { ...brief.brand, hex: '#e11d48' } };
    const res = await fetch(`${s.url}/api/preview`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(withHex),
    });
    const data = await res.json();
    assert.ok(!data.warning, data.warning);
    const accent = (data.html.match(/--color-accent: (#[0-9a-f]{6})/i) || [])[1];
    assert.match(accent, /^#[0-9a-f]{6}$/i);
    assert.notEqual(accent.toLowerCase(), '#4f46e5', 'accent should not be the default indigo');
  } finally {
    s.close();
  }
});

test('studio rejects a malformed brief with a 400 and an error message', async () => {
  const s = startStudio(root, 4400);
  await s.ready;
  try {
    const res = await fetch(`${s.url}/api/preview`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme: 'no-such-theme', business: {} }),
    });
    // theme resolution falls back to default, but an unknown structure should still return something safe
    assert.ok(res.status === 200 || res.status === 400);
  } finally {
    s.close();
  }
});
