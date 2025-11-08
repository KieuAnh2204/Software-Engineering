import { validationResult } from 'express-validator';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, fullName, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'customer',
      fullName,
      phone
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Find user by email or username
    const query = email ? { email } : { username };
    const user = await User.findOne(query).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// ==================== CUSTOMER ENDPOINTS ====================

// @desc    Register new customer
// @route   POST /api/auth/register/customer
// @access  Public
export const registerCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, fullName, phone, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    // Create customer with role automatically set to 'customer'
    const user = await User.create({
      username,
      email,
      password,
      role: 'customer',
      fullName,
      phone,
      customerProfile: {
        address: address || '',
        phoneNumber: phone
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer profile
// @route   GET /api/auth/customer/me
// @access  Private (Customer only)
export const getCustomerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        customerProfile: user.customerProfile,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer profile
// @route   PATCH /api/auth/customer/me
// @access  Private (Customer only)
export const updateCustomerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ message: 'Access denied. Customer only.' });
    }

    const { fullName, phone, address } = req.body;

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (address) {
      user.customerProfile = user.customerProfile || {};
      user.customerProfile.address = address;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        customerProfile: user.customerProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==================== RESTAURANT ENDPOINTS ====================

// @desc    Register new restaurant
// @route   POST /api/restaurant/register
// @access  Public
export const registerRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      username, 
      email, 
      password, 
      fullName, 
      phone,
      restaurantName,
      address,
      description,
      cuisine
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    // Create restaurant user with role automatically set to 'restaurant'
    const user = await User.create({
      username,
      email,
      password,
      role: 'restaurant',
      fullName,
      phone,
      restaurantProfile: {
        restaurantName: restaurantName || fullName,
        address: address || '',
        phoneNumber: phone,
        description: description || '',
        cuisine: cuisine || [],
        isVerified: false
      }
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully. Waiting for admin verification.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          restaurantProfile: user.restaurantProfile
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restaurant login
// @route   POST /api/restaurant/login
// @access  Public
export const loginRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Find user by email or username
    const query = email ? { email } : { username };
    const user = await User.findOne(query).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is restaurant
    if (user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied. Restaurant only.' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Restaurant logged in successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          restaurantProfile: user.restaurantProfile
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get restaurant profile
// @route   GET /api/restaurant/profile
// @access  Private (Restaurant only)
export const getRestaurantProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied. Restaurant only.' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        restaurantProfile: user.restaurantProfile,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant profile
// @route   PUT /api/restaurant/update
// @access  Private (Restaurant only)
export const updateRestaurantProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied. Restaurant only.' });
    }

    const { 
      fullName, 
      phone, 
      restaurantName, 
      address, 
      description, 
      cuisine,
      openingHours,
      businessLicense
    } = req.body;

    // Update basic fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;

    // Update restaurant profile
    if (!user.restaurantProfile) {
      user.restaurantProfile = {};
    }

    if (restaurantName) user.restaurantProfile.restaurantName = restaurantName;
    if (address) user.restaurantProfile.address = address;
    if (phone) user.restaurantProfile.phoneNumber = phone;
    if (description) user.restaurantProfile.description = description;
    if (cuisine) user.restaurantProfile.cuisine = cuisine;
    if (openingHours) user.restaurantProfile.openingHours = openingHours;
    if (businessLicense) user.restaurantProfile.businessLicense = businessLicense;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        restaurantProfile: user.restaurantProfile
      }
    });
  } catch (error) {
    next(error);
  }
};
