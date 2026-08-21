import {
  type AxiosRequestConfig,
  type RawAxiosRequestHeaders,
} from "axios";

import type {
  ApiClient,
  ListResult,
  ResourceClient,
  RequestOptions,
  SuccessResponse,
  ApiRequestConfig,
} from "client-api-types";

import { ApiClientError } from "../errors/ApiClientError.js";

import {
  normalizeHeaders,
  safeNormalizeUrl,
} from "../utils/index.js";

import type { MaybePromise } from "client-api-types";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Default pagination metadata used when the server does not return
 * pagination information.
 */
const EMPTY_OFFSET_PAGINATION = {
  type: "offset" as const,
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

/**
 * Controls how resource operations expose errors.
 *
 * - `throw`  — operations reject with `ApiClientError`.
 * - `result` — operations resolve to `{ success, data/error }`.
 * - `query`  — operations resolve to a settled TanStack Query-like result.
 */
export type ResourceMode = "throw" | "result" | "query";

/**
 * @deprecated Use {@link ResourceMode}.
 */
export type ResourceErrorMode = ResourceMode;

/**
 * Result returned by a resource configured with `mode: "result"`.
 *
 * @typeParam T - Successful response payload.
 */
export type ResourceResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiClientError;
    };

/**
 * Settled TanStack Query-like result returned by a resource configured with
 * `mode: "query"`.
 *
 * This is intentionally a **settled** result. There is no loading state
 * because resource methods are already awaited.
 *
 * @typeParam T - Successful response payload.
 */
export type QueryResult<T> =
  | {
      status: "success";
      data: T;
      error: null;
      isPending: false;
      isSuccess: true;
      isError: false;
      isLoading: false;
      isFetching: false;
    }
  | {
      status: "error";
      data: undefined;
      error: ApiClientError;
      isPending: false;
      isSuccess: false;
      isError: true;
      isLoading: false;
      isFetching: false;
    };

/**
 * Extracts the actual payload from any resource result.
 *
 * If the resource operation failed, the contained `ApiClientError` is thrown.
 *
 * @example
 * ```ts
 * const result = await users.getById("123");
 * const user = unwrapResourceResult(result);
 * ```
 */
export function unwrapResourceResult<T>(
  result: T | ResourceResult<T> | QueryResult<T>,
): T {
  if (result !== null && typeof result === "object") {
    if ("success" in result) {
      if (result.success) {
        return result.data;
      }

      throw result.error;
    }

    if ("status" in result) {
      if (result.status === "success") {
        return result.data;
      }

      throw result.error;
    }
  }

  return result as T;
}

/**
 * Runtime validators for standard CRUD operations.
 *
 * These are useful with libraries such as Zod, Valibot, ArkType, etc.
 *
 * @typeParam T - Resource entity type.
 */
export type ResourceParsers<T> = {
  /** Validates the list payload. */
  list?: (data: unknown) => T[];

  /** Validates a single entity returned by `getById`. */
  getById?: (data: unknown) => T;

  /** Validates the entity returned by `create`. */
  create?: (data: unknown) => T;

  /** Validates the entity returned by `update`. */
  update?: (data: unknown) => T;
};

/**
 * Options used to create a resource.
 *
 * @typeParam Mode - Initial resource error mode.
 * @typeParam T - Resource entity type.
 */
export type CreateResourceOptions<
  Mode extends ResourceMode = "throw",
  T = unknown,
> = Omit<AxiosRequestConfig, "baseURL"> & {
  /**
   * Resource base path relative to the API client's base URL.
   *
   * @example
   * ```ts
   * "/users"
   * ```
   */
  baseURL: string;

  /**
   * Controls how errors are returned.
   *
   * @default "throw"
   */
  mode?: Mode;

  /**
   * Optional runtime response validators.
   */
  parse?: ResourceParsers<T>;
};

/**
 * Custom endpoint options.
 */
export type CustomRequestOptions<R = unknown> = {
  /** Request body. */
  data?: unknown;

  /** Query-string parameters. */
  params?: Record<string, unknown>;

  /** Per-request headers and cancellation signal. */
  options?: RequestOptions;

  /** Optional runtime response validator. */
  parse?: (data: unknown) => R;
};

/**
 * Common resource operations.
 */
type ResourceOperations<
  _T,
  ListParams extends object,
  CreateInput,
  UpdateInput,
  Result,
