import { STATUS_CODES, ErrorDetail, HttpStatusCode } from "../shared/index.js";

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
  code?: STATUS_CODES;
  statusCode?: HttpStatusCode;
}

export interface NormalizedError {
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  details?: ErrorDetail[];
  cause?: unknown;
}
