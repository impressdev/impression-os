# Adding a recipe

A recipe is a complete section composed from components, specified against
[`recipes/schema/recipe.schema.json`](../../recipes/schema/recipe.schema.json).

## Steps

1. **Create the spec** at `recipes/sections/<name>.json` (or `recipes/chrome/` for
   header/footer-like frames). Use an existing one as a model —
   [`feature-grid.json`](../../recipes/sections/feature-grid.json) shows a repeat;
   [`hero.json`](../../recipes/sections/hero.json) shows nested regions. Fill:
   - `name`, `category` (`section` | `chrome`), `description`, `landmark`.
   - `container` (`default` | `wide` | `full`) and `sectionSpacing`.
   - `layout` — a `primitive` from [foundation/hierarchy](../../foundation/hierarchy/)
     (stack, cluster, grid, center, cover, split) and `regions`. **Regions nest;
     `components` lists real component references only** (optionally with `?` or
     `:variant`). A `repeat: true` region renders once per item of the recipe's
     primary list content field.
   - `content` — the **content contract**: each field's `type`, whether it is
     `required`, and (for lists) the item shape via `of`.
   - `responsive`, `components` (dependencies), `a11y`, and `elementor` (**both
     required**).

2. **Keep composition honest.** Reference components; never restyle them inline.
   Source order is reading, tab, and mobile-stacking order — so one `h1` per page
   (only the hero owns it); sections use `h2`/`h3`.

3. **Add it to a blueprint** in
   [`prompts/planning/blueprints.json`](../../prompts/planning/blueprints.json) so
   the planner can place it, and list it in the
   [sections catalog](../../recipes/sections/README.md).

## Verify

```bash
node tools/bin/impression.js validate   # schema + every component reference resolves
```

Then prove it builds — add a case to
[`tests/recipes.test.mjs`](../../tests/recipes.test.mjs) that compiles a plan using
the recipe and asserts the emitted widgets, and run:

```bash
node --test
```

See [ADR-0004](../decisions/0004-recipe-composition-model.md) for the model.