> = {
  /**
   * Fetches a paginated collection.
   */
  list(
    params?: ListParams,
    options?: RequestOptions,
  ): Promise<Result extends never ? never : Result>;

  /**
   * Fetches a single entity.
   */
  getById(
    id: string | number,
    options?: RequestOptions,
  ): Promise<Result extends never ? never : Result>;

  /**
   * Creates an entity.
   */
  create(
    input: CreateInput,
    options?: RequestOptions,
  ): Promise<Result extends never ? never : Result>;

  /**
   * Updates an entity.
   */
  update(
    id: string | number,
    input: UpdateInput,
    options?: RequestOptions,
  ): Promise<Result extends never ? never : Result>;

  /**
   * Deletes an entity.
   */
  remove(
    id: string | number,
    options?: RequestOptions,
  ): Promise<Result extends never ? never : Result>;

  /**
   * Executes a custom endpoint relative to the resource base path.
   */
  custom<R = unknown>(
    method: CustomHttpMethod,
    path?: string,
    options?: CustomRequestOptions<R>,
  ): Promise<Result extends never ? never : Result>;
}

/**
 * HTTP methods supported by the resource custom endpoint.
 */
export type CustomHttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

/**
 * Resource client returned when `mode: "throw"`.
 */
export type ThrowResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> = ResourceClient<T, CreateInput, UpdateInput, ListParams> &
    ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "throw">

/**
 * Resource client returned when `mode: "result"`.
 */
export type SafeResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> = ResourceOperations<
      T,
      ListParams,
      CreateInput,
      UpdateInput,
      ResourceResult<any>
    > &
    ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "result">

/**
 * Resource client returned when `mode: "query"`.
 */
export type QueryResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> = ResourceOperations<
      T,
      ListParams,
      CreateInput,
      UpdateInput,
      QueryResult<any>
    > &
    ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "query">

/**
 * Builder methods shared by every resource mode.
 */
type ResourceBuilder<
  T,
  ListParams extends object,
  CreateInput,
  UpdateInput,
  CurrentMode extends ResourceMode,
> = {
  /**
   * Updates the resource-level Axios configuration.
   *
   * Headers and params are merged rather than replaced.
   *
   * @example
   * ```ts
   * users
   *   .setConfig({
   *     timeout: 10_000,
   *   })
   *   .setHeaders(() => ({
   *     "X-Tenant": tenantId,
   *   }));
   * ```
   */
  setConfig(
    config:
      | Partial<ResourceConfig>
      | ((
          current: Readonly<ResourceConfig>,
        ) => MaybePromise<Partial<ResourceConfig>>),
  ): Promise<ResourceClientByMode<
    CurrentMode,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >>;

  /**
   * Replaces the API client used by this resource.
   */
  setClient(
    client: ApiClient,
  ): ResourceClientByMode<
    CurrentMode,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;

  /**
   * Installs a dynamic resource-level header provider.
   *
   * The provider executes for every request.
   */
  setHeaders(
    provider:
      | (() => MaybePromise<Record<string, unknown> | undefined>)
      | undefined,
  ): ResourceClientByMode<
    CurrentMode,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;

  /**
   * Changes the resource error mode.
   *
   * @example
   * ```ts
   * const safeUsers = users.setMode("result");
   *
   * const result = await safeUsers.getById("123");
   * ```
   */
  setMode<M extends ResourceMode>(
    mode: M,
  ): ResourceClientByMode<
    M,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;
}

/**
 * Resolves the resource API based on its current mode.
 */
export type ResourceClientByMode<
  Mode extends ResourceMode,
  T,
  ListParams extends object,
  CreateInput,
  UpdateInput,
> = Mode extends "result"
  ? SafeResourceClient<T, ListParams, CreateInput, UpdateInput>
  : Mode extends "query"
    ? QueryResourceClient<T, ListParams, CreateInput, UpdateInput>
    : ThrowResourceClient<T, ListParams, CreateInput, UpdateInput>;

/**
 * Any resource mode.
 */
export type AnyResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> =
  | ThrowResourceClient<T, ListParams, CreateInput, UpdateInput>
  | SafeResourceClient<T, ListParams, CreateInput, UpdateInput>
  | QueryResourceClient<T, ListParams, CreateInput, UpdateInput>;

/**
 * Internal Axios configuration.
 *
 * `baseURL` intentionally does not belong here because the resource's
 * `baseURL` is actually a relative resource path.
 */
type ResourceConfig = Omit<AxiosRequestConfig, "baseURL">;

/**
 * Internal mutable state of a resource.
 */
type ResourceState = {
  client: ApiClient;
  config: ResourceConfig;
  mode: ResourceMode;
  headers?: () => MaybePromise<Record<string, unknown> | undefined>;
}

