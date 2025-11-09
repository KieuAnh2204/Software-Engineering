const jwt = require('jsonwebtoken');
const { fetchUserProfile } = require('../clients/userService');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userProfile = await fetchUserProfile(decoded.id, token);

    req.user = {
      id: decoded.id,
      role: userProfile?.role || 'customer',
      email: userProfile?.email,
      username: userProfile?.username,
      phone: userProfile?.phone,
      restaurantProfile: userProfile?.restaurantProfile
    };
    req.authToken = token;

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Role '${req.user?.role || 'unknown'}' is not authorized to access this route`
    });
  }

  return next();
};

module.exports = {
  authenticate,
  authorize
};
