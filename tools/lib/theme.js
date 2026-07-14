// @ts-check
import { contrastRatio } from './contrast.js';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const SURFACE = { light: '#ffffff', dark: '#020617' }; // surface.page per base
const WHITE = '#ffffff';
const AA_TEXT = 4.5;
const AA_NONTEXT = 3.0;

/**
 * Generate a brand theme as a DELTA over a base theme (light | dark). The accent
 * and link steps are chosen by contrast so the result is guaranteed to meet
 * WCAG 2.1 AA — accessibility as a contract, enforced at generation time.
 *
 * @param {any} colorDoc  parsed tokens/primitives/color.json
 * @param {{name:string, accent:string, base?:string}} opts
 * @returns {{ theme:any, choices:Record<string,number|string> }}
 */
export function generateBrandTheme(colorDoc, { name, accent, base = 'light' }) {
  const ramp = colorDoc.color?.[accent];
  if (!ramp) throw new Error(`Unknown color ramp "${accent}" (add it to tokens/primitives/color.json)`);
  if (!(base in SURFACE)) throw new Error(`base must be "light" or "dark"`);
  const hex = (step) => {
    const v = ramp[String(step)]?.$value;
    if (!v) throw new Error(`ramp "${accent}" has no step ${step}`);
    return v;
  };
  const clamp = (step) => STEPS[Math.max(0, Math.min(STEPS.length - 1, STEPS.indexOf(step)))];
  const shift = (step, by) => STEPS[Math.max(0, Math.min(STEPS.length - 1, STEPS.indexOf(step) + by))];

  // Accent fill: white label must meet AA. Prefer a vivid-but-deep step.
  const accentStep = firstPassing([600, 700, 800, 900], (s) => contrastRatio(WHITE, hex(s)) >= AA_TEXT)
    ?? fail(`ramp "${accent}" cannot carry a white label at AA`);
  const hoverStep = shift(accentStep, 1);
  const activeStep = shift(accentStep, 2);
  const subtleStep = base === 'dark' ? 950 : 50;

  // Link on the page surface must meet AA.
  const linkCandidates = base === 'dark' ? [300, 400, 200, 100, 50] : [700, 600, 800, 900, 950];
  const linkStep = firstPassing(linkCandidates, (s) => contrastRatio(hex(s), SURFACE[base]) >= AA_TEXT)
    ?? fail(`ramp "${accent}" cannot provide an AA link color on the ${base} surface`);

  // Focus ring: non-text ≥ 3:1 on the page surface.
  const focusCandidates = base === 'dark' ? [400, 300, 500, 200, 100] : [500, 600, 700, 800, 900];
  const focusStep = firstPassing(focusCandidates, (s) => contrastRatio(hex(s), SURFACE[base]) >= AA_NONTEXT)
    ?? fail(`ramp "${accent}" cannot provide an AA focus ring on the ${base} surface`);

  const ref = (step) => `{color.${accent}.${clamp(step)}}`;

  const theme = {
    $description: `Brand theme "${name}" — generated delta over the ${base} theme; accent ramp "${accent}". Accent and link steps chosen by contrast to meet WCAG 2.1 AA.`,
    $extends: base,
    color: {
      $type: 'color',
      accent: {
        default: { $value: ref(accentStep) },
        hover: { $value: ref(hoverStep) },
        active: { $value: ref(activeStep) },
        subtle: { $value: ref(subtleStep) },
        onAccent: { $value: '{color.white}' },
      },
      text: { link: { $value: ref(linkStep) } },
      border: { focus: { $value: ref(focusStep) } },
    },
  };

  return {
    theme,
    choices: {
      base, accent,
      accentStep, hoverStep, activeStep, subtleStep, linkStep, focusStep,
      accentContrast: round(contrastRatio(WHITE, hex(accentStep))),
      linkContrast: round(contrastRatio(hex(linkStep), SURFACE[base])),
    },
  };
}

function firstPassing(list, pred) {
  for (const x of list) if (pred(x)) return x;
  return undefined;
}
function fail(msg) { throw new Error(msg); }
function round(n) { return Math.round(n * 100) / 100; }
