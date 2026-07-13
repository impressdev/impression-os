// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repoRoot } from './lib/paths.js';
import { build } from '../builder/src/index.js';

const root = repoRoot();

const plan = {
  theme: 'light',
  sections: [
    {
      recipe: 'stats',
      content: {
        heading: 'By the numbers',
        stats: [
          { value: '4 days', label: 'Earlier warning, on average' },
          { value: '99.9%', label: 'Uptime' },
          { value: '2×', label: 'Faster incident response' },
        ],
      },
    },
    {
      recipe: 'logo-cloud',
      content: {
        heading: 'Trusted by operations teams',
        logos: [
          { url: '/a.svg', alt: 'Meridian' },
          { url: '/b.svg', alt: 'Halcyon' },
          { url: '/c.svg', alt: 'Northgate' },
          { url: '/d.svg', alt: 'Brightline' },
        ],
      },
    },
  ],
};

function collect(node, pred, out = []) {
  if (pred(node)) out.push(node);
  for (const c of node.elements ?? []) collect(c, pred, out);
  for (const c of node.content ?? []) collect(c, pred, out);
  return out;
}

test('stats compiles one stat (value + label) per metric', () => {
  const { templates } = build(root, plan);
  const stats = templates.find((t) => t.name === 'stats');
  const values = collect(stats.template, (n) => n.widgetType === 'heading' && n.settings.header_size === 'h3');
  assert.deepEqual(values.map((v) => v.settings.title), ['4 days', '99.9%', '2×']);
  const labels = collect(stats.template, (n) => n.widgetType === 'text-editor');
  assert.equal(labels.length, 3);
});

test('logo-cloud compiles one image per logo, with alt text', () => {
  const { templates } = build(root, plan);
  const cloud = templates.find((t) => t.name === 'logo-cloud');
  const images = collect(cloud.template, (n) => n.widgetType === 'image');
  assert.equal(images.length, 4);
  assert.deepEqual(images.map((i) => i.settings.image.alt), ['Meridian', 'Halcyon', 'Northgate', 'Brightline']);
});
