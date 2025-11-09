const DEFAULT_TAX_RATE = parseFloat(process.env.ORDER_TAX_RATE || '0.08');
const DEFAULT_SERVICE_FEE_RATE = parseFloat(process.env.ORDER_SERVICE_FEE_RATE || '0.05');
const DEFAULT_DELIVERY_FEE = parseFloat(process.env.ORDER_DELIVERY_FEE || '15000');

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateModifiersTotal = (modifiers = []) => {
  return modifiers.reduce((sum, modifier) => {
    const price = Number(modifier?.price) || 0;
    return sum + price;
  }, 0);
};

const calculateItemTotal = (item) => {
  const unitPrice = item.discountPrice ?? item.basePrice;
  const modifiersTotal = calculateModifiersTotal(item.modifiers);
  return roundCurrency((unitPrice + modifiersTotal) * item.quantity);
};

const calculateOrderTotals = (items = [], options = {}) => {
  const {
    deliveryFee = DEFAULT_DELIVERY_FEE,
    tipAmount = 0,
    discountAmount = 0,
    taxRate = DEFAULT_TAX_RATE,
    serviceFeeRate = DEFAULT_SERVICE_FEE_RATE
  } = options;

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const tax = roundCurrency(subtotal * taxRate);
  const serviceFee = roundCurrency(subtotal * serviceFeeRate);
  const delivery = roundCurrency(Number(deliveryFee) || 0);
  const tip = roundCurrency(Number(tipAmount) || 0);
  const discount = roundCurrency(Number(discountAmount) || 0);

  const total = roundCurrency(subtotal + tax + serviceFee + delivery + tip - discount);

  return {
    subtotal: roundCurrency(subtotal),
    tax,
    serviceFee,
    deliveryFee: delivery,
    tip,
    discount,
    total
  };
};

module.exports = {
  calculateOrderTotals,
  calculateItemTotal,
  DEFAULT_TAX_RATE,
  DEFAULT_SERVICE_FEE_RATE,
  DEFAULT_DELIVERY_FEE
};
