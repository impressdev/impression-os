# Spacing — vertical rhythm

The law that governs vertical structure: the rhythm between elements and between
sections. Horizontal structure is governed separately by [grid](../grid/).

## The law

- **One baseline unit.** All vertical spacing is a multiple of the base unit
  (`space.1` = 4px). Nothing sits at a value the scale does not contain. This is
  what makes a page feel *tuned* rather than assembled.
- **Spacing comes from roles, not raw values.** Elements reference semantic
  spacing roles (`space.gap.*`, `space.inset.*`, `space.section.*`), so rhythm can
  be re-tuned system-wide from the token layer.
- **Sections breathe more than elements.** The gap *between* sections is an order
  of magnitude larger than the gap *within* a component. `space.section.*` exists
  precisely to keep that ratio deliberate.
- **Space is a grouping signal.** Related things sit closer; unrelated things sit
  further apart. Proximity communicates structure before any border or color does.

## The three roles

| Role | Question it answers | Scale |
| ---- | ------------------- | ----- |
| `space.inset.*`   | How much padding *inside* a surface? | xs → lg |
| `space.gap.*`     | How much space *between siblings*?   | xs → xl |
| `space.section.*` | How much air *between page sections*? | sm → lg |

## Structured contract

Machine-legible definition in [`rhythm.json`](rhythm.json): the baseline unit and
the section-spacing steps, as token references. The [`tests/`](../../tests/)
harness uses the baseline to verify that emitted spacing lands on the scale.

## Dependencies

References [`tokens/`](../../tokens/) only (primitive `space` + semantic `space`
roles). Consumed by [`components/`](../../components/) and
[`recipes/`](../../recipes/).
