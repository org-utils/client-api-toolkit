# client-api-toolkit

Monorepo housing the shared, type-safe API contract used across our
Node servers and React/Next.js clients.

## Packages

| Package | Published as | What it is |
|---|---|---|
| [`packages/server`](./packages/server) | [`api-response-tsjs`](https://www.npmjs.com/package/api-response-tsjs) | Response envelopes, error classes, offset/cursor pagination, Express/Fastify/Hono adapters, Zod integration |
| [`packages/client`](./packages/client) | [`client-api-kit`](https://www.npmjs.com/package/client-api-kit) | Axios API client, generic CRUD resources, TanStack Query hooks (`/react`), RSC prefetch helpers (`/server`) |
| [`packages/types`](./packages/types) | `client-api-types` | Shared response/pagination/client TypeScript types - type-only, `workspace:*`-linked |
| [`packages/errors`](./packages/errors) | `client-api-errors` | Shared error class hierarchy |

`packages/server` and `packages/client` are published and versioned
independently - they share a contract, not a version number.

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

## Quick Start

### Server (api-response-tsjs)

```bash
npm install api-response-tsjs
```

```ts
import { ok, created, errorResponse, NotFoundError, paginated } from "api-response-tsjs";

export async function getUser(req, res) {
  try {
    const user = await userService.getById(req.params.id);
    res.json(ok(user));
  } catch (err) {
    res.status(404).json(errorResponse(NotFoundError(`User ${req.params.id} not found`)));
  }
}
```

### Client (client-api-kit)

```bash
npm install client-api-kit
```

```ts
import { createApiClient, createResource } from "client-api-kit";

const apiClient = createApiClient({
  baseURL: "https://api.example.com",
  getAuthToken: async () => getToken(),
});

const usersResource = createResource<User>(apiClient, {
  baseURL: "/users",
  mode: "throw",
});
```

## API Categories

### Server: api-response-tsjs

**Response Envelopes**

- `SuccessResponse<T>` - `{ success: true, statusCode, data, message?, pagination?, meta }`
- `ErrorResponse` - `{ success: false, statusCode, error: { code, message, details?, stack }, meta }`
- `ApiResponse<T>` = `SuccessResponse<T> | ErrorResponse`

**Success Builders**

| Builder | Status | Description |
|---|---|---|
| `ok<T>(data, options?)` | 200 | Standard success response |
| `created<T>(data, options?)` | 201 | Resource created |
| `accepted<T>(data, options?)` | 202 | Request queued/accepted |
| `noContent(options?)` | 204 | No content |
| `deleted<T>(data, options?)` | 200 | Resource deleted |
| `paginated<T>(items, pagination, options?)` | 200 | List with pagination |
| `successResponse<T>(data, options?)` | 200 | Generic success builder |

**Error Classes**

- `AppError` - Base error class with `statusCode`, `code`, `isOperational`, `details`
- `BadRequestError` (400)
- `ValidationError` (422) - with field-level `details`
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `MethodNotAllowedError` (405)
- `ConflictError` (409)
- `GoneError` (410)
- `PreconditionFailedError` (412)
- `PayloadTooLargeError` (413)
- `UnsupportedMediaTypeError` (415)
- `UnprocessableEntityError` (422)
- `TooManyRequestsError` (429) - with optional `retryAfterSeconds`
- `InternalServerError` (500) - `isOperational: false`
- `NotImplementedError` (501)
- `BadGatewayError` (502) - `isOperational: false`
- `ServiceUnavailableError` (503) - `isOperational: false`
- `GatewayTimeoutError` (504) - `isOperational: false`
- `CustomError` - Extend for domain-specific errors

**Error Handling**

```ts
import { normalizeError, errorResponse } from "api-response-tsjs";

try {
  await doSomething();
} catch (err) {
  const appError = normalizeError(err); // safely handles Error, strings, etc
  const body = errorResponse(appError, { includeStack: process.env.NODE_ENV !== "production" });
  res.status(body.statusCode).json(body);
}
```

**Pagination**

- **Offset** (`page`/`limit`): `parseOffsetParams`, `getOffset`, `buildOffsetMeta`, `paginated`
- **Cursor** (opaque cursor): `parseCursorParams`, `encodeCursor`, `decodeCursor`, `buildCursorPage`, `paginated`

**Framework Adapters**

- `express` - `asyncHandler`, `errorHandler`, `notFoundHandler`, `routeWrapper`, `validateRequest`
- `fastify` - `createErrorHandler`, `notFoundHandler`, `validateRequest`
- `hono` - `createErrorHandler`, `notFoundHandler`

**Zod Integration**

- `fromZodError` - Convert Zod errors to `ValidationError`
- `ZodErrors` - Convert to `ErrorTree`/`flat`/`messages`/`pretty`
- `fastifyValidationPlugin` - Add typed `fastify.validate.body/query/params`

### Client: client-api-kit

**API Client**

- `createApiClient(initialConfig)` - Create configurable axios-based client
- Fluent API: `.setHeaders()`, `.setDefaultHeaders()`, `.setBaseURL()`, `.setAuthToken()`, `.setTimeout()`, `.setRetry()`, `.setEnvelope()`, `.setConfig()`, `.getConfig()`

**CRUD Resources**

- `createResource<T, ListParams, CreateInput, UpdateInput>(client, options)` - Create resource in specified mode
- Modes: `"throw"` (default, rejects with `ApiClientError`), `"result"` (returns `{success, data/error}`), `"query"` (returns TanStack Query-shaped result)

**Resource Methods** (mode-dependent)

| Method | `"throw"` mode | `"result"` mode | `"query"` mode |
|---|---|---|---|
| `list(params?, options?)` | `Promise<T>` | `Promise<ResourceResult<ListResult<T>>>` | `Promise<QueryResult<ListResult<T>>>` |
| `getById(id, options?)` | `Promise<T>` | `Promise<ResourceResult<T>>` | `Promise<QueryResult<T>>` |
| `create(input, options?)` | `Promise<T>` | `Promise<ResourceResult<T>>` | `Promise<QueryResult<T>>` |
| `update(id, input, options?)` | `Promise<T>` | `Promise<ResourceResult<T>>` | `Promise<QueryResult<T>>` |
| `remove(id, options?)` | `Promise<void>` | `Promise<ResourceResult<null>>` | `Promise<QueryResult<null>>` |
| `custom(method, path?, options?)` | `Promise<T>` | `Promise<ResourceResult<R>>` | `Promise<QueryResult<R>>` |

**Pagination Support**

- **Offset**: `usersResource.list({ page: 1, limit: 20 })` → `{ items, pagination: { type: "offset", page, limit, total, totalPages, hasNext, hasPrev } }`
- **Cursor**: Define `ListParams` as `{ cursor?: string; limit: number }`, use `useInfiniteList`

**Hooks** (`client-api-kit/react`)

- `createResourceHooks(resource, resourceName)` - Returns hooks: `useList`, `useInfiniteList`, `useGetById`, `useCreate`, `useUpdate`, `useDelete`
- `createQueryClient(options)` - Create TanStack Query client
- `ApiQueryProvider` - Provider component for devtools

**Prefetching** (`client-api-kit/server`)

- `createResourcePrefetcher(resource, resourceName)` - Returns: `prefetchList`, `prefetchInfiniteList`, `prefetchGetById`, `prefetchCustom`
- Warm query cache before client mounts (SSR hydration)

**Error Handling**

Every failure normalizes to `ApiClientError` with `kind` (`"network"`, `"timeout"`, `"cancelled"`, `"http"`), `statusCode`, `code`, `details`.

```ts
try {
  await users.create(input);
} catch (err) {
  if (err instanceof ApiClientError) {
    switch (err.kind) {
      case "network": /* couldn't reach server */ break;
      case "timeout": /* request timed out */ break;
      case "cancelled": /* refetch superseded */ break;
      case "http": /* err.statusCode, err.code, err.details */ break;
    }
  }
}
```

### Types: client-api-types

**Root Entry Point**

```ts
import type { User, Pagination, SortDirection } from "client-api-types";
```

**API Types** (`client-api-types/api`)

- `ApiResponse<T>` - Full response union
- `SuccessResponse<T>`, `ErrorResponse`, `ErrorPayload`, `ResponseMeta`
- `GetOneResponse`, `ListResponse`, `CreateResponse`, `UpdateResponse`, `DeleteResponse`
- `BulkResult`, `BulkResponse`
- Pagination types: `SortOrder`, `SortParams`, `OffsetPaginationParams`, `OffsetPaginationMeta`, `CursorPaginationParams`, `CursorPaginationMeta`, `PaginationMeta`, `PaginationParams`

**Client Types** (`client-api-types/client`)

- `TokenProvider` - `() => string \| null \| undefined \| Promise<...>`
- `RetryConfig` - `{ retries?, retryDelayMs?, retryOnStatusCodes?, retryMethods? }`
- `EnvelopeMode` - `"always"`, `"never"`, `"auto"`
- `ApiRequestConfig` - Transport-agnostic request config
- `ApiClientConfig` - Client initialization config
- `RequestOptions` - Per-request headers/signal
- `ApiClient` - Fluent client object with `axios`, `request<T>()`, and setters

**Shared Types** (`client-api-types/shared`)

- `ErrorDetail` - Field/value-level error detail
- `AppErrorOptions` - Options for error constructors
- `STATUS_CODES` - Machine-readable error codes
- `HttpStatusCode` - HTTP status code subset
- `MaybePromise<T>` - `T \| Promise<T>`

## Development

```bash
pnpm install
pnpm typecheck     # TypeScript validation
pnpm test          # Run all tests (72+ tests across packages)
pnpm build         # Build all packages (tsup -> dist/)
```
