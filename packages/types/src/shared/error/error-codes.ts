/**
 * Stable, machine-readable codes used as `error.code` in every ErrorResponse.
 * Consumers should switch/match on these rather than parsing `error.message`.
 *
 * This is the closed set of built-in codes. Domain-specific codes are expressed
 * via `CustomError` / `AppErrorOptions.code` as a plain `string`, not by
 * widening this union.
 */
export type STATUS_CODES =
  "CREATED"
  | "OK"
  | "NO_CONTENT"
  | "BAD_REQUEST"
  | "ACCEPTED"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CONFLICT"
  | "GONE"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UNPROCESSABLE_ENTITY"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_IMPLEMENTED"
  | "BAD_GATEWAY"
  | "SERVICE_UNAVAILABLE"
  | "GATEWAY_TIMEOUT"
  | "UNKNOWN_ERROR"
  | (string & {})
