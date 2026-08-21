# client-api-toolkit

Monorepo housing the shared, type-safe API contract used across our
Node servers and React/Next.js clients:

| Package | Published as | What it is |
|---|---|---|
| [`packages/server`](./packages/server) | [`api-response-tsjs`](https://www.npmjs.com/package/api-response-tsjs) | Response envelopes, error classes, offset/cursor pagination, Express/Fastify/Hono adapters, Zod integration |
| [`packages/client`](./packages/client) | [`client-api-kit`](https://www.npmjs.com/package/client-api-kit) | Axios API client, generic CRUD resources, TanStack Query hooks (`/react`), RSC prefetch helpers (`/server`) |
| [`packages/types`](./packages/types) | `client-api-types` | Shared response/pagination/client TypeScript types - type-only, `workspace:*`-linked |
| [`packages/errors`](./packages/errors) | `client-api-errors` | Shared error class hierarchy (placeholder - see package README) |

`packages/server` and `packages/client` are published and versioned
**independently** - they share a contract, not a version number.

## Getting started

```bash
pnpm install
pnpm build       # builds all packages, in dependency order (via Turborepo)
pnpm typecheck
pnpm test
```

Run a script for a single package:

```bash
pnpm --filter api-response-tsjs test
pnpm --filter client-api-kit build
```

## Releasing

```bash
pnpm changeset          # describe your change, pick affected package(s)
pnpm version-packages    # apply version bumps + changelogs (usually via the Release PR)
pnpm publish-packages    # build + publish to npm
```

See [`.changeset/README.md`](./.changeset/README.md) for how independent
versioning is configured.

## Why these two packages live together

`api-response-tsjs` defines the server-side response envelope shape;
`client-api-kit` consumes that exact shape on the client. Keeping them in one
repo means the contract between them (and the shared `client-api-types`
package) can be changed and tested atomically, with `workspace:*` linking
instead of a publish-and-reinstall loop during development - without merging
their published artifacts together. `client-api-kit` still ships three
separate entry points (`.`, `./react`, `./server`) specifically to keep
Node-only and `"use client"` code out of each other's bundles; that boundary
is unchanged by this repo move. See [`monorepo-migration-plan.md`](./monorepo-migration-plan.md)
for the full rationale and step-by-step migration this repo was built from.
