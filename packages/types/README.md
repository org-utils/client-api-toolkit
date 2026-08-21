# client-api-types

Shared TypeScript types and utilities for JavaScript and TypeScript applications.

`client-api-types` is a lightweight, dependency-free package designed to provide reusable TypeScript declarations across frontend applications, backend services, API clients, and shared packages.

The package is intentionally **type-only at runtime**. It does not ship JavaScript bundles. All public exports resolve to generated `.d.ts` files.

## Features

* 📦 TypeScript-first package
* 🧩 Separate public entry points
* 🌐 Works across frontend and backend projects
* ⚡ Zero runtime dependencies
* 🪶 Lightweight package footprint
* 🔒 Strictly typed public APIs
* ♻️ Reusable shared types
* 📁 API-specific types
* 💻 Client-specific types
* 🔄 Shared types between client and server
* 📦 ESM-compatible package exports
* 🚀 Declaration-only builds
* 🦋 Changesets-ready release workflow

---

## Installation

Using npm:

```bash
npm install client-api-types
```

Using pnpm:

```bash
pnpm add client-api-types
```

Using Yarn:

```bash
yarn add client-api-types
```

Using Bun:

```bash
bun add client-api-types
```

---

# Package Structure

The package exposes four public entry points:

```text
client-api-types
├── client-api-types
├── client-api-types/api
├── client-api-types/client
└── client-api-types/shared
```

Each entry point is independently importable.

---

# Root Import

Use the root package when you need the primary public types.

```ts
import type {
  SomeType,
  SomeOptions,
} from "client-api-types";
```

The root entry point resolves to:

```text
dist/index.d.ts
```

---

# API Types

Use the `/api` entry point for API-specific types.

```ts
import type {
  ApiResponse,
  ApiError,
  ApiRequest,
} from "client-api-types/api";
```

This is useful for:

* API request types
* API response types
* pagination types
* API errors
* resource types
* server contracts
* HTTP-related types

Example:

```ts
import type { ApiResponse } from "client-api-types/api";

interface User {
  id: string;
  name: string;
  email: string;
}

type GetUserResponse = ApiResponse<User>;
```

The API entry point resolves to:

```text
dist/api/index.d.ts
```

---

# Client Types

Use `/client` for types intended to be consumed by frontend applications and API clients.

```ts
import type {
  ClientOptions,
  RequestOptions,
} from "client-api-types/client";
```

This is useful for:

* API client configuration
* request configuration
* frontend state types
* client-side resource types
* query configuration
* HTTP client contracts

Example:

```ts
import type { RequestOptions } from "client-api-types/client";

const options: RequestOptions = {
  headers: {
    Authorization: "Bearer token",
  },
};
```

The client entry point resolves to:

```text
dist/client/index.d.ts
```

---

# Shared Types

Use `/shared` for types that need to be consumed by multiple parts of an application.

```ts
import type {
  User,
  Pagination,
  SortDirection,
} from "client-api-types/shared";
```

This is particularly useful in monorepos where the same types are used by:

```text
Frontend
   │
   ├── Next.js
   ├── React
   └── Vue
        │
        ▼
    client-api-types
        ▲
        │
   ├── API service
   ├── Node.js service
   ├── Worker
   └── CLI
```

The shared entry point resolves to:

```text
dist/shared/index.d.ts
```

---

# Recommended Usage

For application-wide shared contracts:

```ts
import type {
  User,
  Product,
  Order,
} from "client-api-types/shared";
```

For API contracts:

```ts
import type {
  ApiResponse,
  ApiError,
} from "client-api-types/api";
```

For frontend/client contracts:

```ts
import type {
  RequestOptions,
  ClientOptions,
} from "client-api-types/client";
```

Avoid importing internal files directly.

Do not do:

```ts
import type { User } from "client-api-types/dist/shared/user";
```

Instead use:

```ts
import type { User } from "client-api-types/shared";
```

This keeps consumers independent from the internal package structure.

---

# Type-Only Package

`client-api-types` intentionally ships declaration files instead of runtime JavaScript.

For example:

```ts
import type { User } from "client-api-types/shared";
```

The import is erased by TypeScript during compilation.

You should therefore use:

```ts
import type { User } from "client-api-types/shared";
```

rather than:

```ts
import { User } from "client-api-types/shared";
```

when importing types.

This keeps the package completely runtime-independent.

---

# Build

The package uses TypeScript to generate declaration files.

Run:

```bash
npm run build
```

This performs:

```text
clean
  │
  ▼
TypeScript declaration generation
  │
  ▼
dist/
```

The build command is:

```bash
npm run clean && npm run build:types
```

Declaration generation is handled by:

```bash
tsc --emitDeclarationOnly
```

No JavaScript bundles are generated.

---

# Generated Output

After building, the package should have a structure similar to:

```text
dist/
├── index.d.ts
│
├── api/
│   └── index.d.ts
│
├── client/
│   └── index.d.ts
│
└── shared/
    └── index.d.ts
```

