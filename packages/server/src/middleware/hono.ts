import { Context, ErrorHandler, NotFoundHandler } from "hono";
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
 * @example
 * ```typescript
 * // Using with preHandler middleware
 * fastify.post('/users', {
 *   preHandler: validateRequest(userSchema)
 * }, async (req, reply) => {
 *   // req.body is automatically validated and typed
 * });
 * ```
 *  * @example
 * ```typescript
 * // Using with preHandler middleware
 * fastify.post('/users', {
 *   preHandler: validateRequest(userSchema, 'body')
 * }, async (req, reply) => {
 *   // req.body is automatically validated and typed
 * });
 * ```
 *  *  * @example
 * ```typescript
 * // Using with preHandler middleware
 * fastify.post('/users', {
 *   preHandler: validateRequest(userSchema, 'query')
 * }, async (req, reply) => {
 *   // req.query is automatically validated and typed
 * });
 * ```
 *  *  *  * @example
 * ```typescript
 * // Using with preHandler middleware
 * fastify.post('/users', {
 *   preHandler: validateRequest(userSchema, 'params')
 * }, async (req, reply) => {
 *   // req.params is automatically validated and typed
 * });
 * ```
 */
export function validateRequest<T>(
  schema: ParsableSchema<T>,
  location: "body" | "query" | "params" = "body",
) {
  return async (c: Context) => {
    try {
      switch (location) {
        case "body":
          c.set("body", schema.parse(await c.req.json()));
          break;
        case "query":
          c.set("query", schema.parse(c.req.query()));
          break;
        case "params":
          c.set("params", schema.parse(c.req.param()));
          break;
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
