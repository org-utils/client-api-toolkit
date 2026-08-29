import type {
  AppErrorOptions,
  ErrorDetail,
  ErrorPayload,
} from "client-api-types";

/**
 * A symbol brand used for type-level checks to ensure values are genuine
 * `AppError` instances. Uses `Symbol.for` so it survives duplicate bundles.
 */
export const APP_ERROR_BRAND = Symbol.for(
  "app-errors.AppError",
); // Symbol.for is registry-wide, survives duplicate bundles
function captureStackTrace(error: Error, constructor?: Function): void {
  const ErrorWithCaptureStackTrace = Error as ErrorConstructor & {
    captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
  };

  ErrorWithCaptureStackTrace.captureStackTrace?.(error, constructor);
}
/**
 * Base error class for the `client-api-errors` package.
 *
 * Every error in this package extends `AppError`, which provides a consistent
 * shape with `statusCode`, `code`, `isOperational`, and optional `details` /
 * `cause`. Errors are marked with a brand symbol for type-level validation.
 *
 * @template Message - The error message string.
 *
 * @property readonly statusCode - HTTP status code (e.g. 400, 404, 500).
 * @property readonly code - Machine-readable error code (e.g. `"NOT_FOUND"`,
 *   `"VALIDATION_ERROR"`).
 * @property readonly isOperational - `true` for expected failures (4xx), safe
 *   to display the message to the user; `false` for programmer/unknown errors
 *   (5xx), which should be logged and shown a generic message.
 * @property readonly details - Optional field-level error details. Typically
 *   present for validation errors (`ValidationError`).
 * @property readonly cause - The underlying error preserved for logging; never
 *   serialized to the client.
 *
 * @example
 * ```ts
 * throw new NotFoundError(`User ${id} not found`);
 * throw new ValidationError("Invalid input", [{ field: "email", message: "required" }]);
 * ```
 */
export interface AppError extends Error {
  readonly [APP_ERROR_BRAND]: true;
}
export class AppError extends Error {
  /**
   * A symbol brand used for type-level checks to ensure values are genuine
   * `AppError` instances. Uses `Symbol.for` so it survives duplicate bundles.
   */
  readonly [APP_ERROR_BRAND] = true
  /**
   * HTTP status code (e.g. 400, 404, 500).
   */
  readonly statusCode: number;
  /**
   * Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`).
   */
  readonly code: string;
  /**
   * Indicates if the error is an "operational" error (expected failure, 4xx)
   * or a programmer/unknown error (5xx).
   *
   * - `true` (default for 4xx): safe to display the message to the user.
   * - `false` (default for 5xx): should be logged loudly; client should see
   *   a generic message.
   */
  readonly isOperational: boolean;
  /**
   * Optional field-level error details. Typically present for validation
   * errors.
   */
  readonly details?: ErrorDetail[];

  /**
   * Creates a new AppError instance.
   *
   * @param message - Human-readable error message.
   * @param statusCode - HTTP status code.
   * @param code - Machine-readable error code (e.g. `"NOT_FOUND"`).
   * @param options - Additional options: `details`, `isOperational`, `cause`, `code`, `statusCode`.
   * @param name - Error name (defaults to class name).
   *
   * @example
   * ```ts
   * throw new AppError("Bad request", 400, "BAD_REQUEST");
   * throw new ValidationError("Invalid input", [{ field: "email", message: "required" }]);
   * ```
   */
  constructor(message: string, statusCode: number, code: string, options: AppErrorOptions = {}, name?: string) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = name  || this.constructor.name || "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options.isOperational ?? true;
    if (options.details) this.details = options.details;

    // Keeps the constructor call itself out of the stack trace (V8 only; no-op elsewhere).
    captureStackTrace(this, new.target);
  }

  /** Serializes to the `error` payload shape used inside ErrorResponse. `includeStack` defaults to false. */
  toJSON(includeStack = false): ErrorPayload {
    const payload: ErrorPayload = { code: this.code, message: this.message };
    if (this.details) payload.details = this.details;
    if (includeStack && this.stack) payload.stack = this.stack;
    return payload;
  }
}
