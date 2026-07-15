// @ts-check
/**
 * Deterministic, brand-colored SVG placeholders for images whose URLs don't
 * resolve yet (briefs reference assets like /assets/hero.png before they
 * exist). A placeholder shows a subtle frame, an image glyph, and the alt text
 * — so previews and imports look designed instead of broken.
 */

/**
 * @param {{ label?: string, width?: number, height?: number,
 *           surface?: string, border?: string, muted?: string, accent?: string }} opts
 * @returns {string} an SVG document
 */
export function placeholderSvg(opts = {}) {
  const {
    label = '', width = 800, height = 450,
    surface = '#f1f5f9', border = '#e2e8f0', muted = '#64748b', accent = '#4f46e5',
    wordmark = false,
  } = opts;

  // Wordmark mode: a small logo-shaped placeholder that renders the brand name.
  if (wordmark) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
<rect width="${width}" height="${height}" rx="8" fill="${surface}"/>
<circle cx="${height / 2}" cy="${height / 2}" r="${height * 0.22}" fill="${accent}"/>
<text x="${height * 0.95}" y="${height / 2 + 6}" font-family="system-ui, sans-serif" font-size="${Math.round(height * 0.42)}" font-weight="700" fill="${muted}">${esc(truncate(label, 20))}</text>
</svg>`;
  }
  const cx = width / 2;
  const cy = height / 2 - (label ? 14 : 0);
  const g = Math.min(width, height) * 0.16; // glyph half-size
  const text = label
    ? `<text x="${cx}" y="${cy + g + 30}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="${muted}">${esc(truncate(label, 48))}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
<rect width="${width}" height="${height}" fill="${surface}"/>
<rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="${border}" stroke-width="2" rx="12"/>
<g transform="translate(${cx - g}, ${cy - g})">
  <rect width="${g * 2}" height="${g * 2}" rx="8" fill="none" stroke="${muted}" stroke-width="3"/>
  <circle cx="${g * 0.62}" cy="${g * 0.62}" r="${g * 0.16}" fill="${accent}"/>
  <path d="M ${g * 0.2} ${g * 1.7} L ${g * 0.85} ${g * 0.95} L ${g * 1.3} ${g * 1.4} L ${g * 1.55} ${g * 1.15} L ${g * 1.8} ${g * 1.7} Z" fill="${muted}"/>
</g>
${text}
</svg>`;
}

/** The SVG as an <img>-ready data URI. */
export function placeholderDataUri(opts) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg(opts))}`;
}

/** True when an image URL cannot resolve in a standalone/preview context. */
export function isUnresolvedAsset(url) {
  const u = String(url ?? '');
  return u !== '' && !/^(https?:|data:)/i.test(u);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
