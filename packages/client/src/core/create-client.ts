import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  isAxiosError,
} from "axios";

import type {
  ApiClient,
  ApiClientConfig,
  RetryConfig,
  ApiRequestConfig,
  SuccessResponse,
  TokenProvider,
  EnvelopeMode,
} from "client-api-types";

import { ApiClientError } from "../errors/ApiClientError.js";
import { normalizeHeaders } from "../utils/index.js";
import { withRetry } from "./retry.js";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

/**
 * A value that may be returned synchronously or asynchronously.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Headers accepted by the fluent `setHeaders` API.
 *
 * The callback receives the current default headers and may return additional
 * or overriding headers.
 */
export type HeadersFactory = (
  current: Record<string, string>,
) => MaybePromise<Record<string, string> | undefined>;

/**
 * Extended fluent API client configuration.
 *
 * This type is useful when configuring a client incrementally.
 */
export type ApiClientBuilderConfig = Partial<
  Omit<ApiClientConfig, "baseURL">
> & {
  /**
   * Base URL used by the Axios instance.
   *
   * If omitted from `setConfig`, the current base URL is preserved.
   */
  baseURL?: string;
};

/* -------------------------------------------------------------------------- */
/*                            createApiClient                                 */
/* -------------------------------------------------------------------------- */

/**
 * Creates a configurable, fluent API client backed by Axios.
 *
 * The returned client can be configured either through the initial options:
 *
 * ```ts
 * const api = createApiClient({
 *   baseURL: "https://api.example.com",
 *   timeoutMs: 10_000,
 * });
 * ```
 *
 * or through fluent methods:
 *
 * ```ts
 * const api = createApiClient({
 *   baseURL: "https://api.example.com",
 * })
 *   .setHeaders(() => ({
 *     "X-App-Version": "1.0.0",
 *   }))
 *   .setTimeout(10_000)
 *   .setAuthToken(() => getAccessToken())
 *   .setOnUnauthorized(() => redirectToLogin());
 * ```
 *
 * All fluent methods return the same client instance, allowing configuration
 * to be composed naturally.
 *
 * The client is environment-agnostic and can be used from:
 *
 * - Browser/client components
 * - React Server Components
 * - Server Actions
 * - Route handlers
 * - Node.js services
 * - Tests
 *
 * @param initialConfig Initial client configuration.
 * @returns A configured, fluent {@link ApiClient}.
 *
 * @example
 * ```ts
 * const api = createApiClient({
 *   baseURL: "https://api.example.com",
 *   timeoutMs: 15_000,
 *   retry: {
 *     retries: 2,
 *   },
 * });
 * ```
 *
 * @example
 * ```ts
 * const api = createApiClient({
 *   baseURL: "https://api.example.com",
 * })
 *   .setHeaders(() => ({
 *     "X-Client": "web",
 *   }))
 *   .setAuthToken(async () => {
 *     return getAccessToken();
 *   })
 *   .setOnUnauthorized(() => {
 *     window.location.href = "/login";
 *   });
 * ```
 */
