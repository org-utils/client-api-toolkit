import type { AxiosInstance, RawAxiosRequestConfig } from "axios";
import type { SuccessResponse } from "../../api/index.js";
import type { MaybePromise } from "../../shared/index.js";

/**
 * Supplies the current authentication token.
 *
 * The provider executes for every request, allowing tokens to be retrieved
 * from storage or refreshed dynamically. This is suitable for values such as:
 *
 * - Request IDs
 * - CSRF tokens
 * - Locale
 * - Tenant IDs
 * - Runtime configuration
 *
 * The provider can be sync or async (e.g. `await cookies()` in a server action).
 *
 * @returns A token string, or `null`/`undefined` if no token is available.
 *
 * @example
 * ```ts
 * // Sync provider (cookie-based auth)
 * getAuthToken: () => localStorage.getItem("token"),
 *
 * // Async provider (server action)
 * getAuthToken: async () => {
 *   return await getAccessToken();
 * },
 *
 * // Omit if using cookie-based auth that the browser attaches automatically
 * getAuthToken: undefined,
 * ```
 */
export type TokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

/**
 * Configuration for retrying failed requests.
 *
 * @property retries - Number of retry attempts after the initial request.
 *   Default: `2`.
 * @property retryDelayMs - Base exponential-backoff delay in milliseconds.
 *   Default: `300`.
 * @property retryOnStatusCodes - HTTP status codes eligible for retry.
 *   Default: `[408, 429, 500, 502, 503, 504]`.
 * @property retryMethods - HTTP methods eligible for retry.
 *   Default: `["get", "head", "options"]`. `POST`/`PATCH` are never
 *   auto-retried since retrying a possibly-already-applied mutation can
 *   duplicate side effects.
 *
 * @example
 * ```ts
 * retry: {
 *   retries: 3,
 *   retryDelayMs: 500,
 *   retryOnStatusCodes: [408, 429, 500],
 * },
 * ```
 */
export type RetryConfig = {
  /** Number of retry attempts after the initial request. Default: 2. */
  retries?: number;

  /** Base exponential-backoff delay in milliseconds. Default: 300. */
  retryDelayMs?: number;

  /**
   * HTTP status codes eligible for retry.
   *
   * Default: `[408, 429, 500, 502, 503, 504]`
   */
  retryOnStatusCodes?: number[];

  /**
   * HTTP methods eligible for retry.
   *
   * Default: `["get", "head", "options"]`
   *
   * `POST`/`PATCH` are never auto-retried by default, since retrying a
   * possibly-already-applied mutation can duplicate side effects.
   */
  retryMethods?: string[];
};

/**
 * Controls how response bodies are interpreted.
 *
 * - `auto` (default): Detect API envelopes automatically.
 * - `always`: Require the API response envelope.
 * - `never`: Treat every response as a raw payload.
 *
 * @example
 * ```ts
 * const client = createApiClient({
 *   envelope: "auto", // default
 * });
 * ```
 */
export type EnvelopeMode = "always" | "never" | "auto";

