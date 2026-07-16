// @ts-check
import { hashId, parseDimension } from './util.js';
import { isFluid, fluidToClamp } from './fluid.js';

/**
 * Map of Elementor system-color slots → semantic color role.
 * Elementor ships four global colors with fixed ids; we bind them to roles.
 */
const SYSTEM_COLORS = [
  // Elementor's semantics: Primary styles headings, Secondary styles subdued
  // text, Text styles body copy, Accent styles links and buttons. (Learned from
  // the first real import: mapping Primary to the accent turned headings indigo.)
  { _id: 'primary', title: 'Primary', role: 'color.text.default' },
  { _id: 'secondary', title: 'Secondary', role: 'color.text.muted' },
  { _id: 'text', title: 'Text', role: 'color.text.default' },
  { _id: 'accent', title: 'Accent', role: 'color.accent.default' },
];

/** Additional named globals a marketing site needs. */
const CUSTOM_COLORS = [
  { title: 'Text Muted', role: 'color.text.muted' },
  { title: 'On Accent', role: 'color.text.onAccent' },
  { title: 'Surface', role: 'color.surface.page' },
  { title: 'Surface Raised', role: 'color.surface.raised' },
  { title: 'Border', role: 'color.border.default' },
  { title: 'Focus', role: 'color.border.focus' },
  { title: 'Success', role: 'color.feedback.success.text' },
  { title: 'Warning', role: 'color.feedback.warning.text' },
  { title: 'Danger', role: 'color.feedback.danger.text' },
  { title: 'Info', role: 'color.feedback.info.text' },
];

const SYSTEM_TYPOGRAPHY = [
  { _id: 'primary', title: 'Primary', role: 'text.h1' },
  { _id: 'secondary', title: 'Secondary', role: 'text.h2' },
  { _id: 'text', title: 'Text', role: 'text.body' },
  { _id: 'accent', title: 'Accent', role: 'text.lead' },
];

const CUSTOM_TYPOGRAPHY = [
  { title: 'Display', role: 'text.display' },
  { title: 'Heading 3', role: 'text.h3' },
  { title: 'Heading 4', role: 'text.h4' },
  { title: 'Small', role: 'text.small' },
  { title: 'Caption', role: 'text.caption' },
  { title: 'Code', role: 'text.code' },
];

/**
 * Compile resolved tokens + the grid contract into an Elementor Pro kit
 * (Site Settings). Deterministic: ids derive from titles, values from tokens.
 *
 * @param {Record<string, import('./resolve.js').Resolved>} tokens
 * @param {any} grid  foundation grid contract
 * @param {string} theme
 * @returns {any}
 */
export function buildKit(tokens, grid, theme) {
  const color = (role) => String(get(tokens, role));

  const system_colors = SYSTEM_COLORS.map((c) => ({
    _id: c._id,
    title: c.title,
    color: color(c.role),
  }));
  const custom_colors = CUSTOM_COLORS.map((c) => ({
    _id: hashId(`color:${c.title}`),
    title: c.title,
    color: color(c.role),
  }));

  const system_typography = SYSTEM_TYPOGRAPHY.map((t) => ({
    _id: t._id,
    title: t.title,
    ...typography(get(tokens, t.role)),
  }));
  const custom_typography = CUSTOM_TYPOGRAPHY.map((t) => ({
    _id: hashId(`type:${t.title}`),
    title: t.title,
    ...typography(get(tokens, t.role)),
  }));

  // Layout defaults from the grid + breakpoint tokens.
  const containerWidth = resolveContainer(tokens, grid);

  const settings = {
    system_colors,
    custom_colors,
    system_typography,
    custom_typography,
    container_width: parseDimension(containerWidth),
    viewport_md: parseDimension(String(get(tokens, 'breakpoint.md'))).size,
    viewport_lg: parseDimension(String(get(tokens, 'breakpoint.lg'))).size,
    // Every size as a kit-level CSS variable (Site Settings → Custom CSS, Pro):
    // templates reference var(--ios-…), so sizes are centrally editable.
    custom_css: cssVariables(tokens),
  };

  return {
    version: '0.4',
    title: `Impression OS — ${theme}`,
    type: 'kit',
    theme,
    settings,
  };
}

/**
 * The spatial system as kit-level CSS variables. Fluid tokens become clamp();
 * shadows come from the elevation roles. The `.ios-card` rule gives generated
 * cards their elevation without per-element custom CSS.
 */
function cssVariables(tokens) {
  const val = (path) => get(tokens, path);
  const dim = (path) => {
    const v = val(path);
    return isFluid(v) ? fluidToClamp(v) : String(v);
  };
  const lines = [
    `--ios-section-sm: ${dim('space.section.sm')};`,
    `--ios-section-md: ${dim('space.section.md')};`,
    `--ios-section-lg: ${dim('space.section.lg')};`,
    `--ios-gap-xs: ${dim('space.gap.xs')};`,
    `--ios-gap-sm: ${dim('space.gap.sm')};`,
    `--ios-gap-md: ${dim('space.gap.md')};`,
    `--ios-gap-lg: ${dim('space.gap.lg')};`,
    `--ios-gap-xl: ${dim('space.gap.xl')};`,
    `--ios-radius-control: ${dim('radius.control')};`,
    `--ios-radius-card: ${dim('radius.card')};`,
    `--ios-radius-surface: ${dim('radius.surface')};`,
    `--ios-inset-card: 28px;`,
    `--ios-page-inline: 20px;`,
    `--ios-shadow-raised: ${val('elevation.raised')};`,
    `--ios-shadow-overlay: ${val('elevation.overlay')};`,
    `--ios-shadow-modal: ${val('elevation.modal')};`,
  ];
  return `/* Impression OS design tokens — generated; edit tokens, not this block. */\n:root {\n  ${lines.join('\n  ')}\n}\n.ios-card { box-shadow: var(--ios-shadow-raised); }`;
}

/** Build Elementor typography settings from a resolved type style. */
function typography(style) {
  // Fluid font sizes ({min, max}) become clamp() via Elementor's custom unit.
  const size = isFluid(style.fontSize)
    ? { unit: 'custom', size: fluidToClamp(style.fontSize) }
    : (({ unit, size }) => ({ unit, size }))(parseDimension(style.fontSize));
  const tracking = parseDimension(style.letterSpacing);
  return {
    typography_typography: 'custom',
    typography_font_family: Array.isArray(style.fontFamily) ? style.fontFamily[0] : style.fontFamily,
    typography_font_weight: String(style.fontWeight),
    typography_font_size: size,
    typography_line_height: { unit: 'em', size: Number(style.lineHeight) },
    typography_letter_spacing: { unit: tracking.unit, size: tracking.size },
  };
}

/** Resolve the default container's max-width to a concrete dimension. */
function resolveContainer(tokens, grid) {
  const raw = grid.grid.container.default.maxWidth; // e.g. "{breakpoint.xl}"
  const m = String(raw).match(/^\{([a-zA-Z0-9._-]+)\}$/);
  return m ? String(get(tokens, m[1])) : String(raw);
}

function get(tokens, path) {
  if (!(path in tokens)) throw new Error(`Kit needs missing token: ${path}`);
  return tokens[path].value;
}
