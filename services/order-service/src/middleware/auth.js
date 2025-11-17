const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const publicKey = process.env.JWT_PUBLIC_KEY;
    if (!publicKey) {
      return res
        .status(500)
        .json({ message: 'JWT_PUBLIC_KEY is not configured' });
    }

    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Invalid token payload' });
    }

    req.user = { id: String(userId) };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

