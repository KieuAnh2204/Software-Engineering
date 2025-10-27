const jwt = require('jsonwebtoken');

// Protect routes - JWT authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login first.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach user info from token to request
      // In microservices, we don't query the User database here
      // We trust the JWT token from the User Service
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
        restaurantId: decoded.restaurantId // For restaurant owners
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns the restaurant (for restaurant-specific operations)
exports.checkRestaurantOwnership = async (req, res, next) => {
  try {
    // For restaurant owners, verify they own the restaurant
    if (req.user.role === 'restaurant') {
      if (!req.user.restaurantId) {
        return res.status(403).json({
          success: false,
          message: 'Restaurant profile not found'
        });
      }
      
      // Attach restaurantId to request for use in controllers
      req.restaurantId = req.user.restaurantId;
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error in ownership verification',
      error: error.message
    });
  }
};
