# Guides

Practical, step-by-step how-tos for extending Impression OS. Each guide ends with
the same promise: run the harness, and if it is green, your change is correct by
the system's own definition.

| Guide | When to use it |
| ----- | -------------- |
| [Adding a token](adding-a-token.md)         | A new design value (color, space, type, radius, shadow). |
| [Adding a component](adding-a-component.md)  | A new atomic UI unit (button, card, …). |
| [Adding a recipe](adding-a-recipe.md)        | A new composed section (hero, pricing, …). |
| [Adding a theme](adding-a-theme.md)          | A new brand/light/dark theme. |

## The golden rules (from [CLAUDE.md](../../CLAUDE.md))

1. **Compose from the system; never improvise design values.** If you type a raw
   hex or pixel value above the token layer, stop — it belongs in a token.
2. **Depend only downward:** `prompts → recipes → components → foundation → tokens`.
3. **Document as you build**, and **ship the test with the feature.**

## The one command that checks everything

```bash
node --test                       # the full harness (schema, refs, a11y, determinism, guardrails, regression)
node tools/bin/impression.js validate   # a fast schema + reference check
```

If both are green, your change respects every contract the system enforces.
