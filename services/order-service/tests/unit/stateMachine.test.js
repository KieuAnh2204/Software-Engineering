const { canTransition, VALID_STATUSES } = require('../../src/services/stateMachine');

describe('Order state machine', () => {
  test('valid transitions', () => {
    expect(canTransition('Pending', 'Processing')).toBe(true);
    expect(canTransition('Processing', 'Delivering')).toBe(true);
    expect(canTransition('Delivering', 'Completed')).toBe(true);
    expect(canTransition('Pending', 'Cancelled')).toBe(true);
  });

  test('invalid transitions', () => {
    expect(canTransition('Completed', 'Delivering')).toBe(false);
    expect(canTransition('Cancelled', 'Pending')).toBe(false);
    expect(canTransition('Pending', 'Completed')).toBe(false);
  });

  test('valid statuses list', () => {
    expect(VALID_STATUSES).toContain('Pending');
  });
});

