// @ts-check
/**
 * A compact JSON Schema (draft 2020-12 subset) validator — zero dependencies.
 * Supports exactly the keywords the Impression OS schemas use:
 *   type, enum, const, pattern, required, properties, patternProperties,
 *   additionalProperties, propertyNames, items, minItems, maxItems,
 *   minLength, maxLength, minimum, maximum, $ref (local), $defs, oneOf,
 *   anyOf, allOf, not.
 * Annotation keywords ($schema, $id, title, description, default, $comment,
 * examples) are ignored.
 */

/**
 * Validate `data` against `schema`. Returns a list of human-readable errors
 * (empty when valid).
 * @param {any} schema @param {any} data @returns {string[]}
 */
export function validate(schema, data) {
  /** @type {string[]} */
  const errors = [];
  check(schema, data, '$', schema, errors);
  return errors;
}

function check(schema, data, path, root, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    errors.push(`${path}: schema is false (no value allowed)`);
    return;
  }

  if (schema.$ref) {
    const target = resolveRef(schema.$ref, root);
    if (!target) errors.push(`${path}: cannot resolve $ref ${schema.$ref}`);
    else check(target, data, path, root, errors);
    // sibling keywords still apply below
  }

  if ('type' in schema && !matchesType(schema.type, data)) {
    errors.push(`${path}: expected type ${JSON.stringify(schema.type)}, got ${typeName(data)}`);
    return;
  }

  if ('enum' in schema && !schema.enum.some((v) => deepEqual(v, data))) {
    errors.push(`${path}: ${JSON.stringify(data)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  if ('const' in schema && !deepEqual(schema.const, data)) {
    errors.push(`${path}: ${JSON.stringify(data)} !== const ${JSON.stringify(schema.const)}`);
  }

  if (typeof data === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${path}: "${data}" does not match /${schema.pattern}/`);
    }
    if (schema.minLength != null && data.length < schema.minLength) errors.push(`${path}: shorter than ${schema.minLength}`);
    if (schema.maxLength != null && data.length > schema.maxLength) errors.push(`${path}: longer than ${schema.maxLength}`);
  }

  if (typeof data === 'number') {
    if (schema.minimum != null && data < schema.minimum) errors.push(`${path}: ${data} < minimum ${schema.minimum}`);
    if (schema.maximum != null && data > schema.maximum) errors.push(`${path}: ${data} > maximum ${schema.maximum}`);
  }

  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems) errors.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.maxItems != null && data.length > schema.maxItems) errors.push(`${path}: more than ${schema.maxItems} items`);
    if (schema.items) data.forEach((v, i) => check(schema.items, v, `${path}[${i}]`, root, errors));
  }

  if (isObject(data)) {
    if (schema.required) {
      for (const key of schema.required) if (!(key in data)) errors.push(`${path}: missing required "${key}"`);
    }
    const props = schema.properties || {};
    const patternProps = schema.patternProperties || {};
    for (const [key, value] of Object.entries(data)) {
      const childPath = `${path}.${key}`;
      let matched = false;
      if (key in props) { check(props[key], value, childPath, root, errors); matched = true; }
      for (const [pat, sub] of Object.entries(patternProps)) {
        if (new RegExp(pat).test(key)) { check(sub, value, childPath, root, errors); matched = true; }
      }
      if (!matched && 'additionalProperties' in schema) {
        if (schema.additionalProperties === false) errors.push(`${childPath}: additional property not allowed`);
        else if (typeof schema.additionalProperties === 'object') check(schema.additionalProperties, value, childPath, root, errors);
      }
      if (schema.propertyNames) check(schema.propertyNames, key, `${path} key "${key}"`, root, errors);
    }
  }

  if (schema.oneOf) {
    const passing = schema.oneOf.filter((s) => validateSub(s, data, root));
    if (passing.length !== 1) errors.push(`${path}: matched ${passing.length} of oneOf (expected exactly 1)`);
  }
  if (schema.anyOf && !schema.anyOf.some((s) => validateSub(s, data, root))) {
    errors.push(`${path}: matched none of anyOf`);
  }
  if (schema.allOf) schema.allOf.forEach((s) => check(s, data, path, root, errors));
  if (schema.not && validateSub(schema.not, data, root)) errors.push(`${path}: must NOT match "not" schema`);
}

function validateSub(schema, data, root) {
  const errs = [];
  check(schema, data, '$', root, errs);
  return errs.length === 0;
}

function resolveRef(ref, root) {
  if (!ref.startsWith('#')) return null;
  const parts = ref.slice(1).split('/').filter(Boolean).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let node = root;
  for (const p of parts) {
    if (node == null) return null;
    node = node[p];
  }
  return node;
}

function matchesType(type, data) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => isType(t, data));
}
function isType(t, data) {
  switch (t) {
    case 'object': return isObject(data);
    case 'array': return Array.isArray(data);
    case 'string': return typeof data === 'string';
    case 'number': return typeof data === 'number';
    case 'integer': return typeof data === 'number' && Number.isInteger(data);
    case 'boolean': return typeof data === 'boolean';
    case 'null': return data === null;
    default: return false;
  }
}
function isObject(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function typeName(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
