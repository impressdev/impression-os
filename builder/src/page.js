// @ts-check
/**
 * Derive page-level metadata (title, meta description, Open Graph) for a build
 * plan. Explicit `plan.seo` fields win; anything omitted is derived
 * deterministically from the plan's name and the hero content — so a
 * professional page ships with sensible SEO/social metadata by default.
 */

const MAX_DESCRIPTION = 160;

/**
 * @param {any} plan
 * @returns {{ title:string, description:string, og:{title:string, description:string, image?:string} }}
 */
export function buildPage(plan) {
  const seo = plan.seo ?? {};
  const hero = (plan.sections ?? []).find((s) => s.recipe === 'hero')?.content ?? {};

  const title = seo.title ?? plan.meta?.name ?? hero.heading ?? 'Untitled';
  const description = clip(seo.description ?? hero.subheading ?? hero.heading ?? '', MAX_DESCRIPTION);
  const image = seo.ogImage ?? hero.media?.url;

  const og = { title, description, ...(image ? { image } : {}) };
  return { title, description, og };
}

/** Trim to a max length on a word boundary, adding an ellipsis if cut. */
function clip(text, max) {
  const s = String(text).trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return (at > 40 ? cut.slice(0, at) : cut).trimEnd() + '…';
}
