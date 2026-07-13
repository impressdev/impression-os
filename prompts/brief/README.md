# Brief

The structured **client intent** a site is generated from. A brief captures who
the client is, what the site must achieve, the brand direction, and — crucially —
all the **raw content**. The system composes; it does not write copy.

## Files

- [`brief.schema.json`](brief.schema.json) — the contract for a well-formed brief.
- [`example.brief.json`](example.brief.json) — a complete, realistic brief
  ("Northwind") used as a reference and test fixture.

## Shape

```jsonc
{
  "business": { "name": "...", "description": "...", "tone": "..." },
  "goals":    { "primary": "...", "secondary": ["..."] },
  "audience": "...",
  "brand":    { "theme": "light", "accent": "...", "logo": "...", "voice": "..." },
  "pages":    [{ "type": "landing", "path": "/" }],
  "content":  { "valueProposition": "...", "primaryCta": {…}, "features": [...], … }
}
```

## Principles

- **Content lives in the brief.** Every headline, feature, price, and quote is
  provided here. The planner assigns this content to sections; it never invents
  copy.
- **Brand direction is words, not values.** `brand.accent` is a description
  ("trustworthy indigo"), mapped to an *existing* theme — never an inline color.
- **The brief is validated input.** It is checked against the schema before the
  planner runs, so planning starts from well-formed intent.

The planner turns a brief into a [build plan](../planning/); see
[the guardrails](../guardrails/) for the rules that keep that transformation
inside the system.

## Status

✅ Implemented — see [Phase 6](../../ROADMAP.md#phase-6--prompts-the-intent-layer).