/**
 * Transport-agnostic request configuration.
 *
 * This is the configuration format used by `ApiClient.request()`. It is
 * distinct from Axios's `RawAxiosRequestConfig` to avoid leaking
 * Axios-specific types into the shared package contract.
 *
 * @property method - HTTP method. Defaults to `"GET"`.
 * @property url - Relative or absolute request URL.
 * @property params - Query-string parameters.
 * @property data - Request body.
 * @property headers - Request-specific headers.
 * @property signal - AbortSignal used to cancel the request.
 * @property timeout - Request-specific timeout in milliseconds.
 *
 * @example
 * ```ts
 * apiClient.request({
 *   method: "GET",
 *   url: "/users",
 *   params: { page: 1, limit: 20 },
 * });
 * ```
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
 *
 * This is the configuration passed to `createApiClient()` at construction time.
 *
 * @property baseURL - Base URL used by all relative requests.
 * @property getAuthToken - Dynamic authentication token provider. Omit when
 *   authentication is handled using cookies.
 * @property defaultHeaders - Headers applied to every request. Per-request
 *   headers take precedence.
 * @property timeoutMs - Request timeout in milliseconds. Default: `15000`.
 * @property retry - Retry configuration. Pass `false` to disable retries.
 * @property onUnauthorized - Called when a request receives HTTP 401.
 * @property envelope - Determines how response envelopes are handled.
 *
 * @example
 * ```ts
 * const client = createApiClient({
 *   baseURL: "https://api.example.com",
 *   getAuthToken: async () => getToken(),
 *   defaultHeaders: { "X-Client-Version": "1.0.0" },
 *   timeoutMs: 15_000,
 *   retry: { retries: 2, retryDelayMs: 300 },
 *   onUnauthorized: () => { window.location.href = "/login"; },
 *   envelope: "auto",
 * });
 * ```
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
   *
   * The callback is intentionally treated as a side effect. Errors thrown
   * by the callback do not replace the original `ApiClientError`.
   */
  onUnauthorized?: () => void | Promise<void>;

  /**
   * Determines how response envelopes are handled.
   *
   * - `auto`: Detect API envelopes automatically.
   * - `always`: Require an API response envelope.
   * - `never`: Treat every response as a raw payload.
   *
   * Default: `auto`.
   */
  envelope?: EnvelopeMode;
};

