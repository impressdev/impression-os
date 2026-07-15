// @ts-check
import { parseDimension } from './util.js';

/**
 * Fluid dimensions: a token whose value is { min, max } scales smoothly with
 * the viewport via CSS clamp() — the technique popularized by fluid design
 * systems for Elementor, here generated natively from the token layer.
 *
 * The scale interpolates between two viewports (defaults: 375px → 1280px,
 * the sm phone and the xl container). The middle term is `Arem + Bvw`, so the
 * result stays user-scalable (rem-anchored) while tracking the viewport.
 */

const FROM_VW = 375;
const TO_VW = 1280;
const REM = 16;

/** True when a resolved token value is a fluid { min, max } dimension. */
export function isFluid(v) {
  return v != null && typeof v === 'object' && 'min' in v && 'max' in v;
}

/**
 * A CSS clamp() expression for a fluid value. Accepts CSS dimensions (rem/px)
 * for min and max; output is deterministic (fixed 4-decimal rounding).
 * @param {string} minCss @param {string} maxCss @returns {string}
 */
export function clampExpr(minCss, maxCss) {
  const minPx = toPx(minCss);
  const maxPx = toPx(maxCss);
  if (maxPx === minPx) return cssRem(minPx);
  // linear interpolation: value(vw) = A + B * (viewport / 100)
  const slope = (maxPx - minPx) / (TO_VW - FROM_VW);       // px per viewport-px
  const B = round(slope * 100);                             // vw coefficient
  const A = round((minPx - slope * FROM_VW) / REM);         // rem intercept
  const mid = `${A}rem + ${B}vw`;
  return `clamp(${cssRem(minPx)}, ${mid}, ${cssRem(maxPx)})`;
}

/** clampExpr for a fluid token value object. */
export function fluidToClamp(v) {
  return clampExpr(String(v.min), String(v.max));
}

function toPx(css) {
  const d = parseDimension(css);
  return d.unit === 'rem' || d.unit === 'em' ? d.size * REM : d.size;
}
function cssRem(px) { return `${round(px / REM)}rem`; }
function round(n) { return Math.round(n * 10000) / 10000; }
