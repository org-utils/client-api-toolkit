import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";
import { HttpStatus } from "./http-status.js";
import type {
  AppErrorOptions,
  ErrorDetail,
} from "client-api-types";

/**
 * Error returned for bad requests (HTTP 400).
 *
 * @param message - Custom error message. Defaults to `"Bad request"`.
 * @param options - Additional options: `details`, `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"BadRequestError"`.
 *
 * @example
 * ```ts
 * throw new BadRequestError("Invalid JSON payload");
 * throw new BadRequestError(); // defaults to "Bad request"
 * ```
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request", options?: AppErrorOptions, name?: string) {
    const { statusCode = HttpStatus.BAD_REQUEST, code = ErrorCode.BAD_REQUEST, ...rest } = options || {}
    super(message,  statusCode, code, rest, name);
    this.name = name ?? "BadRequestError";
  }
}

/**
 * Error returned for validation failures (HTTP 422).
 *
 * @param message - Custom error message. Defaults to `"Validation failed"`.
 * @param details - Optional field-level error details. Each detail should be an
 *   object conforming to the `ErrorDetail` interface.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"ValidationError"`.
 *
 * @example
 * ```ts
 * throw new ValidationError("Invalid input", [{ field: "email", message: "must be a valid email" }]);
 * throw new ValidationError("Invalid input"); // no details
 * ```
 */
export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details?: ErrorDetail[],
    options: AppErrorOptions = {},
    name?: string,
  ) {
    const { statusCode = HttpStatus.UNPROCESSABLE_ENTITY, code = ErrorCode.VALIDATION_ERROR, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        ...rest,
        ...(details
          ? { details }
          : {}),
      },
      name,
    );
    this.name = name ?? "ValidationError";
  }
}

/**
 * Error returned for unauthorized access (HTTP 401).
 *
 * @param message - Custom error message. Defaults to `"Authentication required"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"UnauthorizedError"`.
 *
 * @example
 * ```ts
 * throw new UnauthorizedError("Invalid API key");
 * throw new UnauthorizedError(); // defaults to "Authentication required"
 * ```
 */
export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication required",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.UNAUTHORIZED, code = ErrorCode.UNAUTHORIZED, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "UnauthorizedError";
  }
}

/**
 * Error returned for forbidden access (HTTP 403).
 *
 * @param message - Custom error message. Defaults to
 *   `"You do not have permission to perform this action"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"ForbiddenError"`.
 *
 * @example
 * ```ts
 * throw new ForbiddenError("Insufficient scope");
 * throw new ForbiddenError(); // defaults to default message
 * ```
 */
export class ForbiddenError extends AppError {
  constructor(
    message =
      "You do not have permission to perform this action",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.FORBIDDEN, code = ErrorCode.FORBIDDEN, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "ForbiddenError";
  }
}

/**
 * Error returned when a resource is not found (HTTP 404).
 *
 * @param message - Custom error message. Defaults to `"Resource not found"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"NotFoundError"`.
 *
 * @example
 * ```ts
 * throw new NotFoundError(`User ${id} not found`);
 * throw new NotFoundError(); // defaults to "Resource not found"
 * ```
 */
export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.NOT_FOUND, code = ErrorCode.NOT_FOUND, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "NotFoundError";
  }
}

/**
 * Error returned when a method is not allowed (HTTP 405).
 *
 * @param message - Custom error message. Defaults to `"Method not allowed"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"MethodNotAllowedError"`.
 *
 * @example
 * ```ts
 * throw new MethodNotAllowedError("POST method not allowed on this resource");
 * throw new MethodNotAllowedError(); // defaults to "Method not allowed"
 * ```
 */
export class MethodNotAllowedError extends AppError {
  constructor(
    message = "Method not allowed",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.METHOD_NOT_ALLOWED, code = ErrorCode.METHOD_NOT_ALLOWED, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "MethodNotAllowedError";
  }
}

/**
 * Error returned when there is a resource conflict (HTTP 409).
 *
 * @param message - Custom error message. Defaults to `"Resource conflict"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"ConflictError"`.
 *
 * @example
 * ```ts
 * throw new ConflictError("Resource already exists");
 * throw new ConflictError(); // defaults to "Resource conflict"
 * ```
 */
export class ConflictError extends AppError {
  constructor(
    message = "Resource conflict",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.CONFLICT, code = ErrorCode.CONFLICT, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "ConflictError";
  }
}

