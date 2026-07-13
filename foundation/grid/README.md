# Grid — the spatial system

The law that governs horizontal structure: how wide content is allowed to be, how
it is divided, and how much air surrounds it. Vertical rhythm is governed
separately by [spacing](../spacing/).

## The law

- **Twelve columns.** Content is laid out on a 12-column grid. Twelve divides
  cleanly into halves, thirds, quarters, and sixths — enough flexibility for any
  marketing layout without inviting arbitrary splits.
- **Content is capped, the page is not.** Sections may run full-bleed
  edge-to-edge, but their *content* is always constrained to a container width.
  Text never spans an unbounded viewport.
- **Gutters and margins scale with the viewport.** Breathing room grows as the
  screen grows, in discrete steps drawn from the spacing scale — never ad hoc.
- **Reading width is a typographic concern.** Long-form text uses the measure
  defined in [typography](../typography/), not a grid column count.

## Containers

| Container | Max width | Use |
| --------- | --------- | --- |
| `default` | `breakpoint.xl` (1280px) | Standard section content. |
| `wide`    | `breakpoint.2xl` (1536px) | Media-forward or full-width feature sections. |
| `full`    | 100% | Backgrounds and full-bleed section shells (inner content still uses a capped container). |

Container widths reference **breakpoint tokens** rather than introducing new raw
values, so the grid and the responsive system stay in lockstep.

## Structured contract

Machine-legible definition in [`grid.json`](grid.json): column count, and the
responsive gutter, margin, and container values (each a token reference). The
[`builder/`](../../builder/) reads this when emitting Elementor container and
column defaults; the [`tests/`](../../tests/) harness reads it to verify emitted
layouts stay on the grid.

## Dependencies

References [`tokens/`](../../tokens/) only (space + breakpoint). Consumed by
[`components/`](../../components/) and [`recipes/`](../../recipes/).
