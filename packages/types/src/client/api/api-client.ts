import type { SuccessResponse } from "../../api/index.js";
import type { MaybePromise } from "../../shared/index.js";

/** Returns the current auth token, or null/undefined if there isn't one. */
export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type RetryConfig = {
  /** Number of retry attempts after the initial request. Default: 2. */
  retries?: number;
  /** Base delay in ms for exponential backoff (delay = base * 2^attempt, capped at 5s). Default: 300. */
  retryDelayMs?: number;
  /** HTTP status codes worth retrying. Default: [408, 429, 500, 502, 503, 504]. */
  retryOnStatusCodes?: number[];
  /**
   * HTTP methods safe to retry (idempotent by convention).
   * Default: ["get", "head", "options"] — DELETE is opt-in.
   */
  retryMethods?: string[];
};

/** How the client treats response bodies relative to the success/error envelope. */
export type EnvelopeMode = "always" | "never" | "auto";

/**
 * Transport-agnostic request config. Axios-specific knobs live on
 * `createApiClient`'s axios implementation, not on this shared contract.
 */
export type ApiRequestConfig = {
  method?: string;
  url?: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
};

export type ApiClientConfig = {
  /** Base URL every request is resolved against, e.g. "https://api.example.com". */
  baseURL: string;
  /** Supplies the bearer token for the Authorization header. Omit for cookie-based auth. */
  getAuthToken?: TokenProvider;
  /** Headers merged into every request (lowest precedence - per-request headers win). */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in ms. Default: 15000. */
  timeoutMs?: number;
  /** Automatic retry for transient failures. Pass `false` to disable entirely. */
  retry?: RetryConfig | false;
  /** Called when any request fails with 401. Not awaited by the request itself. */
  onUnauthorized?: () => void | Promise<void>;
  /**
   * Envelope handling. `"auto"` (default) only unwraps bodies that look like a
   * full kit envelope (`success` + `statusCode` + `data`/`error`). `"always"`
   * requires that shape. `"never"` treats every body as a bare payload.
   */
  envelope?: EnvelopeMode;
};

export type RequestOptions = {
  /** Per-request headers, merged on top of `defaultHeaders` and the auth header. */
  headers?: Record<string, string>;
  /** Forwarded for request cancellation - TanStack Query passes its own signal here. */
  signal?: AbortSignal;
};

export type ApiClient = {
  /**
   * Performs a request and returns the unwrapped `SuccessResponse<T>` envelope.
   * Throws `ApiClientError` for any failure.
   */
  request<T>(config: ApiRequestConfig): Promise<SuccessResponse<T>>;

  setHeaders(
    headers: (current: Record<string, string>) => MaybePromise<Record<string, string> | undefined>,
  ): ApiClient;
};