/**
 * Per-request options.
 *
 * These options override the client's default configuration for a single
 * request.
 *
 * @property headers - Headers specific to this request.
 * @property signal - Signal used to cancel the request.
 *
 * @example
 * ```ts
 * apiClient.request({
 *   url: "/users",
 *   options: {
 *     headers: { "X-Request-ID": crypto.randomUUID() },
 *   },
 * });
 * ```
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
 *
 * The client supports the following methods:
 *
 * - `request<T>(config)` - Perform an HTTP request.
 * - `setHeaders(headers)` - Set a dynamic header provider.
 * - `setDefaultHeaders(headers)` - Add/replace static default headers.
 * - `clearHeaders()` - Remove the dynamic header provider.
 * - `setBaseURL(baseURL)` - Change the API base URL.
 * - `setAuthToken(provider)` - Set the auth token provider.
 * - `clearAuthToken()` - Remove the auth token provider.
 * - `setOnUnauthorized(handler)` - Set the 401 callback.
 * - `clearOnUnauthorized()` - Remove the 401 callback.
 * - `setTimeout(timeoutMs)` - Set the request timeout.
 * - `setRetry(retry)` - Set the retry policy.
 * - `setEnvelope(envelope)` - Set the envelope handling mode.
 * - `setConfig(config)` - Apply multiple config values at once.
 * - `getConfig()` - Get a snapshot of the current configuration.
 *
 * @template T - Expected response data type.
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
   * @template T - Expected response data type.
   * @param config - Transport-agnostic request configuration.
   *
   * @returns A `Promise` that resolves to a `SuccessResponse<T>`.
   *
   * @throws {@link ApiClientError} - Thrown when the request fails, the
   *   server returns an error response, the request times out, or the request
   *   is cancelled.
   *
   * @example
   * ```ts
   * apiClient.request({
   *   method: "GET",
   *   url: "/users",
 *   });
   *
   * @example
   * ```ts
   * const res = await apiClient.request<T>({
   *   method: "GET",
   *   url: "/users",
   *   params: { page: 1 },
   * });
   * console.log(res.data); // typed as T
   * console.log(res.pagination); // pagination meta if present
   * console.log(res.success); // true
   * ```
   */
  request<T>(
    config: ApiRequestConfig,
  ): Promise<SuccessResponse<T>>;

  /**
   * Sets a dynamic header provider.
   *
   * Executed before every request. The callback receives the current default
   * headers and may return additional or overriding headers.
   *
   * @param headers - Header factory function.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setHeaders(async () => ({
   *   "X-Request-ID": crypto.randomUUID(),
   * }));
   * ```
   */
  setHeaders(
    headers: (
      current: Record<string, string>,
    ) => MaybePromise<Record<string, string> | undefined>,
  ): ApiClient;

  /**
   * Adds or replaces static default headers.
   *
   * These headers are applied to every request.
   *
   * @param headers - Headers to add or replace.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setDefaultHeaders({
   *   "X-App-Version": "1.0.0",
   *   Accept: "application/json",
   * });
   * ```
   */
  setDefaultHeaders(
    headers: Record<string, string>,
  ): ApiClient;

  /**
   * Removes the dynamic header provider.
   *
   * Default/static headers remain unchanged.
   *
   * @returns The same API client instance for chaining.
   */
  clearHeaders(): ApiClient;

  /**
   * Changes the API base URL.
   *
   * The existing Axios instance is preserved.
   *
   * @param baseURL - New API base URL.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setBaseURL("https://api.example.com/v2");
   * ```
   */
  setBaseURL(
    baseURL: string,
  ): ApiClient;

  /**
   * Sets the dynamic authentication token provider.
   *
   * The provider is evaluated for every request, allowing access tokens to be
   * refreshed or retrieved from runtime storage.
   *
   * @param provider - Authentication token provider.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setAuthToken(() => localStorage.getItem("accessToken"));
   * ```
   */
  setAuthToken(
    provider: TokenProvider,
  ): ApiClient;

  /**
   * Removes the authentication token provider.
   *
   * @returns The same API client instance for chaining.
   */
  clearAuthToken(): ApiClient;

  /**
   * Sets the HTTP 401 callback.
   *
   * The callback is intentionally treated as a side effect. Errors thrown
   * by the callback do not replace the original `ApiClientError`.
   *
   * @param handler - Unauthorized callback.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setOnUnauthorized(() => {
   *   router.push("/login");
   * });
   * ```
   */
  setOnUnauthorized(
    handler: NonNullable<ApiClientConfig["onUnauthorized"]>,
  ): ApiClient;

  /**
   * Removes the HTTP 401 callback.
   *
   * @returns The same API client instance for chaining.
   */
  clearOnUnauthorized(): ApiClient;

  /**
   * Sets the default request timeout.
   *
   * @param timeoutMs - Timeout in milliseconds.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setTimeout(30_000);
   * ```
   */
  setTimeout(
    timeoutMs: number,
  ): ApiClient;

  /**
   * Sets the retry policy.
   *
   * Pass `false` to disable retries.
   *
   * @param retry - Retry configuration or `false`.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setRetry({
   *   retries: 3,
   *   retryDelayMs: 500,
   * });
   * ```
   */
  setRetry(
    retry: RetryConfig | false,
  ): ApiClient;

  /**
   * Sets the response envelope handling mode.
   *
   * - `auto`: Detect API envelopes automatically.
   * - `always`: Require an API response envelope.
   * - `never`: Treat every response as a raw payload.
   *
   * @param envelope - Envelope handling mode.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setEnvelope("always");
   * ```
   */
  setEnvelope(
    envelope: EnvelopeMode,
  ): ApiClient;

  /**
   * Applies multiple configuration values at once.
   *
   * This is useful when configuration comes from another configuration
   * object while still preserving the fluent API.
   *
   * @param config - Partial client configuration.
   *
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setConfig({
   *   timeoutMs: 20_000,
   *   retry: {
   *     retries: 3,
   *   },
   * });
   * ```
   */
  setConfig(
    config: Partial<ApiClientConfig>,
  ): ApiClient;

  /**
   * Returns a snapshot of the current client configuration.
   *
   * A shallow copy is returned so consumers cannot directly replace the
   * client's internal configuration object.
   *
   * @returns Current API client configuration.
   *
   * @example
   * ```ts
   * const config = api.getConfig();
   * console.log(config.baseURL);
   * ```
   */
  getConfig(): ApiClientConfig;
};