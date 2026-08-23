/**
 * The subset of HTTP status codes this library's built-in errors and
 * success builders use. Custom statuses belong on `CustomError`, not by
 * widening this union.
 */
export type HttpStatusCode =
  | 200
  | 201
  | 202
  | 204
  | 400
  | 401
  | 403
  | 404
  | 405
  | 409
  | 410
  | 412
  | 413
  | 415
  | 422
  | 429
  | 500
  | 501
  | 502
  | 503
  | 504
  | (number & {});
