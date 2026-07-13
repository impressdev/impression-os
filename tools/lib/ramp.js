// @ts-check
/**
 * Synthesize a full 50–950 color ramp from a single brand hex, so a client can
 * supply one color and get a coherent, tokenizable ramp. The ramp keeps the seed
 * hue and (scaled) saturation and imposes a fixed lightness curve — the same
 * shape as the vetted primitive ramps. Downstream, the theme generator still
 * picks steps by contrast, so a synthesized ramp is held to the same AA contract.
 */

/** Target lightness per step (0–1). */
const L = { 50: 0.97, 100: 0.93, 200: 0.86, 300: 0.76, 400: 0.66, 500: 0.56, 600: 0.48, 700: 0.40, 800: 0.32, 900: 0.25, 950: 0.16 };
/** Saturation scale per step (lighter steps read cleaner slightly desaturated). */
const S = { 50: 0.8, 100: 0.85, 200: 0.9, 300: 0.95, 400: 1, 500: 1, 600: 1, 700: 1, 800: 1.02, 900: 1.05, 950: 1.05 };

/**
 * @param {string} hex e.g. "#7c3aed" or "7c3aed"
 * @returns {Record<string,string>} step → "#rrggbb"
 */
export function synthesizeRamp(hex) {
  const { h, s } = hexToHsl(hex);
  /** @type {Record<string,string>} */
  const ramp = {};
  for (const step of Object.keys(L)) {
    const sat = clamp01(s * S[step]);
    ramp[step] = hslToHex({ h, s: sat, l: L[step] });
  }
  return ramp;
}

/** @param {string} hex @returns {{h:number,s:number,l:number}} */
export function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Invalid hex color: "${hex}"`);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** @param {{h:number,s:number,l:number}} hsl @returns {string} "#rrggbb" */
export function hslToHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function clamp01(n) { return Math.max(0, Math.min(1, n)); }
