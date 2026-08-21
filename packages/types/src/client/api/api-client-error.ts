import type { ErrorDetail } from "../../shared/index.js";

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
  statusCode?: number;
  /** Machine-readable code from the server's ErrorResponse, or a local one like `"NETWORK_ERROR"`. */
  code?: string;
  details?: ErrorDetail[];
  cause?: unknown;
}
