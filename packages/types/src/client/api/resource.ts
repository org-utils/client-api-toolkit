import type { PaginationMeta } from "../../api/index.js";
import type { MaybePromise } from "../../shared/index.js";

import { AxiosRequestConfig } from "axios";
import { ApiClient, RequestOptions } from "./api-client.js";

/**
 * Opaque resource identifier.
 *
 * Used as the parameter type for `getById` and `remove` methods.
 *
 * @example
 * ```ts
 * const userId: ResourceId = "123";
 * const user = await resource.getById(userId);
 * ```
 */
export type ResourceId = string | number;

/**
 * The result of a `list` operation.
 *
 * Contains the items and optional pagination metadata.
 *
 * @typeParam T - The type of items in the list.
 *
 * @example
 * ```ts
 * const result: ListResult<User> = await resource.list({ page: 1, limit: 20 });
 * console.log(result.items); // typed as User[]
 * console.log(result.pagination); // optional PaginationMeta
 * ```
 */
export interface ListResult<T> {
  /** The list of items. */
  items: T[];
  /** Optional pagination metadata. */
  pagination?: PaginationMeta;
}

/**
 * Options for creating a resource.
 *
 * @property basePath - Path relative to the client's baseURL, e.g. `"/users"`.
 *   No trailing slash.
 *
 * @example
 * ```ts
 * const options = {
 *   basePath: "/users",
 * };
 * ```
 */
export interface CreateResourceOptions {
  /** Path relative to the client's baseURL, e.g. "/users". No trailing slash. */
  basePath: string;
}

/**
 * The generic contract a `createResource(...)` call fulfills. `ListParams`
 * is typically `OffsetPaginationParams` or `CursorPaginationParams` from
 * `api-response-tsjs`, optionally intersected with your own filter/sort
 * fields (e.g. `{ status?: "active" | "archived" }`).
 *
 * This is the lowest-level resource interface. For mode-specific contracts,
 * see {@link SafeResourceClient}, {@link QueryResourceClient}, and
 * {@link ThrowResourceClient}.
 *
 * @typeParam T - The resource entity type.
 * @typeParam ListParams - Parameters accepted by `list`. Defaults to
 *   `Record<string, unknown>`.
 * @typeParam CreateInput - Payload accepted by `create`. Defaults to `Partial<T>`.
 * @typeParam UpdateInput - Payload accepted by `update`. Defaults to `Partial<T>`.
 *
 * @example
 * ```ts
 * interface User { id: string; name: string; }
 * interface CreateUserInput { name: string; }
 * interface UpdateUserInput { name?: string; }
 *
 * const resource: ResourceClient<User, { cursor?: string }, CreateUserInput, UpdateUserInput> =
 *   createResource<User, { cursor?: string }, CreateUserInput, UpdateUserInput>(client, {
 *     basePath: "/users",
 *   });
 * ```
 */
export interface ResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> {
  /**
   * Fetches a paginated list of resources.
   *
   * @param params - Pagination and filtering parameters.
   * @param options - Per-request headers and cancellation signal.
   *
   * @returns A promise that resolves to `ListResult<T>`.
   *
   * @example
   * ```ts
   * const { items, pagination } = await resource.list({ page: 1, limit: 20 });
   * ```
   */
  list(params?: ListParams, options?: RequestOptions): Promise<ListResult<T>>;

  /**
   * Fetches one resource by ID.
   *
   * @param id - Resource identifier.
   * @param options - Per-request headers and cancellation signal.
   *
   * @returns A promise that resolves to the resource `T`.
   *
   * @example
   * ```ts
   * const user = await resource.getById("123");
   * ```
   */
  getById(id: string | number, options?: RequestOptions): Promise<T>;

  /**
   * Creates a resource.
   *
   * @param input - Creation payload.
   * @param options - Per-request headers and cancellation signal.
   *
   * @returns A promise that resolves to the created resource `T`.
   *
   * @example
   * ```ts
   * const user = await resource.create({ name: "Alice" });
   * ```
   */
  create(input: CreateInput, options?: RequestOptions): Promise<T>;

  /**
   * Partially updates a resource.
   *
   * @param id - Resource identifier.
   * @param input - Update payload.
   * @param options - Per-request headers and cancellation signal.
   *
   * @returns A promise that resolves to the updated resource `T`.
   *
   * @example
   * ```ts
   * const user = await resource.update("123", { name: "Alice Updated" });
   * ```
   */
  update(id: string | number, input: UpdateInput, options?: RequestOptions): Promise<T>;

  /**
   * Deletes a resource.
   *
   * @param id - Resource identifier.
   * @param options - Per-request headers and cancellation signal.
   *
   * @returns A promise that resolves to `void`.
   *
   * @example
   * ```ts
   * await resource.remove("123");
   * ```
   */
  remove(id: string | number, options?: RequestOptions): Promise<void>;

  /**
   * Executes a custom endpoint relative to the resource base path.
   *
   * @typeParam R - The expected response payload type.
   * @param method - HTTP method. Defaults to `"GET"`.
   * @param path - Optional relative endpoint path.
   * @param options - Request body, params, request options, and per-call validator.
   *
   * @example
   * ```ts
   * // POST /users/1/invite
   * await resource.custom("POST", "/invite", {
 *   data: { email: "user@example.com" },
 * });
   * ```
   */
  custom<R = unknown>(
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path?: string,
    options?: { data?: any; params?: Record<string, any>; options?: RequestOptions },
  ): Promise<R>;

  /**
   * Updates the resource-level Axios configuration.
   *
   * This method is asynchronous because the configuration updater may return
   * a Promise.
   *
   * @param newConfig - Partial Axios configuration or an async factory function.
   *
   * @returns A promise that resolves to the same `ResourceClient` typed for
   *   the current mode.
   *
   * @example
   * ```ts
   * resource.setConfig({ timeout: 10_000 }).setHeaders(() => ({
 *     "X-Tenant": tenantId,
 *   }));
   * ```
   */
  setConfig: (newConfig: Partial<AxiosRequestConfig> | ((currentConfig: AxiosRequestConfig) => Promise<Partial<AxiosRequestConfig>>)) =>
    Promise<ResourceClient<T, ListParams, CreateInput, UpdateInput>>;

  /**
   * Replaces the API client used by this resource.
   *
   * This operation is synchronous and therefore fully chainable.
   *
   * @param newClient - The new API client instance.
   *
   * @returns The same `ResourceClient` typed for the current mode.
   *
   * @example
   * ```ts
   * resource.setClient(newClient);
   * ```
   */
  setClient: (newClient: ApiClient) => ResourceClient<T, ListParams, CreateInput, UpdateInput>;

  /**
   * Installs or replaces the dynamic resource header provider.
   *
   * The provider executes for every request. Returning `undefined` removes
   * dynamic headers for that request.
   *
   * @param headerMethod - Header factory function, or `undefined` to remove
   *   dynamic headers.
   *
   * @returns The same `ResourceClient` typed for the current mode.
   *
   * @example
   * ```ts
   * resource.setHeaders(() => ({
 *     "X-Tenant": tenantId,
 *   }));
   * ```
   */
  setHeaders: (headerMethod: () => MaybePromise<Partial<Record<string, any>>> | undefined) =>
    ResourceClient<T, ListParams, CreateInput, UpdateInput>;
}