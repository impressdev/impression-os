# Hierarchy & layout primitives

The law that governs *emphasis* and *arrangement*: how a viewer's eye is guided,
and the small set of layout patterns everything is built from.

## The law of hierarchy

- **One primary action per view.** Each section — and the page as a whole — has a
  single clear primary action. Secondary actions are visibly subordinate. If
  everything is emphasised, nothing is.
- **Emphasis is earned with contrast, size, and space — in that order.** Reach for
  weight and whitespace before color. Color is the loudest signal and is spent
  last, on the thing that matters most (usually the accent action).
- **Group by proximity first.** Related elements are placed close together before
  any divider, box, or background is considered. Structure should be legible with
  the styling stripped away.
- **Read top-to-bottom, important-to-incidental.** The most important content and
  action appear first in the source order — which is also the reading order, the
  tab order, and the mobile stacking order.

## Layout primitives

Every layout in the system composes from a small, named vocabulary of primitives.
Recipes and components arrange these; they do not invent bespoke layouts. Gaps are
drawn from spacing roles.

| Primitive | Purpose | Default gap |
| --------- | ------- | ----------- |
| **stack**   | Vertical flow of related elements. | `space.gap.md` |
| **cluster** | Wrapping row of inline items (tags, buttons, meta). | `space.gap.sm` |
| **grid**    | Responsive multi-column layout on the 12-column [grid](../grid/). | grid gutter |
| **center**  | Horizontally centered content capped at the measure. | — |
| **cover**   | Full-height region with vertically centered content (heroes). | — |
| **split**   | Two-panel layout (content + media) that stacks on small screens. | `space.gap.lg` |

The structured definition lives in [`primitives.json`](primitives.json). These
primitives become the shared basis for [`components/`](../../components/) and
[`recipes/`](../../recipes/) in later phases.

## Dependencies

References [`tokens/`](../../tokens/) (semantic `space` roles) and the
[grid](../grid/) law. Consumed by [`components/`](../../components/) and
[`recipes/`](../../recipes/).
