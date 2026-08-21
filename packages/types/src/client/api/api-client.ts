import type { AxiosInstance, RawAxiosRequestConfig } from "axios";

import type { SuccessResponse } from "../../api/index.js";
import type { MaybePromise } from "../../shared/index.js";

/**
 * Supplies the current authentication token.
 *
 * The provider executes for every request, allowing tokens to be retrieved
 * from storage or refreshed dynamically.
 */
export type TokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export type RetryConfig = {
  /** Number of retry attempts after the initial request. Default: 2. */
  retries?: number;

  /** Base exponential-backoff delay in milliseconds. Default: 300. */
  retryDelayMs?: number;

  /**
   * HTTP status codes eligible for retry.
   *
   * Default:
   * `[408, 429, 500, 502, 503, 504]`
   */
  retryOnStatusCodes?: number[];

  /**
   * HTTP methods eligible for retry.
   *
   * Default:
   * `["get", "head", "options"]`
   */
  retryMethods?: string[];
};

/**
 * Controls how response bodies are interpreted.
 *
 * - `auto`: Detect envelopes automatically.
 * - `always`: Require the API response envelope.
 * - `never`: Treat every response as a raw payload.
 */
export type EnvelopeMode = "always" | "never" | "auto";

/**
 * Transport-agnostic request configuration.
 */
export type ApiRequestConfig = Partial<RawAxiosRequestConfig> & {
  /** HTTP method. Defaults to `GET`. */
  method?: RawAxiosRequestConfig["method"];

  /** Relative or absolute request URL. */
  url?: string;

  /** Query-string parameters. */
  params?: Record<string, unknown>;

  /** Request body. */
  data?: unknown;

  /** Request-specific headers. */
  headers?: Record<string, any>;

  /** AbortSignal used to cancel the request. */
  signal?: AbortSignal;

  /** Request-specific timeout in milliseconds. */
  timeout?: number;
};

/**
 * Initial API client configuration.
 */
export type ApiClientConfig = Partial<RawAxiosRequestConfig> & {
  /** Base URL used by all relative requests. */
  baseURL: string;

  /**
   * Dynamic authentication token provider.
   *
   * Omit when authentication is handled using cookies.
   */
  getAuthToken?: TokenProvider;

  /**
   * Headers applied to every request.
   *
   * Per-request headers take precedence.
   */
  defaultHeaders?: Record<string, string>;

  /** Request timeout in milliseconds. Default: 15000. */
  timeoutMs?: number;

  /**
   * Retry configuration.
   *
   * Pass `false` to disable retries.
   */
  retry?: RetryConfig | false;

  /**
   * Called when a request receives HTTP 401.
   */
  onUnauthorized?: () => void | Promise<void>;

  /**
   * Determines how response envelopes are handled.
   *
   * Default: `auto`.
   */
  envelope?: EnvelopeMode;
};

/**
 * Per-request options.
 */
export type RequestOptions = {
  /** Headers specific to this request. */
  headers?: Record<string, string>;

  /** Signal used to cancel the request. */
  signal?: AbortSignal;
};

/**
 * Fluent, reusable API client.
 *
 * Every configuration method returns the same client instance, allowing:
 *
 * ```ts
 * const api = createApiClient({
 *   baseURL: "https://api.example.com",
 * })
 *   .setTimeout(10_000)
 *   .setAuthToken(getToken)
 *   .setOnUnauthorized(handleUnauthorized);
 * ```
 */
export type ApiClient = {
  /**
   * Underlying Axios instance.
   *
   * Primarily intended for advanced integrations, interceptors, adapters,
   * and debugging. Normal requests should use `request()`.
   */
  readonly axios: AxiosInstance;

  /**
   * Performs an HTTP request.
   *
   * @template T Expected response data type.
   */
  request<T>(
    config: ApiRequestConfig,
  ): Promise<SuccessResponse<T>>;

  /**
   * Sets a dynamic header provider.
   *
   * Executed before every request.
   */
  setHeaders(
    headers: (
      current: Record<string, string>,
    ) => MaybePromise<Record<string, string> | undefined>,
  ): ApiClient;

  /**
   * Adds or replaces static default headers.
   */
  setDefaultHeaders(
    headers: Record<string, string>,
  ): ApiClient;

  /**
   * Removes the dynamic header provider.
   */
  clearHeaders(): ApiClient;

  /**
   * Changes the API base URL.
   */
  setBaseURL(
    baseURL: string,
  ): ApiClient;

  /**
   * Sets the dynamic authentication token provider.
   */
  setAuthToken(
    provider: TokenProvider,
  ): ApiClient;

  /**
   * Removes the authentication token provider.
   */
  clearAuthToken(): ApiClient;

  /**
   * Sets the HTTP 401 callback.
   */
  setOnUnauthorized(
    handler: NonNullable<ApiClientConfig["onUnauthorized"]>,
  ): ApiClient;

  /**
   * Removes the HTTP 401 callback.
   */
  clearOnUnauthorized(): ApiClient;

  /**
   * Sets the default request timeout.
   */
  setTimeout(
    timeoutMs: number,
  ): ApiClient;

  /**
   * Sets the retry policy.
   */
  setRetry(
    retry: RetryConfig | false,
  ): ApiClient;

  /**
   * Sets the response envelope handling mode.
   */
  setEnvelope(
    envelope: EnvelopeMode,
  ): ApiClient;

  /**
   * Applies multiple configuration values at once.
   */
  setConfig(
    config: Partial<ApiClientConfig>,
  ): ApiClient;

  /**
   * Returns a snapshot of the current client configuration.
   */
  getConfig(): ApiClientConfig;
};
