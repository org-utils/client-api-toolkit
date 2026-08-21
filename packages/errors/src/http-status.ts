/**
 * The subset of HTTP status codes this library's built-in errors use.
 * Exported so consumers can reference the same constants (e.g. in tests)
 * instead of magic numbers.
 */
import { STATUS_CODES } from 'client-api-types'
export const HttpStatus: Record<STATUS_CODES, number> = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  UNSUPPORTED_MEDIA_TYPE: 415,
  VALIDATION_ERROR: 422,
  UNKNOWN_ERROR: 500,
} as const;
export type HttpStatusCode =
  | (typeof HttpStatus)[keyof typeof HttpStatus]
  | (number & {});
