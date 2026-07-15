# ADR-0010 — Fluid tokens (clamp-based responsive scale)

- **Status:** Accepted
- **Date:** 2026-07-15
- **Deciders:** Impression OS core
- **Phase:** Post-roadmap (inspired by the *Fluid Design System for Elementor* plugin)

## Context

Static tokens gave every viewport the same type sizes and section rhythm, with
responsive behavior limited to grid-column fallbacks. The "Fluid Design System
for Elementor" plugin popularized a better technique: min→max presets compiled
to CSS `clamp()`, exposed as a *fluid* unit in Elementor controls. The question
was whether to depend on that plugin or make the technique native to the token
layer.

## Decision

Make it **native**. A dimension token's `$value` may be `{ "min": …, "max": … }`
(sides are references or literals; the resolver already dereferences object
values recursively):

- **What is fluid:** the heading scale (`text.display`, `h1`–`h3` font sizes)
  and the section rhythm (`space.section.sm/md/lg`). Body/lead/small text stays
  static for readability; gaps stay static for now.
- **Emission:** `builder/src/fluid.js` computes a deterministic
  `clamp(MINrem, Arem + Bvw, MAXrem)` interpolating between 375px and 1280px
  viewports, rem-anchored so text remains user-scalable. The kit emits fluid
  global fonts via Elementor's **custom unit** (`typography_font_size:
  {unit:'custom', size:'clamp(…)'}`); section shells emit fluid padding the same
  way (custom-unit dimensions hold raw CSS per side). The HTML preview passes
  `clamp()` through natively.
- **No plugin dependency:** the generated kit needs only stock Elementor
  (custom units exist since ~3.10). Sites remain fully editable; an editor sees
  the clamp expression in the control.

## Consequences

**Positive**

- Every generated site scales its typography and rhythm smoothly across
  viewports — verified live in Elementor: h1 30px→48px and hero padding
  80px→128px between 375px and 1440px, matching the token min/max exactly.
- The technique lives in the design system (deterministic, tested, themable)
  instead of per-element editor work.

**Costs / trade-offs**

- Elementor's responsive *device* overrides for these values become less
  relevant (the fluid value already adapts); mixing manual per-device overrides
  with fluid values is possible but should be avoided.
- The interpolation window (375→1280) is a system constant for now; making it
  token-configurable is a straightforward follow-up.

Builds on ADR-0001 (token format) and the styling-fidelity work (real Elementor
control names).