export function createApiClient(initialConfig: ApiClientConfig): ApiClient {
  /* ------------------------------------------------------------------------ */
  /*                              Mutable state                              */
  /* ------------------------------------------------------------------------ */

  /**
   * Keep configuration in one mutable object.
   *
   * This is intentional. Fluent methods modify this object so request
   * interceptors always see the latest configuration.
   */
  let config: ApiClientConfig = {
    ...initialConfig,
    defaultHeaders: normalizeHeaders(
      initialConfig.defaultHeaders ?? {},
    ) as Record<string, string>,
    timeoutMs: initialConfig.timeoutMs ?? 15_000,
    envelope: initialConfig.envelope ?? "auto",
  };

  /**
   * Dynamic header provider.
   *
   * Unlike `defaultHeaders`, this is evaluated for every request.
   * This makes it suitable for values such as:
   *
   * - Request IDs
   * - CSRF tokens
   * - Locale
   * - Tenant IDs
   * - Runtime configuration
   */
  let headerFactory: HeadersFactory | undefined;

  /* ------------------------------------------------------------------------ */
  /*                            Axios instance                                */
  /* ------------------------------------------------------------------------ */

  /**
   * Axios is intentionally created once.
   *
   * Recreating the Axios instance whenever `.setBaseURL()` or another setter
   * is called would invalidate interceptors, adapters, mocks, and references
   * held by consumers.
   */
  const instance: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeoutMs as number,
    headers: (config.defaultHeaders || {}) as Record<string, any>,
  });

  /* ------------------------------------------------------------------------ */
  /*                         Request interceptor                              */
  /* ------------------------------------------------------------------------ */

  /**
   * Injects the latest dynamic configuration into every request.
   *
   * Important:
   *
   * We read from `config` here instead of closing over the original
   * `initialConfig`. This allows fluent methods such as:
   *
   * `.setBaseURL()`
   * `.setHeaders()`
   * `.setAuthToken()`
   * `.setTimeout()`
   *
   * to affect subsequent requests.
   */
  instance.interceptors.request.use(async (request) => {
    /**
     * Ensure Axios has a mutable AxiosHeaders instance.
     */
    if (!request.headers) {
      request.headers = new axios.AxiosHeaders();
    }

    /* ---------------------------------------------------------------------- */
    /*                         Default headers                                */
    /* ---------------------------------------------------------------------- */

    if (config.defaultHeaders) {
      for (const [key, value] of Object.entries(config.defaultHeaders)) {
        if (value !== undefined && value !== null) {
          request.headers.set(key, value);
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                         Dynamic headers                                */
    /* ---------------------------------------------------------------------- */

    if (headerFactory) {
      const dynamicHeaders = await headerFactory({
        ...(config.defaultHeaders ?? {}),
      });

      if (dynamicHeaders) {
        for (const [key, value] of Object.entries(dynamicHeaders)) {
          if (value !== undefined && value !== null) {
            request.headers.set(key, value);
          }
        }
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                              Auth                                      */
    /* ---------------------------------------------------------------------- */

    if (config.getAuthToken) {
      const token = await config.getAuthToken();

      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return request;
  });

  /* ------------------------------------------------------------------------ */
  /*                              Request                                    */
  /* ------------------------------------------------------------------------ */

  /**
   * Executes an HTTP request.
   *
   * All transport errors and API errors are normalized into
   * {@link ApiClientError}.
   *
   * @template T Expected response payload type.
   *
   * @param requestConfig Transport-agnostic request configuration.
   *
   * @returns The normalized {@link SuccessResponse}.
   *
   * @throws {@link ApiClientError}
   * Thrown when the request fails, the server returns an error response,
   * the request times out, or the request is cancelled.
   */
  async function request<T>(
    requestConfig: ApiRequestConfig,
  ): Promise<SuccessResponse<T>> {
    const method = (requestConfig.method ?? "GET").toLowerCase();

    /**
     * Convert the transport-agnostic request config into Axios config.
     */
    const axiosConfig: AxiosRequestConfig = {
      method,
      url: requestConfig.url as string,
      params: requestConfig.params,
      data: requestConfig.data,
      signal: requestConfig.signal as AbortSignal,
      timeout: requestConfig.timeout ?? (config.timeoutMs as number),
      headers: requestConfig.headers as Record<string, string>,
    };

    try {
      const response = await withRetry(
        () => instance.request<unknown>(axiosConfig),
        method,
        config.retry,
      );

      return coerceToSuccessResponse<T>(
        response.data,
        response.status,
        config.envelope ?? "auto",
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.statusCode === 401) {
          awaitUnauthorizedHandler();
        }

        throw error;
      }

      if (isAxiosError(error)) {
        const clientError = ApiClientError.fromAxiosError(error);

        if (clientError.statusCode === 401) {
          awaitUnauthorizedHandler();
        }

        throw clientError;
      }

      throw ApiClientError.unknown(error);
    }
  }

  /**
   * Executes the unauthorized callback without allowing callback failures
   * to replace the original API error.
   */
  async function awaitUnauthorizedHandler(): Promise<void> {
    if (!config.onUnauthorized) {
      return;
    }

    try {
      await config.onUnauthorized();
    } catch {
      /**
       * The unauthorized callback is a side effect.
       *
       * Authentication errors from the callback itself must not mask the
       * original 401 ApiClientError.
       */
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                              Fluent API                                 */
  /* ------------------------------------------------------------------------ */

  /**
   * Replaces or merges the client's default headers.
   *
   * These headers are applied to every request.
   *
   * @param headers Headers to add or replace.
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
  function setDefaultHeaders(headers: Record<string, string>): ApiClient {
    config = {
      ...config,
      defaultHeaders: {
        ...((config.defaultHeaders ?? {}) as Record<string, any>),
        ...normalizeHeaders(headers),
      },
    };

    return client;
  }

  /**
   * Sets a dynamic header provider that executes before every request.
   *
   * This is preferable to `setDefaultHeaders()` for values that can change
   * during the lifetime of the client.
   *
   * @param headers Header factory.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setHeaders(async () => ({
   *   "X-Request-ID": crypto.randomUUID(),
   * }));
   * ```
   *
   * @example
   * ```ts
   * api.setHeaders((current) => ({
   *   ...current,
   *   "X-Tenant-ID": getTenantId(),
   * }));
   * ```
   */
  function setHeaders(headers: HeadersFactory): ApiClient {
    headerFactory = headers;
    return client;
  }

  /**
   * Removes the dynamic header provider.
   *
   * Default/static headers remain unchanged.
   *
   * @returns The same API client instance for chaining.
   */
  function clearHeaders(): ApiClient {
    headerFactory = undefined;
    return client;
  }

  /**
   * Sets or replaces the API base URL.
   *
   * The existing Axios instance is preserved.
   *
   * @param baseURL New API base URL.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setBaseURL("https://api.example.com/v2");
   * ```
   */
  function setBaseURL(baseURL: string): ApiClient {
    config = {
      ...config,
      baseURL,
    };

    instance.defaults.baseURL = baseURL;

    return client;
  }

  /**
   * Sets the authentication token provider.
   *
   * The provider is evaluated for every request, allowing access tokens to
   * be refreshed or retrieved from runtime storage.
   *
   * @param provider Authentication token provider.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setAuthToken(() => localStorage.getItem("accessToken"));
   * ```
   *
   * @example
   * ```ts
   * api.setAuthToken(async () => {
   *   return await getAccessToken();
   * });
   * ```
   */
  function setAuthToken(provider: TokenProvider): ApiClient {
    config = {
      ...config,
      getAuthToken: provider,
    };

    return client;
  }

  /**
   * Removes the configured authentication token provider.
   *
   * @returns The same API client instance for chaining.
   */
  function clearAuthToken(): ApiClient {
    const { getAuthToken: _getAuthToken, ...rest } = config;

    config = rest as ApiClientConfig;

    return client;
  }

  /**
   * Configures the callback invoked when a request receives HTTP 401.
   *
   * The callback is intentionally treated as a side effect. Errors thrown
   * by the callback do not replace the original `ApiClientError`.
   *
   * @param handler Unauthorized callback.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setOnUnauthorized(() => {
   *   router.push("/login");
   * });
   * ```
   */
  function setOnUnauthorized(
    handler: NonNullable<ApiClientConfig["onUnauthorized"]>,
  ): ApiClient {
    config = {
      ...config,
      onUnauthorized: handler,
    };

    return client;
  }

  /**
   * Removes the unauthorized callback.
   *
   * @returns The same API client instance for chaining.
   */
  function clearOnUnauthorized(): ApiClient {
    const { onUnauthorized: _onUnauthorized, ...rest } = config;

    config = rest as ApiClientConfig;

    return client;
  }

  /**
   * Sets the request timeout.
   *
   * @param timeoutMs Timeout in milliseconds.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setTimeout(30_000);
   * ```
   */
  function setTimeout(timeoutMs: number): ApiClient {
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new TypeError(
        "API client timeout must be a non-negative finite number.",
      );
    }

    config = {
      ...config,
      timeoutMs,
    };

    instance.defaults.timeout = timeoutMs;

    return client;
  }

  /**
   * Configures the retry policy.
   *
   * Pass `false` to disable retries.
   *
   * @param retry Retry configuration or `false`.
   * @returns The same API client instance for chaining.
   *
   * @example
   * ```ts
   * api.setRetry({
   *   retries: 3,
   *   retryDelayMs: 500,
   * });
   * ```
   *
   * @example
   * ```ts
   * api.setRetry(false);
   * ```
   */
  function setRetry(retry: RetryConfig | false): ApiClient {
    config = {
      ...config,
      retry,
    };

    return client;
  }

  /**
   * Sets the response envelope handling strategy.
   *
   * - `auto`: Detect API envelopes automatically.
   * - `always`: Require an API response envelope.
   * - `never`: Treat every response as a raw payload.
   *
   * @param envelope Envelope handling mode.
   * @returns The same API client instance for chaining.
   */
  function setEnvelope(envelope: EnvelopeMode): ApiClient {
    config = {
      ...config,
      envelope,
    };

    return client;
  }

  /**
   * Applies multiple client configuration values at once.
   *
   * This is useful when configuration comes from another configuration
   * object while still preserving the fluent API.
   *
   * @param nextConfig Partial client configuration.
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
  function setConfig(nextConfig: ApiClientBuilderConfig): ApiClient {
    const { baseURL, defaultHeaders, ...rest } = nextConfig;

    config = {
      ...config,
      ...rest,
      ...(baseURL !== undefined ? { baseURL } : {}),
      ...(defaultHeaders !== undefined
        ? {
            defaultHeaders: {
              ...((config.defaultHeaders ?? {}) as Record<string, any>),
              ...normalizeHeaders(defaultHeaders),
            },
          }
        : {}),
    };

    if (baseURL !== undefined) {
      instance.defaults.baseURL = baseURL;
    }

    if (config.timeoutMs !== undefined) {
      instance.defaults.timeout = config.timeoutMs;
    }

    if (config.defaultHeaders) {
      instance.defaults.headers = {
        ...instance.defaults.headers,
        ...config.defaultHeaders,
      };
    }

    return client;
  }

  /**
   * Returns the current client configuration.
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
  function getConfig(): ApiClientConfig {
    return {
      ...config,
      ...(config.defaultHeaders? { defaultHeaders: {...config.defaultHeaders} as Record<string, any>}
        : {}),
    };
  }

  /* ------------------------------------------------------------------------ */
  /*                              Client object                               */
  /* ------------------------------------------------------------------------ */

  /**
   * The public client object.
   *
   * Defining it once and returning it from every fluent method guarantees
   * that chained calls always operate on the same Axios instance and state.
   */
  const client: ApiClient = {
    axios: instance,

    request,

    setHeaders,

    setDefaultHeaders,

    clearHeaders,

    setBaseURL,

    setAuthToken,

    clearAuthToken,

    setOnUnauthorized,

    clearOnUnauthorized,

    setTimeout,

    setRetry,

    setEnvelope,

    setConfig,

    getConfig,
  };

  return client;
}

/* -------------------------------------------------------------------------- */
/*                         Response normalization                             */
/* -------------------------------------------------------------------------- */

/**
 * Converts an API response into the package's canonical
 * `SuccessResponse<T>` representation.
 *
 * Depending on the configured envelope mode, the response may either be
 * required to use the API envelope or may be treated as a raw payload.
 *
 * @template T Expected response payload.
 *
 * @param raw Raw Axios response body.
 * @param status HTTP status code.
 * @param mode Envelope handling mode.
 *
 * @returns Normalized success response.
 *
 * @throws {@link ApiClientError}
 * Thrown when an error envelope is received or an envelope is required but
 * the server returned a bare payload.
 */
function coerceToSuccessResponse<T>(
  raw: unknown,
  status: number,
  mode: EnvelopeMode,
): SuccessResponse<T> {
  /* ------------------------------------------------------------------------ */
  /*                              Never mode                                  */
  /* ------------------------------------------------------------------------ */

  if (mode === "never") {
    return {
      success: true,
      statusCode: status,
      data: raw as T,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /* ------------------------------------------------------------------------ */
  /*                            Envelope detection                            */
  /* ------------------------------------------------------------------------ */

  const isEnvelope = isEnvelopeShape<T>(raw);

  if (mode === "always" && !isEnvelope) {
    throw new ApiClientError({
      statusCode: status,
      message:
        "Expected an API response envelope but received a bare response.",
      kind: "parse",
    });
  }

  /* ------------------------------------------------------------------------ */
  /*                              Auto mode                                   */
  /* ------------------------------------------------------------------------ */

  if (!isEnvelope) {
    return {
      success: true,
      statusCode: status,
      data: raw as T,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /* ------------------------------------------------------------------------ */
  /*                         Envelope validation                              */
  /* ------------------------------------------------------------------------ */

  if (raw.success) {
    return raw;
  }

  /**
   * A 2xx response containing `success: false` violates the API contract.
   * Normalize it into ApiClientError instead of allowing callers to
   * accidentally treat the error body as successful data.
   */
  throw ApiClientError.fromErrorResponse(raw);
}

/* -------------------------------------------------------------------------- */
/*                              Type guards                                   */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether an unknown value resembles an API response envelope.
 *
 * The guard deliberately only checks the discriminating `success` field.
 * Additional envelope validation remains the responsibility of
 * `ApiClientError` / the response package.
 *
 * @template T Expected response payload type.
 *
 * @param data Unknown response body.
 * @returns `true` when the value has a boolean `success` property.
 */
function isEnvelopeShape<T>(
  data: unknown,
): data is import("client-api-types").ApiResponse<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    typeof (data as { success: unknown }).success === "boolean"
  );
}
