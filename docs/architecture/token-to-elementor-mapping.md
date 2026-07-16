# Token → Elementor Pro mapping strategy

How the token layer becomes Elementor Pro **global styles**. This is a *strategy*
document — it defines the target mapping so tokens are authored with the
destination in mind. The [`builder/`](../../builder/) implements it in
[Phase 5](../../ROADMAP.md#phase-5--builder-the-compiler); nothing here is code
yet.

## The principle

Elementor Pro has its own global-styles system (the **Site Settings / Kit**):
Global Colors, Global Fonts, and default typography/spacing. Impression OS does
**not** fight this system — it *feeds* it. The tokens are the source; the
Elementor kit is a compiled projection of them. A designer who later opens the
site in Elementor sees clean, named globals, not a wall of inline overrides.

## What maps to what

| Token layer | Elementor Pro target |
| ----------- | -------------------- |
| Semantic **color** roles for the active theme (`color.accent.default`, `color.text.default`, `color.surface.page`, …) | **Global Colors** (named entries in the Kit) |
| Semantic **type styles** (`text.h1`, `text.body`, …) | **Global Fonts** + default typography per heading/text tag |
| **Space** roles (`space.section.*`, `space.inset.*`) | Section/container padding & gap defaults |
| **Radius** roles (`radius.control`, `radius.card`) | Default border-radius on the matching widgets |
| **Shadow** / elevation roles | Box-shadow defaults on cards and floating elements |
| **Breakpoints** | Kit responsive breakpoint configuration |
| **All sizes** (section rhythm, gaps, radius, insets, elevation shadows) | Kit **Custom CSS** (Pro): a generated `:root { --ios-… }` block; templates reference `var(--ios-…)` via Elementor's custom unit, so sizes are centrally editable in Site Settings |

Primitives are **not** mapped directly. Only *semantic* roles reach Elementor —
because only semantic roles carry intent, and only they should appear as named
globals a human will recognise.

## Resolution flow

```
active theme (e.g. light)
   └─ resolve semantic color roles → concrete hex
theme-independent semantics
   └─ resolve type / space / radius / shadow roles → concrete values
            │
            ▼
   Elementor Pro Kit
     • Global Colors      (from color roles)
     • Global Fonts       (from type styles)
     • Layout defaults    (space / radius / shadow / breakpoints)
```

## Naming

Global Colors and Fonts in the kit take **human-readable names derived from the
role**, not the primitive — e.g. `Accent`, `Text`, `Text Muted`, `Surface`,
`Heading 1`. This keeps the Elementor UI legible and stable across brand
re-themes: the *name* stays `Accent` while its *value* changes with the theme.

## Guarantees the builder must uphold

1. **Determinism.** The same theme + token version produces the same kit.
2. **No orphans.** Every global the builder writes is referenced; nothing dangles.
3. **Editability.** Output is a normal Elementor kit — fully editable, no custom
   runtime, no lock-in ([PROJECT.md](../../PROJECT.md), principle 5).
4. **Traceability.** Every emitted value traces back to exactly one token.

## Open questions (to resolve in Phase 5)

- Exact kit JSON schema/version targeted, and how theme switching is represented
  (one kit per theme vs. a single kit with palette variants).
- Whether dark mode ships as a separate kit or via a class-based strategy.
- How composite `typography` tokens best fold into Elementor's per-tag typography.

See [ADR-0001](../decisions/0001-adopt-dtcg-token-format.md) for the token format
these mappings consume.
