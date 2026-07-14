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
  return {
    meta: { name: `${brief?.business?.name ?? 'Site'} — ${pageType}` },
    theme: ctx.theme,
    sections: expandSections(pageType, brief, ctx),
  };
}

/**
 * Expand a brief into a multi-page site plan: one shared theme, one page per
 * brief.pages entry (default a single landing page), each with its blueprint
 * expanded and content mapped.
 * @param {any} brief
 * @param {{ blueprints:any, recipes:Record<string,any>, theme:string }} ctx
 * @returns {any} a site plan
 */
export function planSiteFromBrief(brief, ctx) {
  const pages = (brief?.pages?.length ? brief.pages : [{ type: 'landing', path: '/' }]).map((p) => ({
    path: p.path ?? '/',
    type: p.type ?? 'landing',
    sections: expandSections(p.type ?? 'landing', brief, ctx),
  }));
  const biz = brief?.business ?? {};
  const organization = defineOnly({ name: biz.name, description: biz.description, logo: brief?.brand?.logo });
  return {
    meta: { name: biz.name ?? 'Site' },
    theme: ctx.theme,
    ...(Object.keys(organization).length ? { organization } : {}),
    pages,
  };
}

function defineOnly(o) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));
}

/** Expand one blueprint into sections, dropping those the brief can't fill. */
function expandSections(pageType, brief, ctx) {
  const blueprint = ctx.blueprints.blueprints[pageType] ?? ctx.blueprints.blueprints.landing;
  const sections = [];
  for (const recipeName of blueprint.sections) {
    const recipe = ctx.recipes[recipeName];
    if (!recipe) continue;
    const content = mapContent(recipeName, brief);
    if (hasRequired(recipe, content)) sections.push({ recipe: recipeName, content });
  }
  return sections;
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
    case 'gallery':
      return defined({ images: c.gallery });
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
