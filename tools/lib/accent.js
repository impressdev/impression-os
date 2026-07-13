// @ts-check
/**
 * Deterministic mapping from a brief's brand direction to a concrete theme.
 * The planner uses this so accent wording ("trustworthy indigo") selects a
 * vetted ramp/theme rather than improvising a color.
 */

/**
 * Resolve an accent phrase to a primitive ramp name via the lexicon.
 * Longer keys win, so "sky blue" matches "sky" before "blue" only if it appears
 * first — matching is by first keyword found, longest keys tried first.
 * @param {string|undefined} accent @param {Record<string,string>} lexicon
 * @returns {string|null}
 */
export function resolveRamp(accent, lexicon) {
  if (!accent) return null;
  const text = accent.toLowerCase();
  const keys = Object.keys(lexicon).sort((a, b) => b.length - a.length);
  for (const word of keys) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return lexicon[word];
  }
  return null;
}

/**
 * Resolve a brief to a theme name that exists in the manifest.
 * @param {any} brief
 * @param {{available:string[], defaultTheme:string, themeRamps:Record<string,string>, lexicon:Record<string,string>}} ctx
 * @returns {{theme:string, ramp:string|null, via:string, hint?:string}}
 */
export function resolveTheme(brief, ctx) {
  const requested = brief?.brand?.theme;
  if (requested && ctx.available.includes(requested)) {
    return { theme: requested, ramp: ctx.themeRamps[requested] ?? null, via: 'brief.brand.theme' };
  }

  const ramp = resolveRamp(brief?.brand?.accent, ctx.lexicon);
  if (ramp) {
    // Prefer a brand.* theme built on this ramp; then any theme on this ramp.
    const brandMatch = ctx.available.find((t) => t.startsWith('brand.') && ctx.themeRamps[t] === ramp);
    const anyMatch = brandMatch ?? ctx.available.find((t) => ctx.themeRamps[t] === ramp);
    if (anyMatch) return { theme: anyMatch, ramp, via: `accent "${brief.brand.accent}" → ${ramp} ramp` };
    return {
      theme: ctx.defaultTheme,
      ramp,
      via: `accent "${brief.brand.accent}" → ${ramp} ramp, but no theme uses it yet`,
      hint: `impression theme ${ramp} --accent ${ramp}`,
    };
  }

  return { theme: ctx.defaultTheme, ramp: null, via: 'default (no theme or accent match)' };
}
