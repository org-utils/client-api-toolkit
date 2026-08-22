import type { PaginationMeta } from "../../api/index.js";
import type { MaybePromise } from "../../shared/index.js";

import { AxiosRequestConfig } from "axios";
import { ApiClient, RequestOptions } from "./api-client.js";

export type ResourceId = string | number;

export interface ListResult<T> {
  items: T[];
  pagination?: PaginationMeta;
}

export interface CreateResourceOptions {
  /** Path relative to the client's baseURL, e.g. "/users". No trailing slash. */
  basePath: string;
}

/**
 * The generic contract a `createResource(...)` call fulfills. `ListParams`
 * is typically `OffsetPaginationParams` or `CursorPaginationParams` from
 * `api-response-tsjs`, optionally intersected with your own filter/sort
 * fields (e.g. `{ status?: "active" | "archived" }`).
 */
export interface ResourceClient<
  T,
  ListParams extends object = Record<string, unknown>,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> {
  list(params?: ListParams, options?: RequestOptions): Promise<ListResult<T>>;
  getById(id: string | number, options?: RequestOptions): Promise<T>;
  create(input: CreateInput, options?: RequestOptions): Promise<T>;
  update(id: string | number, input: UpdateInput, options?: RequestOptions): Promise<T>;
  remove(id: string | number, options?: RequestOptions): Promise<void>;
  custom<R = unknown>(method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path?: string, options?: { data?: any; params?: Record<string, any>; options?: RequestOptions}): Promise<R>;
  setConfig: (newConfig: Partial<AxiosRequestConfig> | ((currentConfig: AxiosRequestConfig) => Promise<Partial<AxiosRequestConfig>>)) =>
    Promise<ResourceClient<T, ListParams, CreateInput, UpdateInput>>
  setClient: (newClient: ApiClient) => ResourceClient<T, ListParams, CreateInput, UpdateInput>;
  setHeaders: (headerMethod: () => MaybePromise<Partial<Record<string, any>>>  | undefined) => ResourceClient<T, ListParams, CreateInput, UpdateInput>;
}
