















import { type AxiosRequestConfig, type RawAxiosRequestHeaders } from "axios";

import type {
  ApiClient,
  ApiRequestConfig,
  ListResult,
  RequestOptions,
  ResourceClient,
  SuccessResponse,
} from "client-api-types";

import type { MaybePromise } from "client-api-types";

import { ApiClientError } from "../errors/ApiClientError.js";

import { normalizeHeaders, safeNormalizeUrl } from "../utils/index.js";

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
 * This is intentionally a settled result. There is no loading state because
 * resource methods are already awaited.
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
   * "/users"
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
 * HTTP methods supported by custom resource endpoints.
 */
export type CustomHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Internal Axios configuration.
 *
 * `baseURL` intentionally does not belong here because the resource's
 * `baseURL` is actually a relative resource path.
 */
type ResourceConfig = Omit<AxiosRequestConfig, "baseURL">;

/**
 * Internal mutable resource state.
 *
 * The state intentionally stores the runtime mode separately from the
 * compile-time resource type. The public factory and builder methods expose
 * the correct typed facade.
 */
type ResourceState<T> = {
  client: ApiClient;
  config: ResourceConfig;
  mode: ResourceMode;
  headers?:
    (() => MaybePromise<Record<string, unknown> | undefined>) | undefined;
  parse?: ResourceParsers<T>;
};

/**
 * Common resource operations.
 *
 * `Result` represents the successful operation payload before the resource
 * mode wrapper is applied.
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
  ): Promise<ListResult<Result>>;

  /**
   * Fetches a single entity.
   */
  getById(id: string | number, options?: RequestOptions): Promise<Result>;

  /**
   * Creates an entity.
   */
  create(input: CreateInput, options?: RequestOptions): Promise<Result>;

  /**
   * Updates an entity.
   */
  update(
    id: string | number,
    input: UpdateInput,
    options?: RequestOptions,
  ): Promise<Result>;

  /**
   * Deletes an entity.
   */
  remove(id: string | number, options?: RequestOptions): Promise<Result>;

  /**
   * Executes a custom endpoint relative to the resource base path.
   */
  custom<R = unknown>(
    method: CustomHttpMethod,
    path?: string,
    options?: CustomRequestOptions<R>,
  ): Promise<Result>;
};

/**
 * Resource client returned when `mode: "throw"`.
 */
export type ThrowResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> = ResourceClient<T, ListParams, CreateInput, UpdateInput> &
  ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "throw">;

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
  ResourceResult<T>
> &
  ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "result">;

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
  QueryResult<T>
> &
  ResourceBuilder<T, ListParams, CreateInput, UpdateInput, "query">;

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
   */
  setConfig(
    config:
      | Partial<ResourceConfig>
      | ((
          current: Readonly<ResourceConfig>,
        ) => MaybePromise<Partial<ResourceConfig>>),
  ): Promise<
    ResourceClientByMode<CurrentMode, T, ListParams, CreateInput, UpdateInput>
  >;

  /**
   * Replaces the API client used by this resource.
   */
  setClient(
    client: ApiClient,
  ): ResourceClientByMode<CurrentMode, T, ListParams, CreateInput, UpdateInput>;

  /**
   * Installs or removes a dynamic resource-level header provider.
   */
  setHeaders(
    provider:
      (() => MaybePromise<Record<string, unknown> | undefined>) | undefined,
  ): ResourceClientByMode<CurrentMode, T, ListParams, CreateInput, UpdateInput>;

  /**
   * Creates a new resource facade using the requested error mode.
   *
   * The existing resource is not mutated. This is important because the
   * existing TypeScript type continues to describe its original mode.
   */
  setMode<M extends ResourceMode>(
    mode: M,
  ): ResourceClientByMode<M, T, ListParams, CreateInput, UpdateInput>;
};

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

/* -------------------------------------------------------------------------- */
/*                              Internal Helpers                              */
/* -------------------------------------------------------------------------- */

/**
 * Merges Axios header sources.
 */
function mergeHeaders(
  ...sources: Array<AxiosRequestConfig["headers"] | undefined>
): RawAxiosRequestHeaders {
  const result: RawAxiosRequestHeaders = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    Object.assign(result, normalizeHeaders(source));
  }

  return result;
}

/**
 * Converts an Axios request configuration into the transport-agnostic
 * ApiRequestConfig used by ApiClient.
 *
 * Axios-specific types are intentionally isolated at this boundary.
 */
