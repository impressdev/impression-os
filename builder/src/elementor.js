// @ts-check
import { hashId, parseDimension } from './util.js';

/**
 * Elementor element factories. Every element gets a deterministic id derived
 * from its unique path in the tree, so builds are byte-stable.
 */

/** @param {string} path @param {object} settings @param {any[]} elements */
export function container(path, settings, elements = []) {
  return { id: hashId(path), elType: 'container', settings, elements, isInner: elements.length > 0 };
}

/** @param {string} path @param {string} widgetType @param {object} settings */
export function widget(path, widgetType, settings) {
  return { id: hashId(path), elType: 'widget', widgetType, settings, elements: [] };
}

/**
 * Flex/grid settings for an Elementor container derived from a foundation
 * layout primitive.
 * @param {string} primitive @param {{gap?:string, columns?:number, align?:string}} opts
 */
export function layoutSettings(primitive, opts = {}) {
  const gap = opts.gap ? { column: String(parseDimension(opts.gap).size), row: String(parseDimension(opts.gap).size), unit: parseDimension(opts.gap).unit, isLinked: true } : undefined;
  /** @type {Record<string, any>} */
  const base = gap ? { flex_gap: gap } : {};
  switch (primitive) {
    case 'stack':
      return { ...base, flex_direction: 'column' };
    case 'cluster':
      return { ...base, flex_direction: 'row', flex_wrap: 'wrap', align_items: 'center' };
    case 'grid':
      return { ...base, container_type: 'grid', grid_template_columns: `repeat(${opts.columns ?? 3}, 1fr)` };
    case 'center':
      return { ...base, flex_direction: 'column', align_items: 'center' };
    case 'cover':
      return { ...base, flex_direction: 'column', justify_content: 'center', min_height: { unit: 'vh', size: 100 } };
    case 'split':
      return { ...base, flex_direction: 'row', align_items: 'center' };
    default:
      return { ...base };
  }
}
