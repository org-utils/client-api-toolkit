import type {
  AppErrorOptions,
  ErrorDetail,
  ErrorPayload,
} from "client-api-types";

export const APP_ERROR_BRAND = Symbol.for(
  "app-errors.AppError",
); // Symbol.for is registry-wide, survives duplicate bundles
function captureStackTrace(error: Error, constructor?: Function): void {
  const ErrorWithCaptureStackTrace = Error as ErrorConstructor & {
    captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
  };

  ErrorWithCaptureStackTrace.captureStackTrace?.(error, constructor);
}
export interface AppError extends Error {
  readonly [APP_ERROR_BRAND]: true;
}
export class AppError extends Error {
  readonly [APP_ERROR_BRAND] = true
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;
  readonly details?: ErrorDetail[];

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