function toApiRequestConfig(config: AxiosRequestConfig): ApiRequestConfig {
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
    result.headers = normalizeHeaders(config.headers) as Record<string, string>;
  }

  if (config.signal !== undefined) {
    /*
     * Axios accepts GenericAbortSignal while the public transport contract
     * uses the standard DOM AbortSignal.
     *
     * Axios request signals normally originate from AbortController and are
     * therefore compatible at runtime. The cast is isolated here rather than
     * leaking Axios's signal type into the shared package.
     */
    result.signal = config.signal as AbortSignal;
  }

  if (config.timeout !== undefined) {
    result.timeout = config.timeout;
  }

  return result;
}

/**
 * Normalizes arbitrary thrown values into ApiClientError.
 */
function normalizeResourceError(error: unknown): ApiClientError {
  return error instanceof ApiClientError
    ? error
    : ApiClientError.unknown(error);
}

/* -------------------------------------------------------------------------- */
/*                           Resource Implementation                          */
/* -------------------------------------------------------------------------- */

/**
 * Creates the runtime resource implementation.
 *
 * This function is deliberately separated from the public overloaded
 * `createResource()` function. The runtime implementation is mode-agnostic;
 * the public factory provides the precise compile-time mode.
 */
function buildResource<T, ListParams extends object, CreateInput, UpdateInput>(
  basePath: string,
  state: ResourceState<T>,
): AnyResourceClient<T, ListParams, CreateInput, UpdateInput> {
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

      headers: mergeHeaders(current.headers, next.headers),

      params: {
        ...(current.params ?? {}),
        ...(next.params ?? {}),
      },
    };
  }

  /**
   * Converts library request options into Axios request options.
   */
  function toAxiosOptions(options?: RequestOptions): AxiosRequestConfig {
    if (!options) {
      return {};
    }

    return {
      ...options,

      ...(options.headers
        ? {
            headers: options.headers,
          }
        : {}),

      ...(options.signal
        ? {
            signal: options.signal,
          }
        : {}),
    };
  }

  /**
   * Executes a request through the currently configured API client.
   *
   * Configuration precedence:
   *
   * 1. API client defaults
   * 2. Resource configuration
   * 3. Dynamic resource headers
   * 4. Per-request headers
   *
   * Parameters follow the same precedence rules.
   */
  async function execute<R>(
    request: AxiosRequestConfig,
  ): Promise<SuccessResponse<R>> {
    const dynamicHeaders = (await state.headers?.()) ?? {};

    const axiosConfig: AxiosRequestConfig = {
      ...state.config,
      ...request,

      headers: mergeHeaders(
        state.client.axios.defaults.headers.common,
        state.config.headers,
        dynamicHeaders as Record<string, any>,
        request.headers,
      ),

      params: {
        ...(state.config.params ?? {}),
        ...(request.params ?? {}),
      },
    };

    return state.client.request<R>(toApiRequestConfig(axiosConfig));
  }

  /**
   * Executes an operation according to the current runtime resource mode.
   *
   * The return type is intentionally internal. The public resource type is
   * narrowed by the factory overloads.
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
      const error = normalizeResourceError(cause);

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

  /**
   * Creates a new runtime resource state while preserving all configuration.
   *
   * This is used by `setMode()` so the existing resource's compile-time mode
   * remains truthful.
   */
  function cloneState(mode: ResourceMode): ResourceState<T> {
    return {
      client: state.client,
      mode,
      parse: state.parse as ResourceParsers<T>,
      headers: state.headers,
      config: {
        ...state.config,

        headers: mergeHeaders(state.config.headers) as Record<string, any>,

        params: {
          ...(state.config.params ?? {}),
        },
      },
    };
  }

  const resource = {
    /**
     * Fetches a paginated list of resources.
     */
    async list(params?: ListParams, options?: RequestOptions) {
      return settle(async () => {
        const response = await execute<T[]>({
          method: "GET",
          url: basePath,
          params,
          ...toAxiosOptions(options),
        });

        return {
          items: parseResponse(state.parse?.list, response.data),

          pagination: response.pagination ?? EMPTY_OFFSET_PAGINATION,
        } satisfies ListResult<T>;
      });
    },

    /**
     * Fetches one resource by ID.
     */
    async getById(id: string | number, options?: RequestOptions) {
      return settle(async () => {
        const response = await execute<T>({
          method: "GET",
          url: entityPath(id),
          ...toAxiosOptions(options),
        });

        return parseResponse(state.parse?.getById, response.data);
      });
    },

    /**
     * Creates a resource.
     */
    async create(input: CreateInput, options?: RequestOptions) {
      return settle(async () => {
        const response = await execute<T>({
          method: "POST",
          url: basePath,
          data: input,
          ...toAxiosOptions(options),
        });

        return parseResponse(state.parse?.create, response.data);
      });
    },

    /**
     * Partially updates a resource.
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

        return parseResponse(state.parse?.update, response.data);
      });
    },

    /**
     * Deletes a resource.
     */
    async remove(id: string | number, options?: RequestOptions) {
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

        return parseResponse(parser, response.data);
      });
    },

    /**
     * Updates resource-level Axios configuration.
     *
     * The operation is asynchronous because the configuration updater may
     * return a Promise.
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

      state.config = mergeConfig(state.config, patch);

      return resource;
    },

    /**
     * Replaces the API client used by this resource.
     */
    setClient(newClient: ApiClient) {
      state.client = newClient;

      return resource;
    },

    /**
     * Installs or removes the dynamic resource header provider.
     */
    setHeaders(
      provider:
        (() => MaybePromise<Record<string, unknown> | undefined>) | undefined,
    ) {
      state.headers = provider;

      return resource;
    },

    /**
     * Creates a new resource using the requested error mode.
     *
     * IMPORTANT:
     *
     * The current resource is not mutated. Mutating `state.mode` here would
     * make an existing `ThrowResourceClient` behave like a result/query
     * resource at runtime while its TypeScript type still claimed otherwise.
     */
    setMode<M extends ResourceMode>(mode: M) {
      const nextState = cloneState(mode);

      return buildResource<T, ListParams, CreateInput, UpdateInput>(
        basePath,
        nextState,
      ) as ResourceClientByMode<M, T, ListParams, CreateInput, UpdateInput>;
    },
  };

  /*
   * `resource` is implemented once at runtime and its exact public shape is
   * selected by the overloaded `createResource()` API.
   *
   * This is an intentional type boundary: runtime mode dispatch cannot be
   * represented by TypeScript's generic conditional type without duplicating
   * the entire implementation for every mode.
   */
  return resource as unknown as AnyResourceClient<
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;
}