/**
 * Error returned when a resource is gone (HTTP 410).
 *
 * @param message - Custom error message. Defaults to `"Resource no longer available"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"GoneError"`.
 *
 * @example
 * ```ts
 * throw new GoneError("Product has been discontinued");
 * throw new GoneError(); // defaults to "Resource no longer available"
 * ```
 */
export class GoneError extends AppError {
  constructor(
    message = "Resource no longer available",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.GONE, code = ErrorCode.GONE, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "GoneError";
  }
}

/**
 * Error returned when a precondition failed (HTTP 412).
 *
 * @param message - Custom error message. Defaults to `"Precondition failed"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"PreconditionFailedError"`.
 *
 * @example
 * ```ts
 * throw new PreconditionFailedError("ETag mismatch");
 * throw new PreconditionFailedError(); // defaults to "Precondition failed"
 * ```
 */
export class PreconditionFailedError extends AppError {
  constructor(
    message = "Precondition failed",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.PRECONDITION_FAILED, code = ErrorCode.PRECONDITION_FAILED, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "PreconditionFailedError";
  }
}

/**
 * Error returned when the payload is too large (HTTP 413).
 *
 * @param message - Custom error message. Defaults to `"Payload too large"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"PayloadTooLargeError"`.
 *
 * @example
 * ```ts
 * throw new PayloadTooLargeError("Request body exceeds 1MB limit");
 * throw new PayloadTooLargeError(); // defaults to "Payload too large"
 * ```
 */
export class PayloadTooLargeError extends AppError {
  constructor(
    message = "Payload too large",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.PAYLOAD_TOO_LARGE, code = ErrorCode.PAYLOAD_TOO_LARGE, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "PayloadTooLargeError";
  }
}

/**
 * Error returned when the media type is unsupported (HTTP 415).
 *
 * @param message - Custom error message. Defaults to `"Unsupported media type"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"UnsupportedMediaTypeError"`.
 *
 * @example
 * ```ts
 * throw new UnsupportedMediaTypeError("Expected application/json");
 * throw new UnsupportedMediaTypeError(); // defaults to "Unsupported media type"
 * ```
 */
export class UnsupportedMediaTypeError extends AppError {
  constructor(
    message = "Unsupported media type",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.UNSUPPORTED_MEDIA_TYPE, code = ErrorCode.UNSUPPORTED_MEDIA_TYPE, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "UnsupportedMediaTypeError";
  }
}

/**
 * Error returned for unprocessable entity (HTTP 422).
 *
 * @param message - Custom error message. Defaults to `"Unprocessable entity"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"UnprocessableEntityError"`.
 *
 * @example
 * ```ts
 * throw new UnprocessableEntityError("Unsupported format");
 * throw new UnprocessableEntityError(); // defaults to "Unprocessable entity"
 * ```
 */
export class UnprocessableEntityError extends AppError {
  constructor(
    message = "Unprocessable entity",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.UNPROCESSABLE_ENTITY, code = ErrorCode.UNPROCESSABLE_ENTITY, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "UnprocessableEntityError";
  }
}

/**
 * Error returned when too many requests (HTTP 429).
 *
 * @param message - Custom error message. Defaults to `"Too many requests"`.
 * @param retryAfterSeconds - Optional number of seconds to retry after.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"TooManyRequestsError"`.
 *
 * @example
 * ```ts
 * throw new TooManyRequestsError("Slow down", 30); // retry after 30 seconds
 * throw new TooManyRequestsError(); // defaults to "Too many requests"
 * ```
 */
export class TooManyRequestsError extends AppError {
  readonly retryAfterSeconds?: number;

  constructor(
    message = "Too many requests",
    retryAfterSeconds?: number,
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.TOO_MANY_REQUESTS, code = ErrorCode.TOO_MANY_REQUESTS, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "TooManyRequestsError";

    if (
      retryAfterSeconds !== undefined
    ) {
      this.retryAfterSeconds =
        retryAfterSeconds;
    }
  }
}

/**
 * Error returned for internal server errors (HTTP 500).
 *
 * This error defaults to `isOperational: false`, meaning it represents an
 * unexpected programmer error. The message shown to the client should stay
 * generic in production; log the full error details for debugging.
 *
 * @param message - Custom error message. Defaults to `"Internal server error"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"InternalServerError"`.
 *
 * @example
 * ```ts
 * throw new InternalServerError("Database connection failed");
 * throw new InternalServerError(); // defaults to "Internal server error", isOperational: false
 * ```
 */
export class InternalServerError extends AppError {
  constructor(
    message = "Internal server error",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = ErrorCode.INTERNAL_SERVER_ERROR, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        isOperational: false,
        ...rest || {},
      },
      name,
    );
    this.name = name ?? "InternalServerError";
  }
}

