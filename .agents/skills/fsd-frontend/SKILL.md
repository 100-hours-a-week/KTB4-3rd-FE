---
name: fsd-frontend
description: Apply the Moyeota frontend's Feature-Sliced Design architecture when creating, moving, reviewing, or refactoring Next.js/React/TypeScript code, including routes, pages, widgets, features, entities, shared UI, API/query code, Zustand state, and Storybook stories. Use this skill whenever a frontend task affects folder placement, imports, slice boundaries, public APIs, React Query integration, or project validation.
---

# FSD Frontend

Apply these rules to all frontend changes in `/Users/mac/TeamProj`.

## Core principle

Place code according to responsibility, dependencies, and the reason it changes. Before choosing a layer, answer:

- What domain concept must this code know?
- What user action or business rule does it implement?
- What other code should change when this code changes?

Do not classify a component by its size or name alone. Keep domain representation, user actions, and screen composition separate when their change reasons differ.

## Required project structure

Use this structure:

```text
app/                         # Next.js App Router entrypoints and special files only
src/
├── _app/                    # FSD app layer: global providers and initialization
├── _pages/                  # FSD pages layer: route-level screen slices
├── widgets/                 # Reusable screen blocks composed from lower layers
├── features/                # User actions and business capabilities
├── entities/                # Stable domain objects and their representation
└── shared/                  # Domain-agnostic UI, API client, config, utilities
```

Keep the Next.js `app/` directory at the repository root. Keep `src/` limited to FSD layers. Use `_app` and `_pages` for the FSD layers so they do not conflict with Next.js' reserved `app` and `pages` directories.

Never create or restore `src/views`, `src/app`, `src/styles`, or a root `pages/` directory. Keep global CSS in `app/globals.css`. Put reusable design tokens under the appropriate `shared` segment when they are actually needed; do not create placeholder folders preemptively.

Keep `app/` files thin and framework-oriented. Re-export page slices from route entrypoints:

```tsx
// app/example/page.tsx
export { ExamplePage as default } from '@/_pages/example';
```

Put global providers in `src/_app/providers`. Keep Next.js special files such as `layout.tsx`, `global-error.tsx`, and `globals.css` in the root `app/` directory. Keep `instrumentation.ts` at the repository root.

## Layer and dependency rules

Allow imports only downward:

```text
_app → _pages → widgets → features → entities → shared
```

Treat `shared` as the bottom layer. Do not import from an upper layer, and do not create cycles.

Keep slices in the same layer independent. If two slices need to interact, use one of these strategies in order:

1. Merge slices that always change together.
2. Move genuinely shared domain logic down to `entities` or `shared`.
3. Compose the slices in an upper layer using props, slots, or dependency injection.
4. Use a public API only when the dependency is truly unavoidable.

Do not use same-layer direct imports merely because there is no cycle yet. Do not put an entire business area into one folder if it contains separate entities, actions, and compositions.

## Layer placement guide

| Layer | Put here | Keep out |
| --- | --- | --- |
| `_app` | global providers, initialization, app-wide wiring | route-specific UI and business features |
| `_pages` | route-level composition and page UI | reusable domain behavior |
| `widgets` | meaningful screen blocks that compose multiple lower-level parts | isolated buttons and single user actions |
| `features` | user actions, mutations, workflows, feature-specific state | generic domain display |
| `entities` | stable domain model, schema, API mapping, domain UI | feature-specific actions and app wiring |
| `shared` | domain-agnostic UI, API client, config, utilities | product-specific business rules |

Avoid premature slicing. If a domain concept is not stable or is used by only one feature, keep it near that use case and promote it to `entities` only when the reuse and ownership are clear. An `entities` layer is optional.

Use purpose/domain names rather than generic technical buckets. Prefer `post-card`, `toggle-wishlist`, or `setup-status` over catch-all `components`, `hooks`, `utils`, or `types` folders. Use standard segments such as `ui`, `api`, `model`, `lib`, and `config` when they make the purpose clear.

## Public API and imports

Expose the intentional surface of each multi-file slice or segment through `index.ts`. Export only the symbols consumers need; do not use wildcard barrels such as `export * from './ui'`.

Use direct file imports when a one-file module is already the complete contract and an extra barrel would not hide implementation. Do not create a barrel just for convenience.

- Import within the same slice with explicit relative paths.
- Import another layer or slice through its public API using the `@/*` alias.
- Keep server-only exports out of client-facing APIs. Add `index.server.ts` when a slice needs a separate server-only public surface.
- Use `@x` cross-import APIs only in `entities`, only when restructuring or upper-layer composition cannot remove the dependency.

## API and TanStack Query rules

Keep the shared API client in `src/shared/api`. Group endpoints by controller or entity, not in one generic request folder. Keep request functions and their response types near the endpoint they describe.

Organize server-state queries with a factory and `queryOptions`:

```ts
// src/shared/api/post/post.queries.ts
export const postQueries = {
  all: () => ['posts'] as const,
  detail: (id: number) =>
    queryOptions({
      queryKey: [...postQueries.all(), 'detail', id],
      queryFn: () => getPost(id),
    }),
};
```

Use the factory from UI code instead of writing ad hoc `queryKey` arrays in components. Keep query keys and query functions together. Do not mix mutations into a query-only module; place mutations near their use or in the owning entity/API slice according to responsibility.

Create the singleton-per-browser `QueryClient` in `src/_app/providers/query-provider.tsx` and mount it from the root `app/layout.tsx`. Keep Zustand for client state, and place state by ownership rather than collecting all stores in a generic global folder.

## Next.js and React Server Component rules

- Keep `use client` at the smallest component boundary that needs it.
- Do not import server-only code through a client component or a client-facing barrel.
- Keep route files, metadata, global CSS, and Next special files in root `app/`; keep reusable implementation in an FSD layer.
- Preserve GA4/Sentry wiring at the app/instrumentation boundary; do not make lower domain layers depend on platform setup.

## Tooling and delivery rules

Use pnpm only. Preserve the existing `packageManager` version and do not switch to npm or yarn.

Keep TypeScript strict. Use Oxfmt for formatting and Oxlint for linting; do not add a competing formatter or linter without explicit approval. Add or update colocated Storybook stories for reusable UI and tests for changed behavior.

After a meaningful change, run the narrowest relevant checks and then the full suite when practical:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm exec next build --webpack
pnpm build-storybook
```

Check that no forbidden layer or stale import remains:

```bash
rg -n "views|src/app|src/styles|@/views|@/app" src app
```

When folder placement, ownership, or a new library is ambiguous, stop and ask the user. Do not invent a new layer, duplicate a slice, or perform a broad move without confirming the intended boundary.

## Source references

- Project conventions: `https://github.com/100-hours-a-week/KTB4-3rd-wiki/wiki/Frontend-Wiki`
- FSD folder structure with Next.js: `https://fsd.how/docs/guides/tech/with-nextjs/`
- FSD API and TanStack Query organization: `https://fsd.how/docs/guides/tech/with-react-query/`
- Team FSD notes: `https://velog.io/@yereong/%ED%8F%B4%EB%8D%94%EA%B5%AC%EC%A1%B0-%EC%84%A4%EA%B3%84%ED%95%98%EA%B8%B0-FSD`
