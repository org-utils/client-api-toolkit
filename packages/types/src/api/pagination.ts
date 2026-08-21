/** Sort direction, reused across offset and cursor pagination params. */
export type SortOrder = "asc" | "desc";

export type SortParams = {
  sortBy?: string;
  sortOrder?: SortOrder;
};

export type OffsetPaginationParams = {
  /** 1-indexed page number. */
  page: number;
  /** Items per page. */
  limit: number;
};

export type OffsetPaginationMeta = {
  type: "offset";
  page: number;
  limit: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages, ceil(total / limit). 0 when total is 0. */
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type CursorPaginationParams = {
  /** Opaque cursor from a previous response's `nextCursor`/`prevCursor`. Omitted for the first page. */
  cursor?: string;
  limit: number;
  direction?: "forward" | "backward";
};

export type CursorPaginationMeta = {
  type: "cursor";
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta;

export type PaginationParams = OffsetPaginationParams | CursorPaginationParams;
