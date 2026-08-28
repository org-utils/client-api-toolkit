# api-response-tsjs

## 0.1.8

### Patch Changes

- [`b97ad22`](https://github.com/org-utils/client-api-toolkit/commit/b97ad223848b3d799fb5c0ec60098d37e785b611) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Updated packages repo urls
- Updated dependencies [[`b97ad22`](https://github.com/org-utils/client-api-toolkit/commit/b97ad223848b3d799fb5c0ec60098d37e785b611)]:
  - client-api-errors@0.0.11

## 0.1.7

### Patch Changes

- [`fc22651`](https://github.com/org-utils/client-api-toolkit/commit/fc2265143ab22b74b82d366cf8c7dc4e36f47649) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Updated types
- Updated dependencies [[`fc22651`](https://github.com/org-utils/client-api-toolkit/commit/fc2265143ab22b74b82d366cf8c7dc4e36f47649)]:
  - client-api-errors@0.0.10

## 0.1.6

### Patch Changes

- [`f2855c7`](https://github.com/org-utils/client-api-toolkit/commit/f2855c7e5b8c23ec1e9d7427f2a72ad03e6342cd) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Updated types and files

## 0.1.5

### Patch Changes

- [#9](https://github.com/org-utils/client-api-toolkit/pull/9) [`dd06fbb`](https://github.com/org-utils/client-api-toolkit/commit/dd06fbb15e1855fa77504e686034cf9a9e00ecd8) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Optimize code and remove dead code
- Updated dependencies [[`dd06fbb`](https://github.com/org-utils/client-api-toolkit/commit/dd06fbb15e1855fa77504e686034cf9a9e00ecd8)]:
  - client-api-errors@0.0.9

## 0.1.4

### Patch Changes

- [`4a67331`](https://github.com/org-utils/client-api-toolkit/commit/4a67331c0fd6a904209d9201fcd4cceb16288370) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Updated tyeps
- Updated dependencies [[`4a67331`](https://github.com/org-utils/client-api-toolkit/commit/4a67331c0fd6a904209d9201fcd4cceb16288370)]:
  - client-api-errors@0.0.8

## 0.1.3

### Patch Changes

- [`5ec4989`](https://github.com/org-utils/client-api-toolkit/commit/5ec49899da002c42e66672f55c0a84b8670b5256) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - UPdate types
- Updated dependencies [[`5ec4989`](https://github.com/org-utils/client-api-toolkit/commit/5ec49899da002c42e66672f55c0a84b8670b5256)]:
  - client-api-errors@0.0.7

## 0.1.2

### Patch Changes

- [#2](https://github.com/org-utils/client-api-toolkit/pull/2) [`35141ef`](https://github.com/org-utils/client-api-toolkit/commit/35141ef78b3dd9710f529ef33e97e67518468a78) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - The changes represent a structural refactoring of the resource/client API with improved type safety, state management, and builder pattern support.
- Updated dependencies [[`35141ef`](https://github.com/org-utils/client-api-toolkit/commit/35141ef78b3dd9710f529ef33e97e67518468a78)]:
  - client-api-errors@0.0.6

## 0.1.1

### Patch Changes

- [`00d8010`](https://github.com/org-utils/client-api-toolkit/commit/00d8010fa8d2ed4a6965a8bf93e1e454ebf1c057) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Updated package settings
- Updated dependencies [[`00d8010`](https://github.com/org-utils/client-api-toolkit/commit/00d8010fa8d2ed4a6965a8bf93e1e454ebf1c057)]:
  - client-api-errors@0.0.5

## 0.1.0

### Minor Changes

- [`8ef045b`](https://github.com/org-utils/api-response/commit/8ef045b246d724687476ea9c31197c29e569b1c0) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - - **Decoupled zod from the core and framework adapters.** The main entry and `api-response-tsjs/express` / `api-response-tsjs/fastify` no longer import zod at module load, so they work without zod installed. Everything zod-specific (`ZodErrors`, `getIssueMessage`, `fastifyValidationPlugin`) now lives in the `api-response-tsjs/zod` subpath, alongside `fromZodError`.
  - **Fixed the main entry never exporting the error classes** (`AppError`, `NotFoundError`, `normalizeError`, `HttpStatus`, `isAppError`, ... were documented but never actually exported). The `export *` chain through the errors module was dropped by the bundler, so these are now explicit named re-exports. `ErrorCode` keeps the runtime constant.
  - **Fixed broken subpath types**: the `exports` map pointed at `./dist/express.d.ts` etc., but declarations are emitted under `./dist/middleware/...` - the types condition now points at the real files, so `api-response-tsjs/express`, `/fastify`, `/hono`, and `/zod` resolve their `.d.ts` correctly.
  - **`client-api-types` moved from devDependencies to dependencies** so consumers can resolve the published `.d.ts` (which re-exports its types) without `skipLibCheck`. It's a type-only package with no runtime cost. The re-export was also narrowed to the `api` + `shared` subpaths - the full-package re-export leaked `client/` types that require `axios` to typecheck.
  - **`validateRequest` is now schema-agnostic** in the Express and Fastify adapters - pass any schema exposing a `.parse(data)` method (zod, valibot, arktype, yup, ...). Thrown `{ issues: [...] }` failures are converted into a `ValidationError` with field-level `details`. Fastify's version now uses a consistent `Invalid <location> parameters` message instead of a pretty-printed string.
  - **Added a Hono adapter**: `api-response-tsjs/hono` exports `createErrorHandler` and `notFoundHandler` (`app.onError(...)` / `app.notFound(...)`).

### Patch Changes

- [`79944ca`](https://github.com/org-utils/api-response/commit/79944caa57e22fc356c7d97d8840a111ba305119) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - Patched the version and added hono adapter

## 0.0.8

### Patch Changes

- [`a586702`](https://github.com/org-utils/api-response/commit/a586702c9df3a54499abe1fa7081911c23571dbe) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - updated typescript deps

## 0.0.7

### Patch Changes

- [`307b2b3`](https://github.com/org-utils/api-response/commit/307b2b3debcf56341ffc07061fca935108f6a9ad) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - updated packages version

- [`307b2b3`](https://github.com/org-utils/api-response/commit/307b2b3debcf56341ffc07061fca935108f6a9ad) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - updated ts cofnig

## 0.0.6

### Patch Changes

- [`f258cac`](https://github.com/org-utils/api-response/commit/f258cac978c535da26160643abc16121aad1f764) Thanks [@Anwarkamal143](https://github.com/Anwarkamal143)! - first changeset
