// @ts-check
/**
 * Deterministic planner: expand a blueprint and map a brief's content onto each
 * recipe's content contract, producing a build plan — no LLM required for the
 * standard case. It composes from the brief only (never writes copy) and drops
 * any section whose required content the brief does not supply.
 */

/**
 * @param {any} brief
 * @param {{ blueprints:any, recipes:Record<string,any>, theme:string }} ctx
 * @returns {any} a build plan
 */
export function planFromBrief(brief, ctx) {
  const pageType = brief?.pages?.[0]?.type ?? 'landing';
  const blueprint = ctx.blueprints.blueprints[pageType] ?? ctx.blueprints.blueprints.landing;

  const sections = [];
  for (const recipeName of blueprint.sections) {
    const recipe = ctx.recipes[recipeName];
    if (!recipe) continue;
    const content = mapContent(recipeName, brief);
    if (hasRequired(recipe, content)) sections.push({ recipe: recipeName, content });
  }

  return {
    meta: { name: `${brief?.business?.name ?? 'Site'} — ${pageType}` },
    theme: ctx.theme,
    sections,
  };
}

/** True when every required content field of a recipe is present and non-empty. */
function hasRequired(recipe, content) {
  for (const [field, def] of Object.entries(recipe.content ?? {})) {
    if (def && def.required) {
      const v = content[field];
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) return false;
    }
  }
  return true;
}

/** Map a brief onto one recipe's content contract. Absent fields → omitted. */
function mapContent(recipe, brief) {
  const c = brief?.content ?? {};
  const b = brief?.brand ?? {};
  const biz = brief?.business ?? {};
  const logo = b.logo ? { url: b.logo, alt: biz.name ?? '' } : undefined;
  const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));

  switch (recipe) {
    case 'header':
      return defined({ logo, links: c.nav, cta: c.primaryCta });
    case 'hero':
      return defined({
        eyebrow: c.eyebrow,
        heading: c.headline ?? c.valueProposition,
        subheading: c.valueProposition,
        primaryCta: c.primaryCta,
        secondaryCta: c.secondaryCta,
        media: c.heroMedia,
      });
    case 'feature-grid':
      return defined({ features: c.features });
    case 'stats':
      return defined({ stats: c.stats });
    case 'testimonial':
      return defined({ testimonials: c.testimonials });
    case 'team':
      return defined({ members: c.team });
    case 'logo-cloud':
      return defined({ logos: c.logos });
    case 'pricing':
      return defined({
        tiers: c.pricingTiers?.map((t) => defined({
          name: t.name, price: t.price, period: t.period, description: t.description,
          features: t.features?.map((f) => ({ label: f })),
          cta: t.cta, highlighted: t.highlighted,
        })),
      });
    case 'faq':
      return defined({ items: c.faqs });
    case 'cta':
      return defined({
        heading: c.headline ?? c.valueProposition,
        primaryCta: c.primaryCta,
        secondaryCta: c.secondaryCta,
      });
    case 'contact':
      return defined({ heading: c.headline ?? c.valueProposition, fields: c.formFields, submitLabel: c.primaryCta?.label });
    case 'footer':
      return defined({ logo, blurb: biz.description, columns: c.footerColumns });
    default:
      return {};
  }
}
