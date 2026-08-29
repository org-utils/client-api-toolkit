import type { ErrorDetail, HttpStatusCode, STATUS_CODES } from "../../shared/index.js";

/**
 * The kind of error that occurred during an API client request.
 *
 * These values are used to categorize `ApiClientError` instances so consumers
 * can distinguish between network issues, timeouts, cancellations, HTTP errors,
 * and unknown failures.
 *
 * @example
 * ```ts
 * if (err.kind === "network") {
 *   // Could not reach the server
 * } else if (err.kind === "timeout") {
 *   // Request timed out
 * }
 * ```
 */
export type ApiClientErrorKind =
  | "network"
  | "timeout"
  | "cancelled"
  | "http"
  | "parse"
  | "unknown";

/**
 * Options for creating an `ApiClientError`.
 *
 * @property kind - The category of error (e.g. `"network"`, `"timeout"`, `"http"`).
 * @property message - Human-readable error message.
 * @property statusCode - The HTTP status code, if applicable.
 * @property code - A machine-readable error code from the `STATUS_CODES` union,
 *   or a custom string.
 * @property details - Optional field-level error details.
 * @property cause - The underlying error that caused this failure, preserved for
 *   logging purposes.
 *
 * @example
 * ```ts
 * const error = new ApiClientError({
 *   kind: "http",
 *   message: "Not found",
 *   statusCode: 404,
 *   code: "NOT_FOUND",
 * });
 * ```
 */
export interface ApiClientErrorOptions {
  kind: ApiClientErrorKind;
  message: string;
  /** The HTTP status code, if applicable. */
  statusCode?: HttpStatusCode;
  /** A machine-readable error code from the `STATUS_CODES` union, or a custom string. */
  code?: STATUS_CODES;
  /** Optional field-level error details. */
  details?: ErrorDetail[];
  /** The underlying error that caused this failure. */
  cause?: unknown;
}