import Restaurant from '../models/Restaurant.js';

// Admin: update restaurant status (APPROVED | REJECTED | CLOSED)
export const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['APPROVED', 'REJECTED', 'CLOSED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }
    const restaurant = await Restaurant.findByIdAndUpdate(id, { status }, { new: true });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    return res.status(200).json({ success: true, message: 'Status updated', data: { restaurant } });
  } catch (error) {
    next(error);
  }
};

export default { updateRestaurantStatus };