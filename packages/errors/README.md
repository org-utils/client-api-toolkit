# client-api-errors

Shared error class hierarchy for Node.js and browser environments. Provides a
consistent, type-safe error model that maps cleanly to HTTP status codes and
includes operational awareness, details, and cause tracking.

## Installation

```bash
npm install client-api-errors
```

## Overview

Every error in this package extends `AppError`, which provides:

- **`statusCode`** - HTTP status code (e.g. 400, 404, 500)
- **`code`** - Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`)
- **`isOperational`** - `true` for expected failures (4xx), `false` for programmer/unknown errors (5xx)
- **`details`** - Optional field-level error details (typically for validation errors)
- **`cause`** - The underlying error, preserved for logging but never serialized to clients
- **`toJSON(includeStack?)`** - Serializes to a plain object safe for JSON responses

## Error Classes

All errors extend `AppError` and map to specific HTTP status codes:

| Class | Status Code | Default Message | Key Features |
|---|---|---|---|
| `BadRequestError` | 400 | "Bad request" | |
| `ValidationError` | 422 | "Validation failed" | Accepts `details?: ErrorDetail[]` for field errors |
| `UnauthorizedError` | 401 | "Authentication required" | |
| `ForbiddenError` | 403 | "You do not have permission to perform this action" | |
| `NotFoundError` | 404 | "Resource not found" | |
| `MethodNotAllowedError` | 405 | "Method not allowed" | |
| `ConflictError` | 409 | "Resource conflict" | |
| `GoneError` | 410 | "Resource no longer available" | |
| `PreconditionFailedError` | 412 | "Precondition failed" | |
| `PayloadTooLargeError` | 413 | "Payload too large" | |
| `UnsupportedMediaTypeError` | 415 | "Unsupported media type" | |
| `UnprocessableEntityError` | 422 | "Unprocessable entity" | Alias for validation errors |
| `TooManyRequestsError` | 429 | "Too many requests" | Optional `retryAfterSeconds` |
| `InternalServerError` | 500 | "Internal server error" | `isOperational: false` by default |
| `NotImplementedError` | 501 | "Not implemented" | |
| `BadGatewayError` | 502 | "Bad gateway" | `isOperational: false` |
| `ServiceUnavailableError` | 503 | "Service temporarily unavailable" | `isOperational: false` |
| `GatewayTimeoutError` | 504 | "Gateway timeout" | `isOperational: false` |
| `CustomError` | 500 | "Internal server error" | Extend for domain-specific errors |

## Usage

### Throwing errors in handlers

```ts
import {
  NotFoundError, ValidationError, TooManyRequestsError,
  InternalServerError
} from "client-api-errors";

throw new NotFoundError(`User ${id} not found`);
throw new ValidationError("Invalid input", [{ field: "email", message: "must be a valid email" }]);
throw new TooManyRequestsError("Slow down", 30); // with retryAfterSeconds
```

### Catching and normalizing errors

```ts
import { normalizeError, errorResponse } from "client-api-errors";

try {
  await doSomething();
} catch (err) {
  const appError = normalizeError(err); // safely handles Error, strings, arbitrary values
  const body = errorResponse(appError, {
    includeStack: process.env.NODE_ENV !== "production",
  });
  res.status(body.statusCode).json(body);
}
```

### Creating custom errors

```ts
class InsufficientFundsError extends AppError {
  constructor(accountId: string) {
    super(
      `Account ${accountId} has insufficient funds`,
      402, // HTTP 402
      "INSUFFICIENT_FUNDS",
    );
  }
}
```

### Using `createAppError` factory

```ts
import { createAppError } from "client-api-errors";

const appError = createAppError({
  httpStatuses: { CUSTOM: 499 },
  errorCodes: { CUSTOM: "CUSTOM_ERROR" },
});

// Convenience methods for each HTTP status
appError.notFound("Resource not found");           // new NotFoundError(...)
appError.validation("Invalid input", [{ field: "name", message: "required" }]); // new ValidationError(...)
appError.unauthorized("Authentication required");   // new UnauthorizedError(...)
appError.forbidden("You do not have permission");   // new ForbiddenError(...)
appError.notFound("Resource not found");           // new NotFoundError(...)
appError.methodNotAllowed("Method not allowed");   // new MethodNotAllowedError(...)
appError.conflict("Resource conflict");            // new ConflictError(...)
appError.gone("Resource no longer available");     // new GoneError(...)
appError.preconditionFailed("Precondition failed"); // new PreconditionFailedError(...)
appError.payloadTooLarge("Payload too large");     // new PayloadTooLargeError(...)
appError.unsupportedMediaType("Unsupported media type"); // new UnsupportedMediaTypeError(...)
appError.unprocessableEntity("Unprocessable entity"); // new ValidationError(...)
appError.tooManyRequests("Slow down", 30);         // new TooManyRequestsError(..., 30)
appError.internalServerError("Internal error");    // new InternalServerError(...)
appError.notImplemented("Not implemented");        // new NotImplementedError(...)
appError.badGateway("Bad gateway");               // new BadGatewayError(...)
appError.serviceUnavailable("Service unavailable"); // new ServiceUnavailableError(...)
appError.gatewayTimeout("Gateway timeout");        // new GatewayTimeoutError(...)
appError.customError("Custom error");             // new CustomError(...)
```

The factory also exposes the merged status codes and error codes:

```ts
appError.HTTP_STATUS.CUSTOM; // 499
appError.ERROR_CODES.CUSTOM; // "CUSTOM_ERROR"
```

### Error details shape

```ts
interface ErrorDetail {
  /** Dot-path of the offending field, e.g. "address.zipCode". Omitted for non-field errors. */
  field?: string;
  /** Human-readable explanation of what's wrong with this field. */
  message: string;
  /** Machine-readable sub-code for this specific detail (e.g. "too_small", "invalid_type"). */
  code?: STATUS_CODES;
  /** The value that failed validation. */
  value?: unknown;
  [key: string]: unknown;
}
```

## API

**Exported error classes:**

- `AppError` - Base error class
- `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`
- `MethodNotAllowedError`, `ConflictError`, `GoneError`, `PreconditionFailedError`
- `PayloadTooLargeError`, `UnsupportedMediaTypeError`, `UnprocessableEntityError`
- `TooManyRequestsError`, `InternalServerError`, `NotImplementedError`, `BadGatewayError`
- `ServiceUnavailableError`, `GatewayTimeoutError`, `CustomError`

**Exported functions:**

- `httpError(statusCode, message?, options?)` - Dispatch to appropriate error class
- `normalizeError(error)` - Convert any value to a well-formed `AppError`
- `createAppError(config)` - Factory with convenience methods for all status codes
- `isAppError(error)` - Type guard
- `isOperationalError(error)` - Type guard

**Exported types:**

- `AppErrorOptions` - Options passed to error constructors
- `ErrorDetail` - Field-level error detail
- `ErrorPayload` - Shape of `AppError.toJSON()` output
- `HttpStatus` - HTTP status code mapping
- `ErrorCode` - String literal union of all error codes