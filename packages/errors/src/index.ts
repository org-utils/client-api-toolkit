

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
