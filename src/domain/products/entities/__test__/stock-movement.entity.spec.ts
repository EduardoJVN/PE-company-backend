import { describe, it, expect } from 'vitest';
import { StockMovement } from '@domain/products/entities/stock-movement.entity.js';
import { StockMovementType } from '@domain/catalog-ids.js';
import { InvalidStockMovementQuantityError } from '@domain/products/errors/invalid-stock-movement-quantity.error.js';

describe('StockMovement.create', () => {
  it('creates a movement with valid data', () => {
    const m = StockMovement.create('id-1', 'prod-1', StockMovementType.IN, 10, 'user-1');
    expect(m.id).toBe('id-1');
    expect(m.productId).toBe('prod-1');
    expect(m.type).toBe(StockMovementType.IN);
    expect(m.quantity).toBe(10);
    expect(m.createdBy).toBe('user-1');
    expect(m.note).toBeNull();
    expect(m.referenceId).toBeNull();
  });

  it('accepts optional note and referenceId', () => {
    const m = StockMovement.create(
      'id-1',
      'prod-1',
      StockMovementType.OUT,
      5,
      'user-1',
      'Sale',
      'ref-uuid',
    );
    expect(m.note).toBe('Sale');
    expect(m.referenceId).toBe('ref-uuid');
  });

  it('accepts undefined createdBy', () => {
    const m = StockMovement.create('id-1', 'prod-1', StockMovementType.ADJUSTMENT, 3);
    expect(m.createdBy).toBeNull();
  });

  it('throws InvalidStockMovementQuantityError for quantity = 0', () => {
    expect(() => StockMovement.create('id-1', 'prod-1', StockMovementType.IN, 0)).toThrow(
      InvalidStockMovementQuantityError,
    );
  });

  it('throws InvalidStockMovementQuantityError for negative quantity', () => {
    expect(() => StockMovement.create('id-1', 'prod-1', StockMovementType.IN, -5)).toThrow(
      InvalidStockMovementQuantityError,
    );
  });
});
