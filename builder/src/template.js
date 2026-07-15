// @ts-check
import { container, widget, layoutSettings, gapValue, dimensions, slider } from './elementor.js';
import { pick, hashId, parseDimension } from './util.js';

/**
 * Compile a recipe + a content object into an Elementor template.
 *
 * The layout (regions → containers) is fully driven by the recipe; visual
 * decisions (section rhythm, card styling, icon sizing, global-font bindings)
 * are projected from the resolved tokens onto real Elementor settings, so the
 * imported page looks designed — not just structured. Content is bound to
 * widgets by a documented heuristic (field-name matching); the complete
 * brief → content mapping is the job of the prompts layer.
 *
 * @param {any} recipe
 * @param {Record<string, any>} content
 * @param {Record<string, import('./resolve.js').Resolved>} tokens
 * @returns {any}
 */
export function compileRecipe(recipe, content, tokens) {
  const ctx = {
    primaryList: primaryListName(recipe),
    tokens,
    tok: (ref) => resolveToken(tokens, ref),
    px: (ref) => toPx(resolveToken(tokens, ref)),
  };

  const root = compileRegions(recipe.name, recipe.layout.primitive, recipe.layout.regions, content, ctx);
  Object.assign(root.settings, sectionShell(recipe, ctx));

  return {
    version: '0.4',
    title: recipe.name,
    type: 'section',
    content: [root],
  };
}

/** Recipes that sit on a raised background, giving the page vertical rhythm. */
const RAISED = new Set(['logo-cloud', 'stats', 'testimonial', 'faq']);

/** Section-level shell: semantic tag, boxed width, rhythm padding, background. */
function sectionShell(recipe, ctx) {
  const spacing = { none: 0, compact: '{space.section.sm}', default: '{space.section.md}', spacious: '{space.section.lg}' };
  const block = spacing[recipe.sectionSpacing ?? 'default'];
  const blockPx = block === 0 ? 0 : ctx.px(block);
  const tag = { banner: 'header', contentinfo: 'footer' }[recipe.landmark] ?? 'section';

  /** @type {Record<string, any>} */
  const shell = {
    content_width: 'boxed',
    html_tag: tag,
    padding: dimensions(blockPx, 20, blockPx, 20),
  };
  if (RAISED.has(recipe.name)) {
    shell.background_background = 'classic';
    shell.background_color = ctx.tok('{color.surface.raised}');
  }
  if (recipe.landmark === 'banner') {
    // One row on desktop: child containers are 100%-wide by default, so a
    // wrapping row stacks them — nowrap makes them shrink and share the row.
    Object.assign(shell, {
      flex_wrap: 'nowrap',
      flex_wrap_mobile: 'wrap',
      flex_align_items: 'center',
      flex_justify_content: 'space-between',
    });
  }
  return shell;
}

/** Card styling for repeated items inside a grid (pricing tiers, features, …). */
function cardStyle(ctx) {
  return {
    background_background: 'classic',
    background_color: ctx.tok('{color.surface.page}'),
    border_border: 'solid',
    border_width: dimensions(1),
    border_color: ctx.tok('{color.border.default}'),
    border_radius: dimensions(ctx.px('{radius.card}')),
    padding: dimensions(28),
  };
}

/** Build a container for a set of regions under a parent primitive. */
function compileRegions(path, primitive, regions, scope, ctx) {
  const children = [];
  for (const [name, region] of Object.entries(regions)) {
    children.push(...compileRegion(`${path}/${name}`, name, region, scope, ctx, primitive));
  }
  return container(path, layoutSettings(primitive, {}), children);
}

/**
 * Compile a single region. A repeating region emits one container per item of
 * the primary list; repeated items inside a grid render as cards (unless they
 * are bare media, like gallery images or logos).
 * @returns {any[]} sibling elements
 */
function compileRegion(path, name, region, scope, ctx, parentPrimitive) {
  const primitive = region.primitive ?? 'stack';
  const settings = layoutSettings(primitive, { gap: region.gap && ctx.tok(region.gap), columns: region.columns });

  if (region.repeat) {
    const isCard = parentPrimitive === 'grid'
      && (region.components ?? []).some((c) => baseName(c) !== 'media');
    const itemSettings = isCard ? { ...settings, ...cardStyle(ctx) } : settings;
    const list = Array.isArray(scope?.[ctx.primaryList]) ? scope[ctx.primaryList] : [];
    return list.map((item, i) =>
      container(`${path}/${i}`, itemSettings, regionChildren(`${path}/${i}`, region, item, ctx)),
    );
  }
  return [container(path, settings, regionChildren(path, region, scope, ctx))];
}

