
import {  type AppError } from "./app-error.js";
import { isAppError } from "./error-guards.js";

import { InternalServerError } from "./http-errors.js";

/**
 * Converts *anything* that could have been thrown - an AppError, a plain
 * Error, a string, a rejected non-Error value, even `undefined` - into a
 * well-formed AppError, so downstream code (error middleware, logging) never
 * has to special-case "what if this isn't actually an Error".
 *
 * AppErrors pass through unchanged. Everything else becomes a non-operational
 * InternalServerError, preserving the original as `cause` for logging.
 */
 export function normalizeError(error: unknown): AppError {
   if (isAppError(error)) {
     return error;
   }

   if (error instanceof Error) {
     return new InternalServerError(error.message || "Internal server error", { cause: error.cause, isOperational: false  });
   }

   if (typeof error === "string") {
     return new InternalServerError(error);
   }

   return new InternalServerError("An unexpected error occurred", { cause: error, isOperational: false });
 }
