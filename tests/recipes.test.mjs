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

test('team compiles a portrait, name, and role per member', () => {
  const teamPlan = {
    theme: 'light',
    sections: [{
      recipe: 'team',
      content: {
        heading: 'The crew',
        members: [
          { name: 'Ada Nkemdirim', role: 'Founder & CEO', avatar: { url: '/ada.jpg', alt: 'Ada Nkemdirim' } },
          { name: 'Ravi Patel', role: 'Head of Engineering', avatar: { url: '/ravi.jpg', alt: 'Ravi Patel' } },
        ],
      },
    }],
  };
  const { templates } = build(root, teamPlan);
  const t = templates[0].template;
  const names = collect(t, (n) => n.widgetType === 'heading' && n.settings.header_size === 'h3');
  assert.deepEqual(names.map((h) => h.settings.title), ['Ada Nkemdirim', 'Ravi Patel']);
  const portraits = collect(t, (n) => n.widgetType === 'image');
  assert.deepEqual(portraits.map((i) => i.settings.image.alt), ['Ada Nkemdirim', 'Ravi Patel']);
});

test('gallery compiles one image per item, with alt text', () => {
  const galleryPlan = {
    theme: 'light',
    sections: [{
      recipe: 'gallery',
      content: {
        heading: 'Screenshots',
        images: [
          { url: '/a.png', alt: 'Dashboard' },
          { url: '/b.png', alt: 'Reports' },
          { url: '/c.png', alt: 'Settings' },
        ],
      },
    }],
  };
  const { templates } = build(root, galleryPlan);
  const images = collect(templates[0].template, (n) => n.widgetType === 'image');
  assert.equal(images.length, 3);
  assert.deepEqual(images.map((i) => i.settings.image.alt), ['Dashboard', 'Reports', 'Settings']);
});

test('contact compiles a single Elementor form from the fields list', () => {
  const contactPlan = {
    theme: 'light',
    sections: [{
      recipe: 'contact',
      content: {
        heading: 'Book a demo',
        subheading: 'See it on your own data.',
        fields: [
          { label: 'Full name', type: 'text', required: true },
          { label: 'Work email', type: 'email', required: true },
          { label: 'What do you want to solve?', type: 'textarea' },
        ],
        submitLabel: 'Request demo',
      },
    }],
  };
  const { templates } = build(root, contactPlan);
  const forms = collect(templates[0].template, (n) => n.widgetType === 'form');
  assert.equal(forms.length, 1, 'exactly one form widget');
  const form = forms[0];
  assert.equal(form.settings.form_fields.length, 3);
  assert.deepEqual(form.settings.form_fields.map((f) => f.field_type), ['text', 'email', 'textarea']);
  assert.equal(form.settings.form_fields[1].required, 'true');
  assert.equal(form.settings.button_text, 'Request demo');
});
