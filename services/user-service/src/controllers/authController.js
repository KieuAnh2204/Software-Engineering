import { validationResult } from 'express-validator';
import Customer from '../models/Customer.js';
import RestaurantBrand from '../models/RestaurantBrand.js';
import Restaurant from '../models/Restaurant.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// Register Customer
export const registerCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, username, full_name, phone, address } = req.body;

    if (await Customer.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already exists' });
    if (await Customer.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already exists' });

  const customer = await Customer.create({ email, password, username, full_name, phone, address: address || '' });
  const token = generateToken(customer._id);

    res.status(201).json({ success: true, message: 'Customer registered successfully', data: { customer: customer.toJSON(), token } });
  } catch (error) { next(error); }
};

// Register Restaurant Brand (owner account)
export const registerRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, username, name, logo_url } = req.body;
    if (await RestaurantBrand.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already exists' });
    if (await RestaurantBrand.findOne({ username })) return res.status(400).json({ success: false, message: 'Username already exists' });

  const brand = await RestaurantBrand.create({ email, password, username, name, logo_url: logo_url || null, status: 'PENDING' });
  const token = generateToken(brand._id);

    res.status(201).json({ success: true, message: 'Restaurant owner registered successfully', data: { restaurantBrand: brand.toJSON(), token } });
  } catch (error) { next(error); }
};

// Login Customer only
export const loginCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;

  const user = await Customer.findOne({ email }).select('+password');
  const userType = 'customer';
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = generateToken(user._id);
    const baseUser = user.toJSON();
    res.status(200).json({ success: true, message: 'Login successful', data: { user: { ...baseUser, userType }, token } });
  } catch (error) { next(error); }
};

// Login Restaurant Brand only
export const loginRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;

    const user = await RestaurantBrand.findOne({ email }).select('+password');
    const userType = 'restaurantBrand';
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user._id);
    const baseUser = user.toJSON();
    res.status(200).json({ success: true, message: 'Login successful', data: { user: { ...baseUser, userType }, token } });
  } catch (error) { next(error); }
};

// Get profile endpoints
export const getCustomerMe = async (req, res, next) => {
  try {
    if (req.user.type !== 'customer') return res.status(403).json({ success: false, message: 'Access denied' });
    const user = await Customer.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const getBrandMe = async (req, res, next) => {
  try {
    if (req.user.type !== 'restaurantBrand') return res.status(403).json({ success: false, message: 'Access denied' });
    const brand = await RestaurantBrand.findById(req.user.id);
    if (!brand) return res.status(404).json({ success: false, message: 'User not found' });
    const restaurants = await Restaurant.find({ brand_id: req.user.id });
    const user = { ...brand.toJSON(), restaurants };
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

// Brand submits a restaurant under its brand id
export const createRestaurantUnderBrand = async (req, res, next) => {
  try {
    if (req.user.type !== 'restaurantBrand') return res.status(403).json({ success: false, message: 'Only restaurant owners can create restaurants' });
    const { brandId } = req.params;
    if (req.user.id !== brandId) return res.status(403).json({ success: false, message: 'Cannot create restaurant for another brand' });
    const brand = await RestaurantBrand.findById(brandId);
    if (!brand) return res.status(404).json({ success: false, message: 'Restaurant brand not found' });

    const { name, address, phone, restaurant_id } = req.body;
    const restaurant = await Restaurant.create({ name, address, phone, restaurant_id, brand_id: brandId, status: 'PENDING' });
    res.status(201).json({ success: true, message: 'Restaurant created successfully', data: { restaurant } });
  } catch (error) { next(error); }
};

// Get restaurants owned by the brand owner
export const getMyRestaurants = async (req, res, next) => {
  try {
    if (req.user.type !== 'restaurantBrand') return res.status(403).json({ success: false, message: 'Access denied' });
    const restaurants = await Restaurant.find({ brand_id: req.user.id });
    res.status(200).json({ success: true, data: { count: restaurants.length, restaurants } });
  } catch (error) {
    next(error);
  }
};

// Admin: update restaurant status (exported for restaurantRoutes)
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
    res.status(200).json({ success: true, message: 'Status updated', data: { restaurant } });
  } catch (error) {
    next(error);
  }
};