Only files inside `dist` are included in the published package.

---

# Type Checking

Run:

```bash
npm run typecheck
```

This executes:

```bash
tsc --noEmit
```

It validates the project without generating files.

---

# Formatting

Format the project with:

```bash
npm run format
```

Check formatting without modifying files:

```bash
npm run format:check
```

The package uses Prettier for formatting.

---

# Linting

Run:

```bash
npm run lint
```

ESLint validates the source code and project configuration.

---

# Publishing

The package uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

Initialize Changesets:

```bash
npm run changesets:init
```

Create a changeset:

```bash
npm run changeset
```

Choose the appropriate release type:

```text
patch
minor
major
```

For example:

```text
feat: add pagination types
```

would normally be a:

```text
minor
```

release.

---

# Release Workflow

A typical release workflow is:

```bash
npm run changeset
```

Then commit the generated changeset:

```bash
git add .
git commit -m "chore: add changeset"
```

When you're ready to create the release:

```bash
npm run version
```

This updates:

* `package.json`
* package versions
* changelog files

Review the changes:

```bash
git diff
```

Then commit them:

```bash
git add .
git commit -m "chore: version packages"
```

Finally publish:

```bash
npm run publish
```

The publish script executes:

```bash
changeset publish
```

---

# NPM Package Configuration

The package exposes only declaration files:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.d.ts"
    },
    "./api": {
      "types": "./dist/api/index.d.ts",
      "default": "./dist/api/index.d.ts"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "default": "./dist/client/index.d.ts"
    },
    "./shared": {
      "types": "./dist/shared/index.d.ts",
      "default": "./dist/shared/index.d.ts"
    }
  }
}
```

This means consumers cannot accidentally depend on internal source files.

---

# TypeScript Configuration

The package requires TypeScript:

```text
TypeScript >= 7
```

and Node.js:

```text
Node.js >= 20
```

The package itself does not require a runtime dependency.

---

# Framework Compatibility

Because `client-api-types` contains declarations rather than framework-specific runtime code, it can be used with:

### Frontend

* React
* Next.js
* Vue
* Nuxt
* Angular
* Svelte
* Vite
* Remix

### Backend

* Node.js
* Express
* Fastify
* NestJS
* Hono
* Koa

### Other environments

* Workers
* CLI applications
* Serverless functions
* Monorepos
* Shared libraries

---

# Monorepo Usage

`client-api-types` is particularly useful in a monorepo.

For example:

```text
apps/
├── web/
├── admin/
└── mobile/

services/
├── auth/
├── user/
├── product/
└── order/

packages/
└── client-api-types/
```

The applications and services can share contracts:

```ts
import type { User } from "client-api-types/shared";
```

and API contracts:

```ts
import type { ApiResponse } from "client-api-types/api";
```

This prevents duplicated interfaces across services.

---

# API Contract Example

A shared API contract could look like:

```ts
// packages/client-api-types/src/api/users.ts

import type { User } from "client-api-types/shared";

export interface GetUserParams {
  userId: string;
}

export interface GetUserResponse {
  data: User;
}
```

The frontend:

```ts
import type {
  GetUserParams,
  GetUserResponse,
} from "client-api-types/api";
```

The backend:

```ts
import type {
  GetUserParams,
  GetUserResponse,
} from "client-api-types/api";
```

Both sides now consume the same contract.

---

# Design Principles

`client-api-types` follows several principles.

## 1. No Runtime Dependencies

The package should remain lightweight and safe to use anywhere TypeScript is supported.

## 2. Type Safety

Public APIs should expose explicit and reusable TypeScript types.

## 3. Stable Public Exports

Consumers should import from:

```text
client-api-types
client-api-types/api
client-api-types/client
client-api-types/shared
```

rather than internal files.

## 4. Framework Agnostic

Types should not depend unnecessarily on React, Next.js, Express, Fastify, or another specific framework.

## 5. Separation of Concerns

API, client, and shared contracts should remain separated when they have different consumers.

---

# Development

Clone the repository:

```bash
git clone https://github.com/org-utils/types.git
```

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Type check:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Format:

```bash
npm run format
```

---

# Scripts

| Script                    | Description                     |
| ------------------------- | ------------------------------- |
| `npm run clean`           | Remove generated files          |
| `npm run build:types`     | Generate `.d.ts` files          |
| `npm run build`           | Clean and generate declarations |
| `npm run typecheck`       | Type-check without emitting     |
| `npm run lint`            | Run ESLint                      |
| `npm run format`          | Format source files             |
| `npm run format:check`    | Check formatting                |
| `npm run changesets:init` | Initialize Changesets           |
| `npm run changeset`       | Create a changeset              |
| `npm run version`         | Apply pending changesets        |
| `npm run publish`         | Publish packages to npm         |

---

# License

MIT © Anwar Kamal

---

# Repository

Repository:

`https://github.com/org-utils/types`

Issues and feature requests can be submitted through the project's GitHub repository.

```
```