/* -------------------------------------------------------------------------- */
/*                              Resource Factory                              */
/* -------------------------------------------------------------------------- */

/**
 * Creates a reusable CRUD resource bound to an ApiClient.
 *
 * The returned resource is framework agnostic and can be used from:
 *
 * - React client components
 * - Next.js server components
 * - Next.js server actions
 * - route handlers
 * - TanStack Query integrations
 * - Node.js services
 *
 * @typeParam T - Resource entity type.
 * @typeParam ListParams - Parameters accepted by `list`.
 * @typeParam CreateInput - Payload accepted by `create`.
 * @typeParam UpdateInput - Payload accepted by `update`.
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

/**
 * Creates a resource configured with `mode: "result"`.
 */
export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
>(
  client: ApiClient,
  options: CreateResourceOptions<"result", T>,
): SafeResourceClient<T, ListParams, CreateInput, UpdateInput>;

/**
 * Creates a resource configured with `mode: "query"`.
 */
export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
>(
  client: ApiClient,
  options: CreateResourceOptions<"query", T>,
): QueryResourceClient<T, ListParams, CreateInput, UpdateInput>;

/**
 * Implementation signature.
 */
export function createResource<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
  Mode extends ResourceMode = "throw",
>(
  client: ApiClient,
  options: CreateResourceOptions<Mode, T>,
): ResourceClientByMode<Mode, T, ListParams, CreateInput, UpdateInput> {
  const { baseURL: basePath, mode, parse, ...initialConfig } = options;

  const state: ResourceState<T> = {
    client,
    mode: mode ?? "throw",
    parse: parse as ResourceParsers<T>,

    config: {
      ...initialConfig,
    },
  };

  /*
   * The overloads above establish the public relationship between `mode`
   * and the returned resource type.
   *
   * The runtime implementation is intentionally mode-polymorphic, so the
   * final conversion is isolated behind `unknown`.
   */
  return buildResource<T, ListParams, CreateInput, UpdateInput>(
    basePath,
    state,
  ) as unknown as ResourceClientByMode<
    Mode,
    T,
    ListParams,
    CreateInput,
    UpdateInput
  >;
}
