# Adding a component

A component is an atomic UI unit, specified as **data** against
[`components/schema/component.schema.json`](../../components/schema/component.schema.json).
The builder compiles it to an Elementor widget; the harness validates it.

## Steps

1. **Create the spec** at `components/primitives/<name>.json` (or
   `components/composites/<name>.json` if it composes other components). Copy the
   shape of an existing one — [`button.json`](../../components/primitives/button.json)
   is the reference. Fill:
   - `name` (kebab-case), `category` (`primitive` | `composite`), `description`.
   - `anatomy` — the named parts, in source order.
   - `props` — the inputs that vary (`enum` | `boolean` | `string` | `number`).
   - `base` / `variants` / `states` — **part-keyed** style maps; every value is a
     token reference or a law-constant literal.
   - `a11y` — role, `nameFrom`, focus behavior, contrast note (**required**).
   - `elementor` — the widget it compiles to (**required**).
   - `dependencies` — for composites, the components it uses.

2. **Bind to tokens, not literals.** Color/typography/radius/elevation → semantic
   roles; spacing → the spacing scale. Interactive components must define `focus`
   and `disabled` states.

3. **Teach the builder** (only if the component needs bespoke rendering). Most map
   cleanly to a single widget via [`template.js`](../../builder/src/template.js)'s
   `bindComponent`. Add a `case` there if it needs special handling (e.g. `stat`
   emits a value + label; `form-field` expands a fields list into one form widget).

4. **List it** in the relevant catalog README
   ([primitives](../../components/primitives/README.md) /
   [composites](../../components/composites/README.md)).

## Verify

```bash
node tools/bin/impression.js validate     # schema + no primitive color/font in components
node tools/bin/impression.js list components
node --test                               # full harness
```

If the component is used by a recipe, add a build assertion to
[`tests/recipes.test.mjs`](../../tests/recipes.test.mjs). See
[ADR-0003](../decisions/0003-component-specification-format.md) for the rationale.
