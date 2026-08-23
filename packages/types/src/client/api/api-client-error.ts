import type { ErrorDetail, HttpStatusCode, STATUS_CODES } from "../../shared/index.js";

export type ApiClientErrorKind =
  | "network"
  | "timeout"
  | "cancelled"
  | "http"
  | "parse"
  | "unknown";

export interface ApiClientErrorOptions {
  kind: ApiClientErrorKind;
  message: string;
  statusCode?: HttpStatusCode;
  /** Machine-readable code from the server's ErrorResponse, or a local one like `"NETWORK_ERROR"`. */
  code?: STATUS_CODES;
  details?: ErrorDetail[];
  cause?: unknown;
}
