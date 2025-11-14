import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import RestaurantOwner from '../models/RestaurantOwner.js';
import Admin from '../models/Admin.js';

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
  let existing = await Customer.findOne({ user: userId });
  if (existing) return existing;

  return Customer.create({
    user: userId,
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    address: profile.address || ''
  });
};

/* ======================================================
    Ensure Owner Profile
   ====================================================== */
const ensureOwnerProfile = async ({ userId, profile = {} }) => {
  let existing = await RestaurantOwner.findOne({ user: userId });
  if (existing) return existing;

  return RestaurantOwner.create({
    user: userId,
    display_name: profile.name || '',
    logo_url: profile.logo_url || null,
    phone: profile.phone || '',
    address: profile.address || ''
  });
};

/* ======================================================
    Check Email / Username Duplication
   ====================================================== */
const handleUniqueCredentialCheck = async (email, username) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const error = new Error('Email or username already exists');
    error.statusCode = 400;
    throw error;
  }
};

/* ======================================================
    Create Customer (User + Profile)
   ====================================================== */
const createCustomerAccount = async ({ email, password, username, full_name, phone, address }) => {
  await handleUniqueCredentialCheck(email, username);

  const user = await User.create({
    email,
    password,
    username,
    role: 'customer'
  });

  const customer = await ensureCustomerProfile({
    userId: user._id,
    profile: { full_name, phone, address }
  });

  return { user, customer };
};

/* ======================================================
    Create Owner (User + Profile)
   ====================================================== */
const createOwnerAccount = async ({ email, password, username, name, logo_url, phone, address }) => {
  await handleUniqueCredentialCheck(email, username);

  const user = await User.create({
    email,
    password,
    username,
    role: 'owner'
  });

  const owner = await ensureOwnerProfile({
    userId: user._id,
    profile: { name, logo_url, phone, address }
  });

  return { user, owner };
};

const respondWithAuthPayload = (res, user, profileKey, profileValue, message, status = 201) => {
  const token = generateToken(user);
  res.status(status).json({
    success: true,
    message,
    token,
    user: sanitizeUser(user),
    [profileKey]: profileValue
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

    const { email, password, username, full_name, phone, address } = req.body;
    await handleUniqueCredentialCheck(email, username);

    // Try to use a MongoDB transaction (requires replica set / Atlas)
    let session;
    try {
      session = await mongoose.startSession();
    } catch (err) {
      session = null;
    }

    if (session) {
      let userDoc, customerDoc;
      try {
        session.startTransaction();

        const createdUsers = await User.create([
          { email, password, username, role: 'customer' }
        ], { session });
        userDoc = createdUsers[0];

        const createdCustomers = await Customer.create([
          { user: userDoc._id, full_name, phone, address: address || '' }
        ], { session });
        customerDoc = createdCustomers[0];

        await session.commitTransaction();
        session.endSession();

        respondWithAuthPayload(res, userDoc, 'customer', customerDoc, 'Customer registered successfully');
        return;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        // rethrow to outer handler
        throw err;
      }
    }

    // Fallback (no transaction support) - create user then customer and cleanup on failure
    const user = await User.create({ email, password, username, role: 'customer' });
    try {
      const customer = await Customer.create({
        user: user._id,
        full_name,
        phone,
        address: address || ''
      });
      respondWithAuthPayload(res, user, 'customer', customer, 'Customer registered successfully');
      return;
    } catch (err) {
      // attempt cleanup of orphaned user
      try {
        await User.findByIdAndDelete(user._id);
      } catch (cleanupErr) {
        // log cleanup failure but continue to propagate original error
        console.error('Failed to cleanup user after customer creation error', cleanupErr);
      }
      throw err;
    }
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

    const { user, owner } = await createOwnerAccount(req.body);
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

    const customer = await ensureCustomerProfile({ userId: user._id });

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

    const owner = await ensureOwnerProfile({ userId: user._id });

    respondWithAuthPayload(res, user, 'owner', owner, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};
