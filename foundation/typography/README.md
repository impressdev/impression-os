# Typography — the typographic system

The law that governs type: how the scale is applied, how long a line may run, and
how headings map to structure.

## The law

- **Use the named type styles.** Text is set with the semantic type styles
  (`text.display`, `text.h1…h4`, `text.lead`, `text.body`, `text.small`,
  `text.caption`, `text.code`) — never a loose combination of raw font tokens.
  Each style is a decided, tested pairing of family, size, weight, line-height,
  and tracking.
- **Respect the measure.** Body text targets **60–75 characters per line**
  (`ideal` 65ch). Too long and the eye loses the return; too short and rhythm
  breaks. Reading width is set by the measure, not by a grid column count.
- **Line-height scales inversely with size.** Display and headings are set tight;
  body is set open. The type styles already encode this — do not override it.
- **Structure follows the outline, not the look.** Heading *level* is chosen by
  document structure (one `h1`, no skipped levels); heading *style* is chosen for
  emphasis. When a heading needs to look smaller, change its style, never its
  level. This keeps the accessible outline intact — see
  [accessibility](../accessibility/).

## Heading map

The default mapping from document level to type style. Levels beyond `h4` are
discouraged in marketing layouts; prefer `h4` plus a `caption` eyebrow.

| Level | Type style |
| ----- | ---------- |
| `h1`  | `text.h1`  |
| `h2`  | `text.h2`  |
| `h3`  | `text.h3`  |
| `h4`  | `text.h4`  |

`text.display` is reserved for a single hero headline and is not tied to a level.

## Structured contract

Machine-legible definition in [`type-system.json`](type-system.json): the measure
targets and the level→style map (token references). The [`builder/`](../../builder/)
uses this to set Elementor's per-tag typography; [`tests/`](../../tests/) uses the
measure to flag over-wide text blocks.

## Dependencies

References [`tokens/`](../../tokens/) only (semantic `text` styles). Consumed by
[`components/`](../../components/) and [`recipes/`](../../recipes/).
