import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';

const normalizeNameInput = (payload = {}, fallback = 'User') => {
  const {
    name,
    full_name,
    display_name,
    username
  } = payload;

  return (name && name.trim()) ||
    (full_name && full_name.trim()) ||
    (display_name && display_name.trim()) ||
    (username && username.trim()) ||
    fallback;
};

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

const sanitizeUser = (userDoc) => {
  const obj = userDoc.toObject();
  delete obj.password;
  return obj;
};

/* ======================================================
    Ensure Customer Profile
   ====================================================== */
const ensureCustomerProfile = async ({ userId, profile = {} }) => {
  const existing = await Customer.findOne({ user: userId });
  if (existing) return existing;

  const fullName = normalizeNameInput(
    {
      name: profile.name,
      full_name: profile.full_name,
      display_name: profile.display_name,
      username: profile.username
    },
    'Customer'
  );

  return Customer.create({
    user: userId,
    full_name: fullName,
    phone: profile.phone || '',
    address: profile.address || ''
  });
};

/* ======================================================
    Ensure Owner Profile
   ====================================================== */
const ensureOwnerProfile = async ({ userId, profile = {} }) => {
  const existing = await RestaurantOwner.findOne({ user: userId });
  if (existing) return existing;

  const displayName = normalizeNameInput(
    {
      name: profile.name,
      full_name: profile.full_name,
      display_name: profile.display_name,
      username: profile.username
    },
    'Owner'
  );

  return RestaurantOwner.create({
    user: userId,
    display_name: displayName,
    logo_url: profile.logo_url || null,
    phone: profile.phone || '',
    address: profile.address || ''
  });
};

/* ======================================================
    Check Email / Username Duplication
   ====================================================== */
const handleUniqueCredentialCheck = async (email, username) => {
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    const error = new Error('email already exists');
    error.statusCode = 400;
    throw error;
  }
  
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    const error = new Error('username already exists');
    error.statusCode = 400;
    throw error;
  }
};

/* ======================================================
    Create Customer (User + Profile)
   ====================================================== */
const createCustomerAccount = async ({ email, password, username, name, full_name, phone, address }) => {
  await handleUniqueCredentialCheck(email, username);

  // Create base user first
  const user = await User.create({
    email,
    password,
    username,
    role: 'customer'
  });

  // Create customer profile, and clean up user if it fails
  try {
    const normalizedName = normalizeNameInput({ name, full_name, username }, username);
    const customer = await Customer.create({
      user: user._id,
      full_name: normalizedName,
      phone: phone || '',
      address: address || ''
    });

    return { user, customer };
  } catch (err) {
    // Cleanup user if creating customer fails
    try {
      await User.findByIdAndDelete(user._id);
    } catch (cleanupErr) {
      console.error('Failed to cleanup user after customer creation error', cleanupErr);
    }
    throw err;
  }
};

/* ======================================================
    Create Owner (User + Profile)
   ====================================================== */
const createOwnerAccount = async ({ email, password, username, name, full_name, logo_url, phone, address }) => {
  await handleUniqueCredentialCheck(email, username);

  // Create base user first
  const user = await User.create({
    email,
    password,
    username,
    role: 'owner'
  });

  // Create owner profile, and clean up user if it fails
  try {
    const displayName = normalizeNameInput({ name, full_name, username }, username);
    const owner = await RestaurantOwner.create({
      user: user._id,
      display_name: displayName,
      logo_url: logo_url || null,
      phone: phone || '',
      address: address || ''
    });

    return { user, owner };
  } catch (err) {
    // Cleanup user if creating owner fails
    try {
      await User.findByIdAndDelete(user._id);
    } catch (cleanupErr) {
      console.error('Failed to cleanup user after owner creation error', cleanupErr);
    }
    throw err;
  }
};

const respondWithAuthPayload = (res, user, profileKey, profileValue, message, status = 201) => {
  const token = generateToken(user);
  
  // Merge user and profile into one object
  const userObj = sanitizeUser(user);
  const profileObj = profileValue?.toObject ? profileValue.toObject() : (profileValue || {});

  const responseFullName = normalizeNameInput(
    {
      full_name: profileObj.full_name,
      display_name: profileObj.display_name,
      username: userObj.username
    },
    userObj.username
  );
  
  // Build response payload
  const responseUser = {
    _id: userObj._id,
    email: userObj.email,
    username: userObj.username,
    full_name: responseFullName,
    phone: profileObj.phone ?? null,
    address: profileObj.address ?? null,
    role: userObj.role,
    created_at: userObj.createdAt,
    updated_at: userObj.updatedAt
  };
  
  res.status(status).json({
    success: true,
    message,
    user: responseUser,
    token
  });
};

/* ======================================================
    REGISTER CUSTOMER
   ====================================================== */
// controllers/authController.js
export const registerCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const normalizedBody = {
      ...req.body,
      name: req.body.name || req.body.full_name
    };

    const { user, customer } = await createCustomerAccount(normalizedBody);

    respondWithAuthPayload(res, user, 'customer', customer, 'Customer registered successfully');
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    REGISTER OWNER
   ====================================================== */
export const registerRestaurantOwner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const normalizedBody = {
      ...req.body,
      name: req.body.name || req.body.full_name
    };

    const { user, owner } = await createOwnerAccount(normalizedBody);
    respondWithAuthPayload(res, user, 'owner', owner, 'Restaurant owner registered successfully');
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    GENERIC REGISTER
   ====================================================== */
export const register = async (req, res, next) => {
  try {
    if (req.body.role === 'admin') {
      return res.status(403).json({
        message: 'Admin cannot register via API. Contact system administrator.'
      });
    }

    if (!['customer', 'owner'].includes(req.body.role)) {
      return res.status(403).json({
        message: 'Invalid role. Allowed roles: customer, owner'
      });
    }

    if (req.body.role === 'customer') {
      return registerCustomer(req, res, next);
    }
    return registerRestaurantOwner(req, res, next);
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    LOGIN CUSTOMER
   ====================================================== */
export const loginCustomer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'customer' }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const customer = await ensureCustomerProfile({
      userId: user._id,
      profile: { username: user.username }
    });

    respondWithAuthPayload(res, user, 'customer', customer, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    LOGIN OWNER
   ====================================================== */
export const loginRestaurantOwner = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'owner' }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const owner = await ensureOwnerProfile({
      userId: user._id,
      profile: { username: user.username }
    });

    respondWithAuthPayload(res, user, 'owner', owner, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    LOGIN ADMIN
   ====================================================== */
export const loginAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    GET CUSTOMER PROFILE (Protected Route)
   ====================================================== */
export const getCustomerMe = async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT middleware
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
    GET OWNER PROFILE (Protected Route)
   ====================================================== */
export const getOwnerMe = async (req, res, next) => {
  try {
    const userId = req.user.id; // From JWT middleware
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const owner = await RestaurantOwner.findOne({ user: userId });
    if (!owner) {
      return res.status(404).json({ message: 'Owner profile not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        owner
      }
    });
  } catch (error) {
    next(error);
  }
};
