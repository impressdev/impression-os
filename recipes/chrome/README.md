# Chrome recipes

The persistent frame around a site's content: the header and footer. Specified
against [`../schema/recipe.schema.json`](../schema/recipe.schema.json) like any
recipe, but categorised as `chrome` because they wrap pages rather than sit within
one.

| Recipe | Landmark | Purpose |
| ------ | -------- | ------- |
| [`announcement-bar`](announcement-bar.json) | `region` | Slim message + optional link above the header. |
| [`header`](header.json) | `banner` | Brand, primary navigation, and a prominent action. |
| [`footer`](footer.json) | `contentinfo` | Brand, grouped link columns, and a legal row. |

## Conventions

- **Landmarks are explicit.** The header is the `banner`, the footer is
  `contentinfo`, and their navigation is exposed as `nav` landmarks.
- **Navigation state is accessible.** The current page's nav item sets
  `aria-current`; the mobile menu toggle exposes `aria-expanded`.
- **Chrome sets its own rhythm.** Header uses `compact` section spacing; it does
  not inherit a section's `spacious` rhythm.

## Status

✅ Implemented (draft) — see
[Phase 4](../../ROADMAP.md#phase-4--recipes-composed-sections).