/**
 * Error returned when a feature is not implemented (HTTP 501).
 *
 * @param message - Custom error message. Defaults to `"Not implemented"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"NotImplementedError"`.
 *
 * @example
 * ```ts
 * throw new NotImplementedError("Feature not yet available");
 * throw new NotImplementedError(); // defaults to "Not implemented"
 * ```
 */
export class NotImplementedError extends AppError {
  constructor(
    message = "Not implemented",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.NOT_IMPLEMENTED, code = ErrorCode.NOT_IMPLEMENTED, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      rest,
      name,
    );
    this.name = name ?? "NotImplementedError";
  }
}

/**
 * Error returned for bad gateway (HTTP 502).
 *
 * This error defaults to `isOperational: false`, meaning it represents an
 * unexpected error downstream. The message shown to the client should stay
 * generic in production.
 *
 * @param message - Custom error message. Defaults to `"Bad gateway"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"BadGatewayError"`.
 *
 * @example
 * ```ts
 * throw new BadGatewayError("Upstream service error");
 * throw new BadGatewayError(); // defaults to "Bad gateway", isOperational: false
 * ```
 */
export class BadGatewayError extends AppError {
  constructor(
    message = "Bad gateway",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.BAD_GATEWAY, code = ErrorCode.BAD_GATEWAY, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        isOperational: false,
        ...rest || {},
      },
      name,
    );
    this.name = name ?? "BadGatewayError";
  }
}

/**
 * Error returned when service is unavailable (HTTP 503).
 *
 * This error defaults to `isOperational: false`, meaning it represents a
 * temporary condition. The message shown to the client should stay generic
 * in production; log the full error details for debugging.
 *
 * @param message - Custom error message. Defaults to `"Service temporarily unavailable"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"ServiceUnavailableError"`.
 *
 * @example
 * ```ts
 * throw new ServiceUnavailableError("Database maintenance in progress");
 * throw new ServiceUnavailableError(); // defaults to "Service temporarily unavailable", isOperational: false
 * ```
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message = "Service temporarily unavailable",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.SERVICE_UNAVAILABLE, code = ErrorCode.SERVICE_UNAVAILABLE, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        isOperational: false,
        ...rest || {},
      },
      name,
    );
    this.name = name ?? "ServiceUnavailableError";
  }
}

/**
 * Error returned when gateway times out (HTTP 504).
 *
 * This error defaults to `isOperational: false`, meaning it represents a
 * gateway timeout condition. The message shown to the client should stay
 * generic in production.
 *
 * @param message - Custom error message. Defaults to `"Gateway timeout"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"GatewayTimeoutError"`.
 *
 * @example
 * ```ts
 * throw new GatewayTimeoutError("Upstream request timed out");
 * throw new GatewayTimeoutError(); // defaults to "Gateway timeout", isOperational: false
 * ```
 */
export class GatewayTimeoutError extends AppError {
  constructor(
    message = "Gateway timeout",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.GATEWAY_TIMEOUT, code = ErrorCode.GATEWAY_TIMEOUT, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        isOperational: false,
        ...rest || {},
      },
      name
    );
    this.name = name ?? "GatewayTimeoutError";
  }
}

/**
 * Error for domain-specific use cases (HTTP 500).
 *
 * Extend `AppError` directly for your own error types. This class provides
 * a default message and code of `"INTERNAL_SERVER_ERROR"`, with
 * `isOperational: false`.
 *
 * @param message - Custom error message. Defaults to `"Internal server error"`.
 * @param options - Additional options: `isOperational`, `cause`, etc.
 * @param name - Custom error name. Defaults to `"CustomError"`.
 *
 * @example
 * ```ts
 * class InsufficientFundsError extends AppError {
 *   constructor(accountId: string) {
 *     super(`Account ${accountId} has insufficient funds`, 402, "INSUFFICIENT_FUNDS");
 *   }
 * }
 * ```
 */
export class CustomError extends AppError {
  constructor(
    message = "Internal server error",
    options?: AppErrorOptions,
    name?: string,
  ) {
    const { statusCode = HttpStatus.INTERNAL_SERVER_ERROR, code = ErrorCode.INTERNAL_SERVER_ERROR, ...rest } = options || {}

    super(
      message,
      statusCode,
      code,
      {
        isOperational: false,
        ...rest || {},
      },
      name,
    );
    this.name = name ?? "CustomError";
  }
}
