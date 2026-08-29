import { STATUS_CODES, ErrorDetail, HttpStatusCode } from "../shared/index.js";

/**
 * Options passed to error constructors (e.g. `AppError`, `ValidationError`,
 * etc.).
 *
 * @property details - Optional field-level error details. Typically used by
 *   `ValidationError` to provide per-field error information.
 * @property isOperational - Indicates if the error is an "operational" error
 *   (expected failure, safe to display to the user) or a programmer/unknown
 *   error (should be logged loudly, client sees generic message).
 * @property cause - The underlying error this one wraps, preserved for
 *   logging, never serialized to clients.
 * @property code - A stable, machine-readable error code from the `STATUS_CODES`
 *   union, or a custom string.
 * @property statusCode - The HTTP status code for this error.
 */
export interface AppErrorOptions {
  /** Field-level breakdown, typically used by ValidationError. */
  details?: ErrorDetail[];
  /**
   * Operational errors are expected, "normal" failures (bad input, not found,
   * a duplicate key, ...) - safe to report to the client as-is. Programmer
   * errors / unexpected exceptions (isOperational: false) should be logged
   * loudly and their details hidden from the client in production.
   */
  isOperational?: boolean;
  /** The underlying error this one wraps, if any (preserved for logging, never serialized to clients). */
  cause?: unknown;
  /** A stable, machine-readable error code. */
  code?: STATUS_CODES;
  /** The HTTP status code for this error. */
  statusCode?: HttpStatusCode;
}

/**
 * A normalized error shape returned by functions like `normalizeError`.
 *
 * This is the standardized representation of any error, ready to be used
 * in `ErrorResponse` bodies.
 *
 * @property code - Machine-readable error code (e.g. `"NOT_FOUND"`).
 * @property message - Human-readable error message.
 * @property statusCode - HTTP status code.
 * @property isOperational - Whether the error is operational (`true`) or
 *   programmer/unknown (`false`).
 * @property details - Optional field-level error details.
 * @property cause - The underlying error, if any.
 */
export interface NormalizedError {
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  details?: ErrorDetail[];
  cause?: unknown;
}