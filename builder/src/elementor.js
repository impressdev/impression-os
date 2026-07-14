// @ts-check
import { hashId, parseDimension } from './util.js';

/**
 * Elementor element factories. Every element gets a deterministic id derived
 * from its unique path in the tree, so builds are byte-stable. Setting names
 * follow Elementor's real controls (verified against the plugin source):
 * flex group → flex_direction / flex_gap / flex_wrap / flex_align_items /
 * flex_justify_content; grid group → grid_columns_grid / grid_gaps /
 * grid_auto_flow; plus padding / background_color / border_* dimensions.
 */

/** @param {string} path @param {object} settings @param {any[]} elements */
export function container(path, settings, elements = []) {
  return { id: hashId(path), elType: 'container', settings, elements, isInner: elements.length > 0 };
}

/** @param {string} path @param {string} widgetType @param {object} settings */
export function widget(path, widgetType, settings) {
  return { id: hashId(path), elType: 'widget', widgetType, settings, elements: [] };
}

/** An Elementor gap value from a CSS dimension. */
export function gapValue(cssDim) {
  const d = parseDimension(cssDim);
  const px = d.unit === 'rem' || d.unit === 'em' ? Math.round(d.size * 16) : d.size;
  return { column: String(px), row: String(px), isLinked: true, unit: 'px', size: px };
}

/** An Elementor dimensions value (padding/margin/border_width/border_radius). */
export function dimensions(top, right = top, bottom = top, left = right) {
  return { unit: 'px', top: String(top), right: String(right), bottom: String(bottom), left: String(left), isLinked: top === right && right === bottom && bottom === left };
}

/** An Elementor slider value. */
export function slider(size, unit = 'px') {
  return { unit, size, sizes: [] };
}

/**
 * Flex/grid settings for an Elementor container derived from a foundation
 * layout primitive.
 * @param {string} primitive @param {{gap?:string, columns?:number, align?:string}} opts
 */
export function layoutSettings(primitive, opts = {}) {
  const gap = gapValue(opts.gap ?? '16px');
  /** @type {Record<string, any>} */
  const base = { flex_gap: gap };
  switch (primitive) {
    case 'stack':
      return { ...base, flex_direction: 'column' };
    case 'cluster':
      return { ...base, flex_direction: 'row', flex_wrap: 'wrap', flex_align_items: 'center' };
    case 'grid': {
      const n = opts.columns ?? 3;
      return {
        container_type: 'grid',
        grid_columns_grid: slider(n, 'fr'),
        grid_columns_grid_tablet: slider(Math.min(2, n), 'fr'),
        grid_columns_grid_mobile: slider(1, 'fr'),
        grid_gaps: gap,
        grid_auto_flow: 'row',
      };
    }
    case 'center':
      return { ...base, flex_direction: 'column', flex_align_items: 'center' };
    case 'cover':
      return { ...base, flex_direction: 'column', flex_justify_content: 'center', min_height: slider(80, 'vh') };
    case 'split':
      return { ...base, flex_direction: 'row', flex_align_items: 'center' };
    default:
      return { ...base };
  }
}
