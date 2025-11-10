const { validateAndCalculate } = require('../../src/services/orderCalc');

describe('Order calc and single-restaurant invariant', () => {
  test('calculates subtotal and total for single restaurant', () => {
    const items = [
      { restaurant_id: 'R1', price: 10, quantity: 2, available: true },
      { restaurant_id: 'R1', price: 5, quantity: 1, available: true }
    ];
    const res = validateAndCalculate(items);
    expect(res.restaurant_id).toBe('R1');
    expect(res.subtotal).toBe(25);
    expect(res.total).toBe(25);
  });

  test('throws on multi-restaurant', () => {
    const items = [
      { restaurant_id: 'R1', price: 10, quantity: 1, available: true },
      { restaurant_id: 'R2', price: 8, quantity: 1, available: true }
    ];
    expect(() => validateAndCalculate(items)).toThrow('Items from multiple restaurants');
  });

  test('throws if item unavailable', () => {
    const items = [
      { restaurant_id: 'R1', price: 10, quantity: 1, available: false }
    ];
    expect(() => validateAndCalculate(items)).toThrow('Item not available');
  });
});

