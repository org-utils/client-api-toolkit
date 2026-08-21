/**
 * Stable, machine-readable codes used as `error.code` in every ErrorResponse.
 * Consumers should switch/match on these rather than parsing `error.message`
 * (which is free-text and may change wording over time).
 */
import type { ErrorCode as ERRCodes } from "client-api-types";
export const ErrorCode: Record<ERRCodes, ERRCodes> = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  GONE: "GONE",
  PRECONDITION_FAILED: "PRECONDITION_FAILED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
  BAD_GATEWAY: "BAD_GATEWAY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode =
  | ERRCodes
  | (string & {});
