export interface PaginationQuery {
  page: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function toPaginatedResult<T>(
  data: T[],
  total: number,
  query: PaginationQuery,
): PaginatedResult<T> {
  const effectiveLimit = query.limit ?? total;
  return {
    data,
    total,
    page: query.page,
    limit: effectiveLimit,
    totalPages: effectiveLimit > 0 ? Math.ceil(total / effectiveLimit) : 0,
  };
}

export function toOffset(query: PaginationQuery): number | undefined {
  if (!query.limit) return undefined;
  return (query.page - 1) * query.limit;
}
