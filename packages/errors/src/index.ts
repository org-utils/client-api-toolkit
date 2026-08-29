

/**
 * `client-api-errors` - Shared error class hierarchy for Node.js and browser
 * environments. Provides a consistent, type-safe error model that maps cleanly
 * to HTTP status codes and includes operational awareness, details, and cause
 * tracking.
 *
 * Every error in this package extends `AppError`, which provides:
 * - `statusCode` - HTTP status code (e.g. 400, 404, 500)
 * - `code` - Machine-readable error code (e.g. `"NOT_FOUND"`, `"VALIDATION_ERROR"`)
 * - `isOperational` - `true` for expected failures (4xx), `false` for
 *   programmer/unknown errors (5xx)
 * - `details` - Optional field-level error details (typically for validation errors)
 * - `cause` - The underlying error, preserved for logging but never serialized
 *   to clients
 * - `toJSON(includeStack?)` - Serializes to a plain object safe for JSON responses
 */
import { AppError, type AppError as APPERR } from "./app-error.js";
import  {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  ConflictError,
  GoneError,
  PreconditionFailedError,
  PayloadTooLargeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  NotImplementedError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  CustomError,
  UnsupportedMediaTypeError,
  ValidationError
} from "./http-errors.js";
import { HttpStatus } from "./http-status.js";
import { ErrorCode } from "./error-codes.js";
export * from './error-guards.js';
export * from './error-normalize.js';
export * from './http-errors.js';
export * from './createAppError.js';

import type {
  AppErrorOptions,
} from "client-api-types";

export function httpError(
  statusCode: number,
  message?: string,
  options?: AppErrorOptions,
): APPERR {
  /**
   * Dispatches to the appropriate error class based on the given HTTP status code.
   *
   * If the status code matches a built-in error class, an instance of that
   * class is returned. Otherwise, a generic `AppError` is returned with the
   * provided status code and a code formatted as `"HTTP_${statusCode}"`.
   *
   * @param statusCode - HTTP status code.
   * @param message - Optional custom error message. Defaults to the class's
   *   default message if not provided.
   * @param options - Additional options passed to the error constructor,
   *   such as `details`, `isOperational`, `cause`, etc.
   *
   * @returns An instance of the appropriate error class, or a generic
   *   `AppError` for unmatched status codes.
   *
   * @example
   * ```ts
   * import { httpError } from "client-api-errors";
   *
   * const err = httpError(404, "User not found");
   * // returns new NotFoundError("User not found")
   *
   * const err = httpError(500, "Something went wrong");
   * // returns new InternalServerError("Something went wrong")
   *
   * const err = httpError(499, "Custom error");
   * // returns new AppError("Custom error", 499, "HTTP_499")
   * ```
   */
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return new BadRequestError(
        message,
        options,
      );

    case HttpStatus.UNAUTHORIZED:
      return new UnauthorizedError(
        message,
        options,
      );

    case HttpStatus.FORBIDDEN:
      return new ForbiddenError(
        message,
        options,
      );

    case HttpStatus.NOT_FOUND:
      return new NotFoundError(
        message,
        options,
      );

    case HttpStatus.METHOD_NOT_ALLOWED:
      return new MethodNotAllowedError(
        message,
        options,
      );

    case HttpStatus.CONFLICT:
      return new ConflictError(
        message,
        options,
      );

    case HttpStatus.GONE:
      return new GoneError(
        message,
        options,
      );

    case HttpStatus.PRECONDITION_FAILED:
      return new PreconditionFailedError(
        message,
        options,
      );

    case HttpStatus.PAYLOAD_TOO_LARGE:
      return new PayloadTooLargeError(
        message,
        options,
      );

    case HttpStatus.UNPROCESSABLE_ENTITY:
      return new UnprocessableEntityError(
        message,
        options,
      );

    case HttpStatus.TOO_MANY_REQUESTS:
      return new TooManyRequestsError(
        message,
        undefined,
        options,
      );

    case HttpStatus.INTERNAL_SERVER_ERROR:
      return new InternalServerError(
        message,
        options,
      );

    case HttpStatus.NOT_IMPLEMENTED:
      return new NotImplementedError(
        message,
        options,
      );

    case HttpStatus.BAD_GATEWAY:
      return new BadGatewayError(
        message,
        options,
      );

    case HttpStatus.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableError(
        message,
        options,
      );

    case HttpStatus.GATEWAY_TIMEOUT:
      return new GatewayTimeoutError(
        message,
        options,
      );

    default:
      return new AppError(
        message ?? "Application error",
        statusCode,
        `HTTP_${statusCode}`,
        options,
      );
  }
}

export  {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  ConflictError,
  GoneError,
  PreconditionFailedError,
  PayloadTooLargeError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  NotImplementedError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  AppError,
  ValidationError,
  UnsupportedMediaTypeError,
  CustomError,
  HttpStatus,
  ErrorCode
} ;
