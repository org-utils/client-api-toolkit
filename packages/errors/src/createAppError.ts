import { ErrorCode } from "./error-codes.js";
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  CustomError,
  ForbiddenError,
  GatewayTimeoutError,
  GoneError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  NotImplementedError,
  PayloadTooLargeError,
  PreconditionFailedError,
  ServiceUnavailableError,
  TooManyRequestsError,
  UnauthorizedError,
  UnsupportedMediaTypeError,
  ValidationError,
} from "./http-errors.js";
import { HttpStatus } from "./http-status.js";
import type { AppErrorOptions } from "client-api-types";
type ICustomStatuses = number[]
type ICustomErrorCodes = string[]
/**
 * Creates a factory of convenience methods for generating common HTTP error
 * instances.
 *
 * The returned object provides a method for each standard HTTP error status
 * code, making it easy to create typed errors in your handlers without
 * manually constructing each class.
 *
 * The factory also merges custom status codes and error codes into the
 * returned `HTTP_STATUS` and `ERROR_CODES` objects.
 *
 * @param config - Configuration object with optional custom HTTP status codes
 *   and error codes.
 * @param config.httpStatuses - Optional custom HTTP status code mappings
 *   (e.g., `{ CUSTOM: 499 }`).
 * @param config.errorCodes - Optional custom error code strings (e.g.,
 *   `{ CUSTOM: "CUSTOM_ERROR" }`).
 *
 * @returns An object with a method for each HTTP error type, plus
 *   `HTTP_STATUS` and `ERROR_CODES` merged with any custom values.
 *
 * @example
 * ```ts
 * const appError = createAppError({
 *   httpStatuses: { CUSTOM: 499 },
 *   errorCodes: { CUSTOM: "CUSTOM_ERROR" },
 * });
 *
 * // Convenience methods
 * appError.notFound("Resource not found");                    // new NotFoundError(...)
 * appError.validation("Invalid input", [{ field: "name", message: "required" }]); // new ValidationError(...)
 * appError.unauthorized("Authentication required");           // new UnauthorizedError(...)
 * appError.forbidden("You do not have permission");           // new ForbiddenError(...)
 * appError.notFound("Resource not found");                    // new NotFoundError(...)
 * appError.methodNotAllowed("Method not allowed");            // new MethodNotAllowedError(...)
 * appError.conflict("Resource conflict");                     // new ConflictError(...)
 * appError.gone("Resource no longer available");              // new GoneError(...)
 * appError.preconditionFailed("Precondition failed");         // new PreconditionFailedError(...)
 * appError.payloadTooLarge("Payload too large");              // new PayloadTooLargeError(...)
 * appError.unsupportedMediaType("Unsupported media type");    // new UnsupportedMediaTypeError(...)
 * appError.unprocessableEntity("Unprocessable entity");       // new ValidationError(...)
 * appError.tooManyRequests("Slow down", 30);                  // new TooManyRequestsError(..., 30)
 * appError.internalServerError("Internal error");             // new InternalServerError(...)
 * appError.notImplemented("Not implemented");                 // new NotImplementedError(...)
 * appError.badGateway("Bad gateway");                        // new BadGatewayError(...)
 * appError.serviceUnavailable("Service unavailable");         // new ServiceUnavailableError(...)
 * appError.gatewayTimeout("Gateway timeout");                 // new GatewayTimeoutError(...)
 * appError.customError("Custom error");                      // new CustomError(...)
 *
 * // Custom status/codes are merged into the returned objects:
 * appError.HTTP_STATUS.CUSTOM; // 499
 * appError.ERROR_CODES.CUSTOM; // "CUSTOM_ERROR"
 * ```
 */
export function createAppError<
  const TStatuses extends ICustomStatuses,
  const TCodes extends ICustomErrorCodes,
>(config: { httpStatuses?: TStatuses; errorCodes?: TCodes }) {
  const { httpStatuses = {}, errorCodes } = config || {};
  const result = {
    badRequest: (message?: string, options?: AppErrorOptions) =>
      new BadRequestError(message, options),

    validation: (message?: string, options?: AppErrorOptions) =>
      new ValidationError(message, undefined, options),

    unauthorized: (message?: string, options?: AppErrorOptions) =>
      new UnauthorizedError(message, options),

    forbidden: (message?: string, options?: AppErrorOptions) =>
      new ForbiddenError(message, options),

    notFound: (message?: string, options?: AppErrorOptions) =>
      new NotFoundError(message, options),

    methodNotAllowed: (message?: string, options?: AppErrorOptions) =>
      new MethodNotAllowedError(message, options),

    conflict: (message?: string, options?: AppErrorOptions) =>
      new ConflictError(message, options),

    gone: (message?: string, options?: AppErrorOptions) =>
      new GoneError(message, options),

    preconditionFailed: (message?: string, options?: AppErrorOptions) =>
      new PreconditionFailedError(message, options),

    payloadTooLarge: (message?: string, options?: AppErrorOptions) =>
      new PayloadTooLargeError(message, options),

    unsupportedMediaType: (message?: string, options?: AppErrorOptions) =>
      new UnsupportedMediaTypeError(message, options),

    unprocessableEntity: (message?: string, options?: AppErrorOptions) =>
      new ValidationError(message, undefined, options),

    tooManyRequests: (message?: string, options?: AppErrorOptions) =>
      new TooManyRequestsError(message, undefined, options),

    internalServerError: (message?: string, options?: AppErrorOptions) =>
      new InternalServerError(message, options),

    notImplemented: (message?: string, options?: AppErrorOptions) =>
      new NotImplementedError(message, options),

    badGateway: (message?: string, options?: AppErrorOptions) =>
      new BadGatewayError(message, options),

    serviceUnavailable: (message?: string, options?: AppErrorOptions) =>
      new ServiceUnavailableError(message, options),

    gatewayTimeout: (message?: string, options?: AppErrorOptions) =>
      new GatewayTimeoutError(message, options),
    customError: (message?: string, options?: AppErrorOptions) =>
      new CustomError(message, options),

    HTTP_STATUS: { ...HttpStatus, ...httpStatuses },
    ERROR_CODES: { ...ErrorCode, ...errorCodes },
  };

  return result;
}
