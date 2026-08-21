import type { PaginationMeta } from "../../api/index.js";

export type ResourceId = string | number;

export interface ListResult<T> {
  items: T[];
  pagination?: PaginationMeta;
}
