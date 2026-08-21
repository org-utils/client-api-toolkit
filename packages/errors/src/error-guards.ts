import {
  APP_ERROR_BRAND,
  AppError,
} from "./app-error.js";

export function isAppError(error: unknown): error is AppError {
  // return error instanceof AppError;
  return typeof error === "object" && error !== null && (error as any)[APP_ERROR_BRAND] === true;

}

export function isOperationalError(
  error: unknown,
): boolean {
  return (
    isAppError(error) &&
    error.isOperational
  );
}