/* -------------------------------------------------------------------------- */
/*                              Resource Factory                              */
/* -------------------------------------------------------------------------- */

/**
 * Creates a reusable CRUD resource bound to an {@link ApiClient}.
 *
 * The resource is framework agnostic and can be used from:
 *
 * - React client components
 * - Next.js server components
 * - Next.js server actions
 * - route handlers
 * - TanStack Query hooks
 * - Node.js services
 *
 * The returned resource also exposes builder-style configuration methods:
 *
 * ```ts
 * const users = createResource<User>(api, {
 *   baseURL: "/users",
 * })
 *   .setHeaders(() => ({
 *     "X-Tenant": tenantId,
 *   }))
 *   .setConfig({
 *     timeout: 10_000,
 *   });
 * ```
 *
 * @typeParam T - Resource entity type.
 * @typeParam ListParams - Parameters accepted by `list`.
 * @typeParam CreateInput - Payload accepted by `create`.
 * @typeParam UpdateInput - Payload accepted by `update`.
 *
 * @param client - Shared API client.
 * @param options - Resource configuration.
 *
 * @returns A mode-specific resource client.
 */
export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
>(
  client: ApiClient,
  options: CreateResourceOptions<"throw", T>,
): ThrowResourceClient<T, ListParams, CreateInput, UpdateInput>;

export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
>(
  client: ApiClient,
  options: CreateResourceOptions<"result", T>,
): SafeResourceClient<T, ListParams, CreateInput, UpdateInput>;

export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
>(
  client: ApiClient,
  options: CreateResourceOptions<"query", T>,
): QueryResourceClient<T, ListParams, CreateInput, UpdateInput>;

export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  Mode extends ResourceMode = "throw",
>(
  client: ApiClient,
  options: CreateResourceOptions<Mode, T>,
): ResourceClientByMode<
  Mode,
  T,
  ListParams,
  CreateInput,
  UpdateInput
