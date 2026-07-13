# Section recipes

Complete page sections composed from [components](../../components/), laid out
with the [foundation layout primitives](../../foundation/hierarchy/). Each is
specified against [`../schema/recipe.schema.json`](../schema/recipe.schema.json)
and declares its content contract.

| Recipe | Purpose | Key content |
| ------ | ------- | ----------- |
| [`hero`](hero.json)                 | Page opener; owns the h1. | eyebrow, heading, subheading, CTAs, media |
| [`logo-cloud`](logo-cloud.json)     | Customer/partner logo band. | logos[] (url, alt) |
| [`feature-grid`](feature-grid.json) | Responsive grid of feature cards. | features[] (icon, title, body) |
| [`stats`](stats.json)               | Headline-metrics band. | stats[] (value, label) |
| [`pricing`](pricing.json)           | Pricing tiers with CTAs. | tiers[] (name, price, features[], cta) |
| [`testimonial`](testimonial.json)   | Social proof quotes. | testimonials[] (quote, author, role, avatar) |
| [`faq`](faq.json)                   | Q&A accordion. | items[] (question, answer) |
| [`cta`](cta.json)                   | Focused conversion banner. | heading, subheading, CTAs |

## Conventions

- **Compose, don't redraw.** Recipes reference components; they never restyle the
  atoms.
- **Declare the content contract.** Generation knows exactly what content each
  section needs, and what is optional.
- **Source order is reading order.** Region order is the tab and mobile-stacking
  order.
- **One h1 per page.** Only the hero contributes the h1; sections use h2/h3.

## Status

✅ Implemented (draft) — see
[Phase 4](../../ROADMAP.md#phase-4--recipes-composed-sections).
