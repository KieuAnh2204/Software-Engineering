import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';
import RestaurantBrand from '../models/RestaurantBrand.js';

// Authenticate user via JWT and attach unified user object with type
export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try customer first, then restaurant brand
    let user = await Customer.findById(decoded.id);
    let type = 'customer';
    if (!user) {
      user = await RestaurantBrand.findById(decoded.id);
      type = user ? 'restaurantBrand' : null;
    }
    if (!user || !type) return res.status(401).json({ message: 'User not found' });

    req.user = { id: user._id.toString(), username: user.username, email: user.email, type };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Minimal admin auth based on static secret header (no stored admin user)
export const adminAuth = (req, res, next) => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return res.status(500).json({ message: 'Admin secret not configured' });
  const provided = req.headers['x-admin-secret'];
  if (!provided || provided !== adminSecret) {
    return res.status(403).json({ message: 'Forbidden: invalid admin secret' });
  }
  // Mark request as admin for downstream handlers if needed
  req.admin = true;
  next();
};

