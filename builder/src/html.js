// @ts-check
/**
 * Render a compiled kit + templates into a single self-contained HTML page — a
 * preview of the generated site that needs no WordPress. Tokens become CSS
 * custom properties and base styles; the Elementor element tree is walked and
 * emitted as semantic HTML. This is a *preview*, not the production Elementor
 * output (which the kit + templates remain).
 */

/**
 * @param {any} kit @param {{name:string,template:any}[]} templates @param {any} page
 * @returns {string} a full HTML document
 */
export function renderPage(kit, templates, page) {
  const head = renderHead(page);
  const body = templates.map((t) => renderSection(t.template)).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
${head}
<style>
${renderCss(kit)}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function renderHead(page = {}) {
  const lines = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title ?? 'Preview')}</title>`,
  ];
  if (page.description) lines.push(`<meta name="description" content="${esc(page.description)}">`);
  if (page.themeColor) lines.push(`<meta name="theme-color" content="${esc(page.themeColor)}">`);
  if (page.robots) lines.push(`<meta name="robots" content="${esc(page.robots)}">`);
  for (const d of page.structuredData ?? []) {
    lines.push(`<script type="application/ld+json">${JSON.stringify(d)}</script>`);
  }
  return lines.join('\n');
}

/** Kit globals → CSS custom properties + a small base stylesheet. */
export function renderCss(kit) {
  const s = kit.settings ?? {};
  const colors = [...(s.system_colors ?? []), ...(s.custom_colors ?? [])];
  const vars = colors.map((c) => `  --color-${slug(c.title)}: ${c.color};`).join('\n');
  const type = Object.fromEntries([...(s.system_typography ?? []), ...(s.custom_typography ?? [])].map((t) => [t.title, t]));
  const font = (t, fallback) => {
    const d = type[t];
    if (!d) return fallback;
    const fam = d.typography_font_family ? `"${d.typography_font_family}", ` : '';
    const size = d.typography_font_size ? `${d.typography_font_size.size}${d.typography_font_size.unit}` : '';
    const lh = d.typography_line_height ? d.typography_line_height.size : '';
    const wt = d.typography_font_weight ?? '';
    return `${fam}${fallback}|${size}|${lh}|${wt}`;
  };
  const parts = (spec) => {
    const [fam, size, lh, wt] = spec.split('|');
    return `font-family:${fam};${size ? `font-size:${size};` : ''}${lh ? `line-height:${lh};` : ''}${wt ? `font-weight:${wt};` : ''}`;
  };
  const container = s.container_width ? `${s.container_width.size}${s.container_width.unit}` : '1200px';

  return `:root {
${vars}
  --container: ${container};
}
* { box-sizing: border-box; }
body { margin: 0; ${parts(font('Text', 'system-ui, sans-serif'))} color: var(--color-text); background: var(--color-surface); }
img { max-width: 100%; display: block; background: var(--color-surface-raised, #eee); min-height: 60px; border-radius: 12px; }
a { color: var(--color-accent); }
h1,h2,h3,h4 { color: var(--color-text); margin: 0 0 .4em; }
h1 { ${parts(font('Primary', 'inherit'))} }
h2 { ${parts(font('Secondary', 'inherit'))} }
h3 { ${parts(font('Heading 3', 'inherit'))} }
h4 { ${parts(font('Heading 4', 'inherit'))} }
p { margin: 0 0 1em; max-width: 65ch; }
.section { padding: clamp(40px, 8vw, 96px) 24px; }
.section:nth-child(even) { background: var(--color-surface-raised, #f6f7f9); }
.container { max-width: var(--container); margin: 0 auto; width: 100%; }
.btn { display: inline-block; padding: 12px 22px; border-radius: 10px; background: var(--color-accent); color: var(--color-on-accent, #fff); text-decoration: none; font-weight: 600; }
.btn--secondary { background: transparent; color: var(--color-accent); border: 1px solid var(--color-border, #ddd); }
.badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: var(--color-surface-raised, #eee); color: var(--color-text-muted, #555); font-size: 12px; font-weight: 600; letter-spacing: .03em; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.list li::before { content: "✓ "; color: var(--color-accent); font-weight: 700; }
.nav { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 18px; }
.nav a { text-decoration: none; color: var(--color-text); font-weight: 500; }
.nav a:hover { color: var(--color-accent); }
.prose { color: var(--color-text-muted, inherit); }
.card { background: var(--color-surface); border: 1px solid var(--color-border, #e5e7eb); border-radius: 16px; padding: 28px; }
.card img { margin-bottom: 4px; }
.accordion details { border: 1px solid var(--color-border, #e5e7eb); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px; background: var(--color-surface); }
.accordion summary { cursor: pointer; }
.field { display: grid; gap: 6px; margin-bottom: 14px; }
input, textarea { padding: 10px 12px; border: 1px solid var(--color-border, #ccc); border-radius: 8px; font: inherit; background: var(--color-surface); color: var(--color-text); }
`;
}

/** A top-level template becomes a full-bleed <section> with a centered container. */
function renderSection(template) {
  const inner = (template.content ?? []).map(renderNode).join('');
  return `<section class="section"><div class="container">${inner}</div></section>`;
}

function renderNode(node, inGrid = false) {
  if (!node) return '';
  if (node.elType === 'container') {
    const s = node.settings ?? {};
    const isGrid = s.container_type === 'grid';
    const kids = (node.elements ?? []).map((c) => renderNode(c, isGrid)).join('');
    const cls = inGrid ? ' class="card"' : '';
    return `<div${cls} style="${flexStyle(s)}">${kids}</div>`;
  }
  return renderWidget(node);
}

function flexStyle(s) {
  const out = [];
  const gapOf = (g) => (g ? `${g.column}${g.unit || 'px'}` : '16px');
  if (s.container_type === 'grid') {
    const n = s.grid_columns_grid?.size ?? 3;
    out.push('display:grid', `grid-template-columns:${gridCols(n)}`, `gap:${gapOf(s.grid_gaps ?? s.flex_gap)}`);
  } else {
    out.push('display:flex', `flex-direction:${s.flex_direction || 'column'}`, `gap:${gapOf(s.flex_gap)}`);
    if (s.flex_wrap) out.push(`flex-wrap:${s.flex_wrap}`);
    if (s.flex_align_items) out.push(`align-items:${s.flex_align_items}`);
    if (s.flex_justify_content) out.push(`justify-content:${s.flex_justify_content}`);
  }
  if (s.min_height) out.push(`min-height:${s.min_height.size}${s.min_height.unit}`);
  return out.join(';');
}

/** Collapse an Elementor grid column count to a responsive-ish CSS grid. */
function gridCols(n) {
  return `repeat(auto-fit, minmax(${Math.max(160, Math.floor(1000 / n))}px, 1fr))`;
}

function renderWidget(node) {
  const s = node.settings ?? {};
  switch (node.widgetType) {
    case 'heading': {
      const tag = /^h[1-6]$/.test(s.header_size) ? s.header_size : 'h2';
      return `<${tag}>${esc(s.title ?? '')}</${tag}>`;
    }
    case 'text-editor':
      return `<div class="prose">${s.editor ?? ''}</div>`;
    case 'button': {
      const cls = 'btn';
      return `<a class="${cls}" href="${esc(s.link?.url ?? '#')}">${esc(s.text ?? '')}</a>`;
    }
    case 'image':
      return `<img src="${esc(s.image?.url ?? '')}" alt="${esc(s.image?.alt ?? '')}">`;
    case 'icon':
      return `<span class="badge" aria-hidden="true">◆</span>`;
    case 'icon-list': {
      const items = s.icon_list ?? [];
      // Items with links are navigation; without links they are a feature list.
      if (items.some((i) => i.link)) {
        return `<ul class="nav">${items.map((i) => `<li><a href="${esc(i.link?.url ?? '#')}">${esc(i.text ?? '')}</a></li>`).join('')}</ul>`;
      }
      return `<ul class="list">${items.map((i) => `<li>${esc(i.text ?? '')}</li>`).join('')}</ul>`;
    }
    case 'accordion': {
      const items = (s.tabs ?? []).map((t) =>
        `<details><summary><strong>${esc(t.tab_title ?? '')}</strong></summary><div class="prose">${t.tab_content ?? ''}</div></details>`
      ).join('');
      return `<div class="accordion">${items}</div>`;
    }
    case 'form': {
      const fields = (s.form_fields ?? []).map((f) => {
        const ctrl = f.field_type === 'textarea'
          ? `<textarea rows="3" placeholder="${esc(f.placeholder ?? '')}"></textarea>`
          : `<input type="${esc(f.field_type ?? 'text')}" placeholder="${esc(f.placeholder ?? '')}">`;
        return `<div class="field"><label>${esc(f.field_label ?? '')}</label>${ctrl}</div>`;
      }).join('');
      return `<form class="form" onsubmit="return false">${fields}<button class="btn">${esc(s.button_text ?? 'Send')}</button></form>`;
    }
    default:
      return '';
  }
}

function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
