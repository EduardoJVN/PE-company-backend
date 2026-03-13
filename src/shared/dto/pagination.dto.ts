export interface PaginationQuery {
  page: number;
  limit: number;
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
  return {
    data,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export function toOffset(query: PaginationQuery): number {
  return (query.page - 1) * query.limit;
}
