const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const TRACKING_STEPS = [
  'order_received',
  'confirmed',
  'in_kitchen',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

module.exports = {
  ORDER_STATUSES,
  TRACKING_STEPS
};
