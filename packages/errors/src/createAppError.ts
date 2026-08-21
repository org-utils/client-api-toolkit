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