/** The widgets + nested regions of a region, in source order. */
function regionChildren(path, region, scope, ctx) {
  const children = [];
  for (const [i, ref] of (region.components ?? []).entries()) {
    const el = bindComponent(`${path}/c${i}`, ref, scope, ctx);
    if (el) children.push(el);
  }
  for (const [name, sub] of Object.entries(region.regions ?? {})) {
    children.push(...compileRegion(`${path}/${name}`, name, sub, scope, ctx, region.primitive ?? 'stack'));
  }
  return children;
}

/** Global Fonts binding per heading level (ids match the kit emitter). */
const HEADING_FONT_ID = {
  h1: 'primary',
  h2: 'secondary',
  h3: hashId('type:Heading 3'),
  h4: hashId('type:Heading 4'),
};

function headingGlobals(level) {
  const id = HEADING_FONT_ID[level];
  return id ? { __globals__: { typography_typography: `globals/typography?id=${id}` } } : {};
}

/**
 * Bind a component reference (e.g. "heading:h1", "button:secondary?") to a
 * widget, pulling its content from the current scope. Returns null when the
 * reference is optional and no matching content is present.
 */
function bindComponent(path, ref, scope, ctx) {
  const optional = ref.endsWith('?');
  const [base, variant] = ref.replace(/\?$/, '').split(':');

  switch (base) {
    case 'heading': {
      const title = pick(scope, ['heading', 'title', 'name', 'question', 'author']);
      const size = level(variant);
      if (title == null) return optional ? null : widget(path, 'heading', { title: '', header_size: size, ...headingGlobals(size) });
      return widget(path, 'heading', { title: String(title), header_size: size, ...headingGlobals(size) });
    }
    case 'text': {
      // Attribution lines (text:small on an item with an author) render
      // "author — role" instead of re-picking the quote text.
      if (variant === 'small' && scope && (scope.author || scope.role)) {
        const who = [scope.author, scope.role].filter(Boolean).join(' — ');
        return widget(path, 'text-editor', { editor: `<p>${escapeHtml(String(who))}</p>` });
      }
      const t = pick(scope, ['subheading', 'intro', 'body', 'message', 'answer', 'quote', 'description', 'blurb', 'legal', 'role']);
      if (t == null) return optional ? null : null;
      return widget(path, 'text-editor', { editor: `<p>${escapeHtml(String(t))}</p>` });
    }
    case 'button': {
      const action = variant === 'secondary'
        ? pick(scope, ['secondaryCta'])
        : pick(scope, ['primaryCta', 'cta']);
      if (!action) return null;
      /** @type {Record<string, any>} */
      const settings = {
        text: String(action.label ?? action),
        link: { url: String(action.href ?? '#'), is_external: '', nofollow: '' },
      };
      if (variant === 'secondary') {
        Object.assign(settings, {
          background_color: 'rgba(0, 0, 0, 0)',
          border_border: 'solid',
          border_width: dimensions(1),
          border_color: ctx.tok('{color.border.strong}'),
          border_radius: dimensions(10),
          __globals__: { button_text_color: 'globals/colors?id=accent' },
        });
      }
      return widget(path, 'button', settings);
    }
    case 'media': {
      // Either a named media field, or a scope that *is* the image (e.g. a logo item).
      const key = ['media', 'image', 'logo', 'avatar'].find((k) => scope?.[k] != null);
      const img = (key ? scope[key] : undefined) ?? (scope && scope.url ? scope : undefined);
      if (!img) return null;
      // Record what kind of asset this is so placeholder rendering (preview,
      // import harness) can pick a fitting shape. Unknown settings keys are
      // preserved by Elementor and ignored by its renderer.
      const kind = key === 'logo' ? 'logo' : key === 'avatar' ? 'avatar' : 'media';
      return widget(path, 'image', {
        image: { url: String(img.url ?? img), alt: String(img.alt ?? '') },
        _impression_asset: kind,
      });
    }
    case 'stat': {
      const value = pick(scope, ['value']);
      const label = pick(scope, ['label']);
      if (value == null && label == null) return optional ? null : null;
      return container(path, layoutSettings('stack', {}), [
        widget(`${path}/value`, 'heading', { title: String(value ?? ''), header_size: 'h3', __globals__: { typography_typography: 'globals/typography?id=secondary' } }),
        widget(`${path}/label`, 'text-editor', { editor: `<p>${escapeHtml(String(label ?? ''))}</p>` }),
      ]);
    }
    case 'badge': {
      const b = pick(scope, ['eyebrow', 'badge']);
      if (b == null) return optional ? null : null;
      return widget(path, 'text-editor', { editor: `<span class="badge">${escapeHtml(String(b))}</span>` });
    }
    case 'icon': {
      const icon = pick(scope, ['icon']);
      if (icon == null) return null;
      return widget(path, 'icon', {
        selected_icon: { value: `fas fa-${icon}`, library: 'fa-solid' },
        size: slider(28),
        __globals__: { primary_color: 'globals/colors?id=accent' },
      });
    }
    case 'list-item': {
      const features = pick(scope, ['features']);
      if (Array.isArray(features)) {
        return widget(path, 'icon-list', {
          icon_list: features.map((f, i) => ({
            _id: hashId(`${path}/${i}`),
            text: String(f.label ?? f),
            selected_icon: { value: 'fas fa-check', library: 'fa-solid' },
          })),
          space_between: slider(8),
          icon_size: slider(14),
          __globals__: { icon_color: 'globals/colors?id=accent' },
        });
      }
      return null;
    }
    case 'accordion': {
      // The whole disclosure list: one Elementor Accordion widget built from
      // the items list (same pattern as list-item and form-field).
      const items = pick(scope, ['items', 'faqs']);
      if (!Array.isArray(items) || !items.length) return null;
      return widget(path, 'accordion', {
        tabs: items.map((it, i) => ({
          _id: hashId(`${path}/${i}`),
          tab_title: String(it.question ?? it.title ?? ''),
          tab_content: `<p>${escapeHtml(String(it.answer ?? it.body ?? ''))}</p>`,
        })),
        title_html_tag: 'h3',
      });
    }
    case 'form-field': {
      // The whole form: one Elementor Form widget built from the fields list
      // (mirrors how list-item expands a list into a single icon-list widget).
      const fields = pick(scope, ['fields']);
      if (!Array.isArray(fields)) return null;
      return widget(path, 'form', {
        form_name: String(pick(scope, ['formName']) ?? 'Contact'),
        form_fields: fields.map((f) => ({
          _id: hashId(`${path}/${f.label}`),
          custom_id: slug(String(f.label ?? 'field')),
          field_label: String(f.label ?? ''),
          field_type: fieldType(f.type),
          required: f.required ? 'true' : '',
          placeholder: String(f.placeholder ?? ''),
        })),
        button_text: String(pick(scope, ['submitLabel']) ?? 'Send'),
      });
    }
    case 'nav-item': {
      const links = pick(scope, ['links']);
      if (Array.isArray(links)) {
        return widget(path, 'icon-list', {
          view: 'inline',
          icon_list: links.map((l, i) => ({
            _id: hashId(`${path}/${i}`),
            text: String(l.label ?? l),
            link: { url: String(l.href ?? '#') },
            selected_icon: { value: '', library: '' },
          })),
          space_between: slider(18),
        });
      }
      return null;
    }
    default:
      return null;
  }
}

