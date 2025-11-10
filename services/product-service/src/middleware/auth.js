const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token (user-service signs payload { id })
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal user info expected by controllers
    req.user = {
      id: decoded.id,
      _id: decoded.id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
