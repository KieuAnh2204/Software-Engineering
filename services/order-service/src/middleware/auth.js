const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const publicKey = process.env.JWT_PUBLIC_KEY;
    const secret = process.env.JWT_SECRET;

    if (!publicKey && !secret) {
      return res
        .status(500)
        .json({ message: 'JWT configuration is not set' });
    }

    const payload = publicKey
      ? jwt.verify(token, publicKey, { algorithms: ['RS256'] })
      : jwt.verify(token, secret); // defaults to HS256

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Invalid token payload' });
    }

    req.user = {
      id: String(userId),
      role: payload.role,
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
