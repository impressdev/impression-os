# Planner — task prompt

> The instruction prompt paired with [`system.md`](system.md). Placeholders in
> `{{double braces}}` are filled by the caller at runtime.

---

Convert the following client brief into an Impression OS build plan.

## Brief

```json
{{brief}}
```

## Available blueprints

```json
{{blueprints}}
```

## Recipe content contracts

For each recipe below, fill its required content fields from the brief. Drop any
section whose required content the brief does not supply.

```json
{{recipe_content_contracts}}
```

## Task

1. Select the theme (per the rules in the system prompt).
2. For each page in the brief (default: one `landing` page), choose its blueprint.
3. Walk the blueprint's recipes in order; for each, produce a
   `{ "recipe": <name>, "content": { … } }` entry whose content matches that
   recipe's contract, using only the brief's content.
4. Emit the build plan as JSON conforming to `build-plan.schema.json`. Output the
   JSON only — no prose, no code fence, no commentary.

## Content-mapping reference

A convention for mapping brief content onto recipe contracts:

| Recipe | Brief content used |
| ------ | ------------------ |
| `header`       | `content.nav`, `brand.logo`, `content.primaryCta` |
| `hero`         | `content.eyebrow`, `content.headline` \|\| `content.valueProposition`, `content.valueProposition`, `content.primaryCta`, `content.secondaryCta`, `content.heroMedia` |
| `feature-grid` | `content.features` |
| `testimonial`  | `content.testimonials` |
| `pricing`      | `content.pricingTiers` |
| `faq`          | `content.faqs` |
| `cta`          | `content.valueProposition` (as heading), `content.primaryCta`, `content.secondaryCta` |
| `footer`       | `content.footerColumns`, `brand.logo` |

Where a recipe's required content is absent (e.g. no `pricingTiers`), omit that
section entirely.
