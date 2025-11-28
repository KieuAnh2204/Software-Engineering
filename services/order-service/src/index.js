const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const orderRoutes = require('./routes/orderRoutes');
const orderController = require('./controllers/orderController');
const errorHandler = require('./middleware/errorHandler');
const { setIO } = require('./socket');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});
setIO(io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'order-service' });
});

// Drone PIN alias (public)
app.post('/api/drones/:orderId/verify-pin', orderController.verifyPin);
app.get('/api/drones/:orderId/status', orderController.getOrderPublic);

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

// Socket auth and room setup
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      null;
    if (!token) return next(new Error('Unauthorized'));

    const publicKey = process.env.JWT_PUBLIC_KEY;
    const secret = process.env.JWT_SECRET;
    if (!publicKey && !secret) {
      return next(new Error('JWT configuration is not set'));
    }

    const payload = publicKey
      ? jwt.verify(token, publicKey, { algorithms: ['RS256'] })
      : jwt.verify(token, secret);
    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) return next(new Error('Unauthorized'));

    socket.user = {
      id: String(userId),
      role: payload.role,
    };
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // Each user gets their own room for personal updates
  socket.join(`customer-${socket.user.id}`);

  // Owners/admins can also subscribe to restaurant rooms they pass in auth
  const restaurantId =
    socket.handshake.auth?.restaurant_id ||
    socket.handshake.query?.restaurant_id;
  if (
    restaurantId &&
    (socket.user.role === 'owner' || socket.user.role === 'admin')
  ) {
    socket.join(`restaurant-${restaurantId}`);
  }
});

server.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});

module.exports = { app, io, server };
