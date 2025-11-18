function validateAndCalculate(productSnapshots) {
  if (!Array.isArray(productSnapshots) || productSnapshots.length === 0) {
    throw new Error('No items');
  }
  const rid = productSnapshots[0].restaurant_id;
  let subtotal = 0;
  for (const p of productSnapshots) {
    if (p.restaurant_id !== rid) throw new Error('Items from multiple restaurants');
    if (p.available !== true) throw new Error('Item not available');
    subtotal += Number(p.price) * Number(p.quantity);
  }
  return { restaurant_id: rid, subtotal, deliveryFee: 0, total: subtotal };
}

module.exports = { validateAndCalculate };

