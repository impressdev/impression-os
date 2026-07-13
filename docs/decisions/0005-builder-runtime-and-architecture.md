# ADR-0005 — Builder runtime and architecture

- **Status:** Accepted
- **Date:** 2026-07-13
- **Deciders:** Impression OS core
- **Phase:** [Phase 5 — Builder](../../ROADMAP.md#phase-5--builder-the-compiler)

## Context

The builder is the first executable code in the project: it resolves the token,
foundation, component, and recipe layers and emits an Elementor Pro kit. Two
decisions had to be made up front — the runtime/language, and the compiler
architecture — because everything downstream (tools, tests, CI) builds on them.

The constraints: the source of truth is already pure JSON; output is Elementor
JSON; determinism is a hard requirement; and the result must run and be verifiable
without a heavy toolchain.

## Decision

### Runtime: Node.js, ESM JavaScript with JSDoc, zero dependencies

- **Node.js** because the toolchain is JSON end-to-end and Node runs everywhere
  the team and CI already are.
- **Plain ESM JavaScript with JSDoc `@ts-check`** rather than TypeScript-with-a-
  build-step: we get editor-level type checking and zero compile/transpile
  friction. The builder runs directly (`node bin/impression-build.js`) — no build
  artifact, no watch mode, nothing to get out of sync.
- **Zero runtime dependencies.** Everything uses the Node standard library. This
  keeps the compiler auditable, supply-chain-free, and trivially reproducible.

A future move to compiled TypeScript is possible without changing the public API;
`@ts-check` keeps us honest in the meantime.

### Architecture: load → resolve → emit

A small, layered pipeline mirroring the design system itself:

- `load` reads sources via the token manifest and the component/recipe catalogs.
- `resolve` turns a *theme* into a flat map of concrete token values — applying
  `$extends` and dereferencing every `{reference}`. This is the deterministic
  heart of the builder and is unit-tested directly.
- `kit` projects resolved semantic tokens onto an Elementor Site Settings kit
  (global colors, global fonts, layout defaults).
- `template` compiles a recipe + content into an Elementor element tree, driving
  layout from the recipe's primitives and binding content to widgets.

### Determinism

Element ids are a hash of each element's unique tree path; there is no
`Math.random()` or wall-clock use anywhere. A smoke test asserts that two builds
of the same brief are byte-stable.

## Consequences

**Positive**

- Runs and is verifiable immediately, with no install step (`node --test` passes).
- Deterministic by construction; byte-stability is a checked property.
- The resolver is reusable by the tests harness and any future tooling.

**Costs / trade-offs**

- Plain JS forgoes compile-time type *enforcement*; mitigated by `@ts-check` +
  JSON Schemas on the data it consumes.
- This phase implements token→kit fully and a pragmatic, heuristic recipe→content
  binder. The complete brief → content mapping is deferred to
  [`prompts/`](../../prompts/) ([Phase 6](../../ROADMAP.md#phase-6--prompts-the-intent-layer)),
  which is the layer that owns intent. The scope boundary is documented in the
  builder README rather than hidden.

**Follow-ups**

- [`tests/`](../../tests/) ([Phase 7](../../ROADMAP.md#phase-7--quality-harness))
  will consume the resolver and add schema, accessibility, and visual-regression
  gates on top of the builder's own smoke test.
- The [token → Elementor mapping strategy](../architecture/token-to-elementor-mapping.md)
  is now realised by `kit.js`; open questions there (theme switching, dark-mode
  packaging) remain for a later builder revision.

Builds on ADR-0001–0004 (the layers the builder compiles).