> {
  const {
    baseURL: basePath,
    mode,
    parse,
    ...initialConfig
  } = options;

  const state: ResourceState = {
    client,
    mode: mode ?? "throw",
    config: {
      ...initialConfig,
    },
  };

  /**
   * Merges Axios header sources.
   */
  function mergeHeaders(
    ...sources: Array<AxiosRequestConfig["headers"] | undefined>
  ): RawAxiosRequestHeaders {
    const result: RawAxiosRequestHeaders = {};

    for (const source of sources) {
      if (!source) continue;

      Object.assign(
        result,
        normalizeHeaders(source),
      );
    }

    return result;
  }

  /**
   * Merges resource configuration.
   *
   * Headers and params are intentionally merged because replacing either
   * during `setConfig()` would make incremental builder configuration
   * surprising.
   */
  function mergeConfig(
    current: ResourceConfig,
    next: Partial<ResourceConfig>,
  ): ResourceConfig {
    return {
      ...current,
      ...next,

      headers: mergeHeaders(
        current.headers,
        next.headers,
      ),

      params: {
        ...(current.params ?? {}),
        ...(next.params ?? {}),
      },
    };
  }

  /**
   * Converts library request options into Axios request options.
   */
  function toAxiosOptions(
    options?: RequestOptions,
  ) {
    return {
      ...options,
      ...(options?.headers
        ? {
            headers: options.headers,
          }
        : {}),

      ...(options?.signal
        ? {
            signal: options.signal,
          }
        : {}),
    };
  }

  /**
   * Executes a request through the current API client.
   *
   * Configuration precedence:
   *
   * 1. API client's defaults
   * 2. resource configuration
   * 3. dynamic resource headers
   * 4. per-request headers
   *
   * Request params follow the same layered model.
   */
  // async function execute<R>(
  //   request: AxiosRequestConfig,
  // ): Promise<SuccessResponse<R>> {
  //   const dynamicHeaders = await state.headers?.();

  //   return state.client.request<R>({
  //     ...state.config,
  //     ...request,

  //     headers: mergeHeaders(
  //       state.client.axios.defaults.headers.common,
  //       state.config.headers,
  //       dynamicHeaders,
  //       request.headers,
  //     ),

  //     params: {
  //       ...(state.config.params ?? {}),
  //       ...(request.params ?? {}),
  //     },
  //   });
  // }



  /* -------------------------------------------------------------------------- */
  /*                              Axios -> API config                            */
  /* -------------------------------------------------------------------------- */

  /**
   * Converts an Axios request configuration into the transport-agnostic
   * `ApiRequestConfig` used by `ApiClient`.
   *
   * Do not pass `AxiosRequestConfig` directly to `ApiClient.request()`.
   *
   * `ApiClient` intentionally does not expose Axios-specific types, so the
   * Axios implementation must perform this conversion at the boundary.
   *
   * This also avoids leaking Axios's `GenericAbortSignal` into the public
   * `ApiRequestConfig.signal: AbortSignal` contract.
   *
   * @param config - Axios request configuration.
   * @returns Transport-agnostic API request configuration.
   */
  function toApiRequestConfig(
    config: AxiosRequestConfig,
  ): ApiRequestConfig {
    const result: ApiRequestConfig = {};

    if (config.method !== undefined) {
      result.method = config.method;
    }

    if (config.url !== undefined) {
      result.url = config.url;
    }

    if (config.params !== undefined) {
      result.params = config.params as Record<string, unknown>;
    }

    if (config.data !== undefined) {
      result.data = config.data;
    }

    if (config.headers !== undefined) {
      result.headers = normalizeHeaders(
        config.headers,
      ) as Record<string, string>;
    }

    if (config.signal !== undefined) {
      /*
       * Axios accepts GenericAbortSignal while the public transport contract
       * uses the standard DOM AbortSignal.
       *
       * Axios request signals normally originate from AbortController and are
       * therefore compatible at runtime. The cast is isolated here rather
       * than leaking Axios's type into the shared package.
       */
      result.signal = config.signal as AbortSignal;
    }

    if (config.timeout !== undefined) {
      result.timeout = config.timeout;
    }

    return result;
  }

  /* -------------------------------------------------------------------------- */
  /*                              Resource execute                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Executes a resource request through the currently configured API client.
   *
   * Configuration precedence:
   *
   * 1. API client defaults
   * 2. Resource configuration
   * 3. Dynamic resource headers
   * 4. Per-request headers
   *
   * Parameters follow the same precedence rules.
   *
   * Axios-specific configuration is converted into the package's
   * transport-agnostic `ApiRequestConfig` before reaching `ApiClient`.
   */
  async function execute<R>(
    request: AxiosRequestConfig,
  ): Promise<SuccessResponse<R>> {
    const dynamicHeaders = await state.headers?.() || {};

    const axiosConfig: AxiosRequestConfig = {
      ...state.config,
      ...request,

      headers: mergeHeaders(
        state.client.axios.defaults.headers.common,
        state.config.headers,
        (dynamicHeaders || {}) as Record<string, any>,
        request.headers,
      ),

      params: {
        ...(state.config.params ?? {}),
        ...(request.params ?? {}),
      },
    };

    return state.client.request<R>(
      toApiRequestConfig(axiosConfig),
    );
  }

  /**
   * Normalizes arbitrary thrown values into ApiClientError.
   */
  function normalizeError(error: unknown): ApiClientError {
    return error instanceof ApiClientError
      ? error
      : ApiClientError.unknown(error);
  }

  /**
   * Executes an operation according to the current resource mode.
   */
  async function settle<R>(
    operation: () => Promise<R>,
  ): Promise<R | ResourceResult<R> | QueryResult<R>> {
    if (state.mode === "throw") {
      return operation();
    }

    try {
      const data = await operation();

      if (state.mode === "result") {
        return {
          success: true,
          data,
        };
      }

      return {
        status: "success",
        data,
        error: null,
        isPending: false,
        isSuccess: true,
        isError: false,
        isLoading: false,
        isFetching: false,
      };
    } catch (cause) {
      const error = normalizeError(cause);

      if (state.mode === "result") {
        return {
          success: false,
          error,
        };
      }

      return {
        status: "error",
        data: undefined,
        error,
        isPending: false,
        isSuccess: false,
        isError: true,
        isLoading: false,
        isFetching: false,
      };
    }
  }

  /**
   * Runs a runtime response validator.
   */
  function parseResponse<R>(
    parser: ((data: unknown) => R) | undefined,
    data: unknown,
  ): R {
    if (!parser) {
      return data as R;
    }

    try {
      return parser(data);
    } catch (cause) {
      throw ApiClientError.unknown(cause);
    }
  }

  /**
   * Builds an entity URL safely.
   */
  function entityPath(id: string | number): string {
    return `${basePath}/${encodeURIComponent(String(id))}`;
  }

  const resource = {
    /**
     * Fetches a paginated list of resources.
     *
     * @param params - Pagination and filtering parameters.
     * @param options - Per-request headers and cancellation signal.
     */
    async list(
      params?: ListParams,
      options?: RequestOptions,
    ) {
      return settle(async () => {
        const response = await execute<T[]>({
          method: "GET",
          url: basePath,
          params,
          ...toAxiosOptions(options),
        });

        return {
          items: parseResponse(parse?.list, response.data),
          pagination:
            response.pagination ?? EMPTY_OFFSET_PAGINATION,
        } satisfies ListResult<T>;
      });
    },

    /**
     * Fetches one resource by ID.
     *
     * @param id - Resource identifier.
     * @param options - Per-request headers and cancellation signal.
     */
    async getById(
      id: string | number,
      options?: RequestOptions,
    ) {
      return settle(async () => {
        const response = await execute<T>({
          method: "GET",
          url: entityPath(id),
          ...toAxiosOptions(options),
        });

        return parseResponse(
          parse?.getById,
          response.data,
        );
      });
    },

    /**
     * Creates a resource.
     *
     * @param input - Creation payload.
     * @param options - Per-request headers and cancellation signal.
     */
    async create(
      input: CreateInput,
      options?: RequestOptions,
    ) {
      return settle(async () => {
        const response = await execute<T>({
          method: "POST",
          url: basePath,
          data: input,
          ...toAxiosOptions(options),
        });

        return parseResponse(
          parse?.create,
          response.data,
        );
      });
    },

    /**
     * Partially updates a resource.
     *
     * @param id - Resource identifier.
     * @param input - Update payload.
     * @param options - Per-request headers and cancellation signal.
     */
    async update(
      id: string | number,
      input: UpdateInput,
      options?: RequestOptions,
    ) {
      return settle(async () => {
        const response = await execute<T>({
          method: "PATCH",
          url: entityPath(id),
          data: input,
          ...toAxiosOptions(options),
        });

        return parseResponse(
          parse?.update,
          response.data,
        );
      });
    },

    /**
     * Deletes a resource.
     *
     * @param id - Resource identifier.
     * @param options - Per-request headers and cancellation signal.
     */
    async remove(
      id: string | number,
      options?: RequestOptions,
    ) {
      return settle(async () => {
        await execute<null>({
          method: "DELETE",
          url: entityPath(id),
          ...toAxiosOptions(options),
        });

        return null;
      });
    },

    /**
     * Executes a custom endpoint relative to the resource base path.
     *
     * @typeParam R - Expected response payload.
     *
     * @param method - HTTP method.
     * @param path - Optional relative endpoint.
     * @param options - Request body, params, request options and validator.
     *
     * @example
     * ```ts
     * await users.custom("POST", "/bulk-import", {
     *   data: payload,
     * });
     * ```
     */
    async custom<R = unknown>(
      method: CustomHttpMethod = "GET",
      path?: string,
      options?: CustomRequestOptions<R>,
    ) {
      const {
        data,
        params,
        options: requestOptions,
        parse: parser,
      } = options ?? {};

      return settle(async () => {
        const response = await execute<R>({
          method,
          url: `${basePath}${safeNormalizeUrl(path)}`,
          data,
          params,
          ...toAxiosOptions(requestOptions),
        });

        return parseResponse(
          parser,
          response.data,
        );
      });
    },

    /**
     * Updates resource-level Axios configuration.
     *
     * This method is asynchronous because the configuration updater may
     * return a Promise.
     *
     * @param next - Partial configuration or async configuration factory.
     */
    async setConfig(
      next:
        | Partial<ResourceConfig>
        | ((
            current: Readonly<ResourceConfig>,
          ) => MaybePromise<Partial<ResourceConfig>>),
    ) {
      const patch =
        typeof next === "function"
          ? await next(
              Object.freeze({
                ...state.config,
              }),
            )
          : next;

      state.config = mergeConfig(
        state.config,
        patch,
      );

      return resource;
    },

    /**
     * Replaces the API client used by this resource.
     *
     * This operation is synchronous and therefore fully chainable.
     */
    setClient(newClient: ApiClient) {
      state.client = newClient;

      return resource;
    },

    /**
     * Installs or replaces the dynamic resource header provider.
     *
     * Returning `undefined` removes dynamic headers for that request.
     *
     * @param provider - Header factory executed before every request.
     */
    setHeaders(
      provider:
        | (() => MaybePromise<Record<string, unknown> | undefined>)
    ) {
      state.headers = provider;

      return resource;
    },

    /**
     * Changes the resource error mode.
     *
     * The resource itself remains the same mutable instance; only its
     * compile-time view changes.
     */
    setMode<M extends ResourceMode>(mode: M) {
      state.mode = mode;

      return resource as ResourceClientByMode<
        M,
        T,
        ListParams,
        CreateInput,
        UpdateInput
      >;
    },
  };

  return resource as ResourceClientByMode<
    Mode,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;
}
