# Accessibility — the contracts

Accessibility in Impression OS is a **contract**, not a review step. The rules
below are enforced by the system: components and recipes must satisfy them, and
the [`tests/`](../../tests/) harness fails any output that does not. The baseline
is **WCAG 2.1 AA**.

## Contrast

- **Normal text** ≥ **4.5:1** against its background.
- **Large text** (≥ 24px, or ≥ 18.66px bold) ≥ **3:1**.
- **Non-text** — UI component boundaries, icons, focus rings, meaningful
  graphics — ≥ **3:1**.

The semantic color roles in [`tokens/themes/`](../../tokens/themes/) are chosen to
meet these ratios against their intended surfaces; the harness verifies every
role pairing the builder actually emits.

## Semantics

- **Landmarks.** Every page exposes `header`, `nav`, `main`, and `footer`.
- **Heading order.** Exactly one `h1` per page; no skipped levels. Heading *style*
  may vary for emphasis, but the *outline* stays intact (see
  [typography](../typography/)).
- **Images.** Meaningful images carry descriptive `alt`; decorative images carry
  empty `alt` so assistive tech skips them.
- **Names.** Every interactive control has an accessible name (visible label,
  `aria-label`, or labelled-by).

## Focus

- **Always visible.** Focus is never removed. The focus ring uses
  `color.border.focus` and meets the non-text contrast rule.
- **Order follows reading order.** Tab order matches DOM/source order — which is
  the same as the mobile stacking order (see [hierarchy](../hierarchy/)).
- **Trapped where it must be.** Modals and drawers trap focus while open and
  restore it to the trigger on close.

## Target size

- **Minimum 24×24px** for any pointer target (WCAG 2.1 AA, 2.5.8).
- **44×44px recommended** for primary touch targets.
- Adjacent targets are separated by at least `space.2`.

## Motion

- **Respect `prefers-reduced-motion`.** Non-essential motion is reduced or removed
  when the user asks for it.
- **No unexpected autoplay.** No autoplaying audio; carousels and video are
  pausable.
- **No seizure risk.** Nothing flashes more than three times per second.

## Structured contract

The machine-legible form lives in [`contracts.json`](contracts.json) — thresholds
and rules the [`tests/`](../../tests/) harness reads directly, so "accessible"
is a checked property rather than an opinion.

## Dependencies

References [`tokens/`](../../tokens/) (focus color, target spacing). Binds every
layer above [`foundation/`](../).