function level(variant) {
  return /^h[1-6]$/.test(variant ?? '') ? variant : 'h2';
}

function baseName(ref) {
  return ref.replace(/\?$/, '').split(':')[0];
}

/** The recipe's primary repeating list content field, if any. */
function primaryListName(recipe) {
  for (const [name, field] of Object.entries(recipe.content ?? {})) {
    if (field && typeof field === 'object' && field.type === 'list' && field.required) return name;
  }
  // fall back to the first list field of any kind
  for (const [name, field] of Object.entries(recipe.content ?? {})) {
    if (field && typeof field === 'object' && field.type === 'list') return name;
  }
  return null;
}

/** Resolve a {token} reference to its concrete value; literals pass through. */
function resolveToken(tokens, ref) {
  const m = String(ref).match(/^\{([a-zA-Z0-9._-]+)\}$/);
  if (!m) return String(ref);
  const t = tokens[m[1]];
  return t ? String(t.value) : String(ref);
}

/** A CSS dimension (rem/em/px) as a pixel number. */
function toPx(cssDim) {
  const d = parseDimension(cssDim);
  return d.unit === 'rem' || d.unit === 'em' ? Math.round(d.size * 16) : d.size;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Map a content field type onto an Elementor form field type. */
function fieldType(t) {
  return ['text', 'email', 'tel', 'textarea', 'select'].includes(t) ? t : 'text';
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'field';
}
