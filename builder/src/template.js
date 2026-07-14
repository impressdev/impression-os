// @ts-check
import { container, widget, layoutSettings } from './elementor.js';
import { pick, hashId } from './util.js';

/**
 * Compile a recipe + a content object into an Elementor template.
 *
 * The layout (regions → containers) is fully driven by the recipe. Content is
 * bound to widgets by a documented heuristic (field-name matching); the complete
 * brief → content mapping is the job of the prompts layer (Phase 6). Repeating
 * regions iterate the recipe's primary list content field.
 *
 * @param {any} recipe
 * @param {Record<string, any>} content
 * @param {Record<string, import('./resolve.js').Resolved>} tokens
 * @returns {any}
 */
export function compileRecipe(recipe, content, tokens) {
  const ctx = { primaryList: primaryListName(recipe), gap: (ref) => resolveGap(tokens, ref) };
  const root = compileRegions(
    recipe.name,
    recipe.layout.primitive,
    recipe.layout.regions,
    content,
    ctx,
  );
  return {
    version: '0.4',
    title: recipe.name,
    type: recipe.category === 'chrome' ? 'section' : 'section',
    content: [root],
  };
}

/** Build a container for a set of regions under a parent primitive. */
function compileRegions(path, primitive, regions, scope, ctx) {
  const children = [];
  for (const [name, region] of Object.entries(regions)) {
    children.push(...compileRegion(`${path}/${name}`, name, region, scope, ctx));
  }
  return container(path, layoutSettings(primitive, {}), children);
}

/**
 * Compile a single region. A repeating region emits one container per item of
 * the primary list; otherwise it emits a single container.
 * @returns {any[]} sibling elements
 */
function compileRegion(path, name, region, scope, ctx) {
  const primitive = region.primitive ?? 'stack';
  const settings = layoutSettings(primitive, { gap: region.gap && ctx.gap(region.gap), columns: region.columns });

  if (region.repeat) {
    const list = Array.isArray(scope?.[ctx.primaryList]) ? scope[ctx.primaryList] : [];
    return list.map((item, i) =>
      container(`${path}/${i}`, settings, regionChildren(`${path}/${i}`, region, item, ctx)),
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
    children.push(...compileRegion(`${path}/${name}`, name, sub, scope, ctx));
  }
  return children;
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
      if (title == null) return optional ? null : widget(path, 'heading', { title: '', header_size: level(variant) });
      return widget(path, 'heading', { title: String(title), header_size: level(variant) });
    }
    case 'text': {
      const t = pick(scope, ['subheading', 'intro', 'body', 'message', 'answer', 'quote', 'description', 'blurb', 'legal', 'role']);
      if (t == null) return optional ? null : null;
      return widget(path, 'text-editor', { editor: `<p>${escapeHtml(String(t))}</p>` });
    }
    case 'button': {
      const action = variant === 'secondary'
        ? pick(scope, ['secondaryCta'])
        : pick(scope, ['primaryCta', 'cta']);
      if (!action) return null;
      return widget(path, 'button', {
        text: String(action.label ?? action),
        link: { url: String(action.href ?? '#'), is_external: '', nofollow: '' },
      });
    }
    case 'media': {
      // Either a named media field, or a scope that *is* the image (e.g. a logo item).
      const img = pick(scope, ['media', 'image', 'logo', 'avatar']) ?? (scope && scope.url ? scope : undefined);
      if (!img) return null;
      return widget(path, 'image', {
        image: { url: String(img.url ?? img), alt: String(img.alt ?? '') },
      });
    }
    case 'stat': {
      const value = pick(scope, ['value']);
      const label = pick(scope, ['label']);
      if (value == null && label == null) return optional ? null : null;
      return container(path, layoutSettings('stack', {}), [
        widget(`${path}/value`, 'heading', { title: String(value ?? ''), header_size: 'h3' }),
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
      return widget(path, 'icon', { selected_icon: { value: `fas fa-${icon}`, library: 'fa-solid' } });
    }
    case 'list-item': {
      const features = pick(scope, ['features']);
      if (Array.isArray(features)) {
        return widget(path, 'icon-list', {
          icon_list: features.map((f) => ({ text: String(f.label ?? f) })),
        });
      }
      return null;
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
          icon_list: links.map((l) => ({ text: String(l.label ?? l), link: { url: String(l.href ?? '#') } })),
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

function resolveGap(tokens, ref) {
  const m = String(ref).match(/^\{([a-zA-Z0-9._-]+)\}$/);
  if (!m) return String(ref);
  const t = tokens[m[1]];
  return t ? String(t.value) : String(ref);
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
