import { describe, it, expect } from 'vitest';
import { toPaginatedResult, toOffset } from '@shared/dto/pagination.dto.js';

describe('toPaginatedResult', () => {
  it('builds result with correct totalPages', () => {
    const result = toPaginatedResult(['a', 'b'], 45, { page: 2, limit: 20 });
    expect(result.data).toEqual(['a', 'b']);
    expect(result.total).toBe(45);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(3);
  });

  it('rounds totalPages up', () => {
    const result = toPaginatedResult([], 21, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(2);
  });

  it('totalPages is 1 when total <= limit', () => {
    const result = toPaginatedResult(['a'], 5, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(1);
  });

  it('totalPages is 0 when total is 0', () => {
    const result = toPaginatedResult([], 0, { page: 1, limit: 20 });
    expect(result.totalPages).toBe(0);
  });

  it('uses total as limit when limit is undefined', () => {
    const result = toPaginatedResult(['a', 'b', 'c'], 3, { page: 1 });
    expect(result.limit).toBe(3);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(3);
  });

  it('totalPages is 0 when total is 0 and limit is undefined', () => {
    const result = toPaginatedResult([], 0, { page: 1 });
    expect(result.totalPages).toBe(0);
  });
});

describe('toOffset', () => {
  it('returns 0 for page 1', () => {
    expect(toOffset({ page: 1, limit: 20 })).toBe(0);
  });

  it('returns correct offset for page 2', () => {
    expect(toOffset({ page: 2, limit: 20 })).toBe(20);
  });

  it('handles custom limit', () => {
    expect(toOffset({ page: 3, limit: 10 })).toBe(20);
  });

  it('returns undefined when limit is not set', () => {
    expect(toOffset({ page: 1 })).toBeUndefined();
  });
});
