# Adding a token

A token is a named design value and the single source of truth for it. Add one
when a value will be reused and isn't already expressible.

## Where it goes

| Kind of value | File |
| ------------- | ---- |
| Raw, theme-independent (a color step, a space unit, a type size) | `tokens/primitives/*.json` |
| A theme-independent **role** (a type style, a radius role, an elevation role) | `tokens/semantic/*.json` |
| A theme-dependent **color role** | `tokens/themes/*.json` |

Rule of thumb: **primitives hold literals; semantic and theme layers hold
`{references}` to them.** Nothing above primitives may contain a raw value.

## Steps

1. **Add the primitive** (if the raw value is new). Follow the
   [W3C Design Tokens](https://tr.designtokens.org/format/) shape used throughout —
   a `$value`, an optional `$type` (inherited from the group), and a `$description`:

   ```json
   { "space": { "$type": "dimension", "72": { "$value": "18rem" } } }
   ```

2. **Expose it as a semantic role** if consumers should reference intent, not the
   literal. Reference the primitive:

   ```json
   { "space": { "section": { "xl": { "$value": "{space.72}" } } } }
   ```

3. **Keep the manifest honest.** If you added a *new file*, list it under the right
   layer in [`tokens/manifest.json`](../../tokens/manifest.json) (in resolution
   order: primitives → semantic → themes). Editing an existing file needs no
   manifest change.

## Binding rules for consumers

- Color, typography, radius, elevation, and stacking bind to **semantic** roles.
- **Spacing** binds to the spacing scale (`{space.4}`) — it *is* the canonical
  vocabulary. (See [ADR-0003](../decisions/0003-component-specification-format.md).)

## Verify

```bash
node tools/bin/impression.js validate   # schema + every {reference} resolves
node --test tests/accessibility.test.mjs # if you touched color, contrast still holds
```

Green means the token is well-formed and everything that references it resolves.
See the [tokens README](../../tokens/README.md) and
[ADR-0001](../decisions/0001-adopt-dtcg-token-format.md) for the full model.
