import { Context, ErrorHandler, MiddlewareHandler, NotFoundHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { errorResponse } from "../responses/error.js";
import { NotFoundError, ValidationError, normalizeError } from "client-api-errors";
import { extractValidationDetails, ParsableSchema } from "../utils/validation.js";

export interface HonoErrorHandlerOptions {
  /** Include stack traces in the response body. Default: `process.env.NODE_ENV !== "production"`. */
  includeStack?: boolean;
  /** Called for every error that reaches the handler - hook up your logger here. Non-operational errors are worth alerting on. */
  onError?: (error: ReturnType<typeof normalizeError>, c: Context) => void;
}

/**
 * Returns a handler for `app.onError(...)`. Any thrown/rejected error in a
 * Hono handler flows through here and comes out as a consistent `ErrorResponse`
 * with the matching HTTP status code. Sets `Retry-After` for
 * `TooManyRequestsError` when a retry hint was provided.
 *
 *   app.onError(createErrorHandler({
 *     onError: (err, c) => c.var.logger.error({ err, url: c.req.url }, "request failed"),
 *   }));
 */
export function createErrorHandler(
  options: HonoErrorHandlerOptions = {},
): ErrorHandler {
  const includeStack =
    options.includeStack ?? process.env.NODE_ENV !== "production";

  return (err, c) => {
    const appError = normalizeError(err);
    options.onError?.(appError, c);

    if (
      "retryAfterSeconds" in appError &&
      typeof appError.retryAfterSeconds === "number"
    ) {
      c.header("Retry-After", String(appError.retryAfterSeconds));
    }

    const requestId = c.req.header("x-request-id");
    const body = errorResponse(appError, {
      includeStack,
      meta: typeof requestId === "string" ? { requestId } : {},
    });
    return c.json(body, appError.statusCode as ContentfulStatusCode);
  };
}

/** Returns a handler for `app.notFound(...)`, producing the same ErrorResponse shape as every other error. */
export function notFoundHandler(): NotFoundHandler {
  return (c) => {
    const appError = new NotFoundError(
      `Route not found: ${c.req.method} ${c.req.url}`,
    );
    return c.json(errorResponse(appError), 404);
  };
}
// Helper function to create validation middleware
/**
 * Validates request data with a schema library exposing a `.parse` method
 * (zod, valibot, arktype, ...); thrown `{ issues: [...] }`-shaped failures are
 * converted into a `ValidationError` with field-level details.
 *
 * The validated data is stored in `c.set()` and can be accessed via:
 * - `c.get('body')` for body validation
 * - `c.get('query')` for query validation
 * - `c.get('params')` for params validation
 *
 * @example
 * ```typescript
 * // Using with Hono middleware
 * app.post('/users',
 *   validateRequest(userSchema),
 *   async (c) => {
 *     // c.get('body') is automatically validated and typed
 *     const validatedBody = c.get('body');
 *     // or use helper: getValidatedBody<typeof userSchema>(c)
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Validating query parameters
 * app.get('/users',
 *   validateRequest(querySchema, 'query'),
 *   async (c) => {
 *     const validatedQuery = c.get('query');
 *     // validatedQuery is typed according to querySchema
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Validating route parameters
 * app.get('/users/:id',
 *   validateRequest(paramsSchema, 'params'),
 *   async (c) => {
 *     const validatedParams = c.get('params');
 *     // validatedParams is typed according to paramsSchema
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // With custom error handling
 * app.post('/users',
 *   validateRequest(userSchema),
 *   async (c) => {
 *     try {
 *       const body = c.get('body');
 *       // Process validated data
 *       return c.json({ success: true });
 *     } catch (error) {
 *       if (error instanceof ValidationError) {
 *         return c.json({ error: error.message, details: error.details }, 400);
 *       }
 *       throw error;
 *     }
 *   }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Helper functions for type-safe access
 * function getValidatedBody<T>(c: Context): T {
 *   return c.get('body') as T;
 * }
 *
 * app.post('/users',
 *   validateRequest(userSchema),
 *   async (c) => {
 *     const body = getValidatedBody<typeof userSchema>(c);
 *     // body is fully typed
 *   }
 * );
 * ```
 *
 * @param schema - Schema with `.parse()` method (Zod, Valibot, Arktype, etc.)
 * @param location - Where to validate: 'body' (default), 'query', or 'params'
 * @returns Hono middleware handler
 */
export function validateRequest<T>(
  schema: ParsableSchema<T>,
  location: "body" | "query" | "params" = "body",
): MiddlewareHandler {
  return async (c) => {
    try {
      switch (location) {
        case "body": {
          const json = schema.parse(await c.req.json());
          c.set("body", json as T);
          break;
        }
        case "query": {
          const query = schema.parse(c.req.query());
          c.set("query", query as T);
          break;
        }
        case "params": {
          const params = schema.parse(c.req.param());
          c.set("params", params as T);
          break;
        }
      }
    } catch (error) {
      const details = extractValidationDetails(error);
      if (details) {
        throw new ValidationError(`Invalid ${location} parameters`, details);
      }
      throw error;
    }
  };
}
