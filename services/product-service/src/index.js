const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/database');
const restaurantRoutes = require('./routes/restaurantRoutes');
const dishRoutes = require('./routes/dishRoutes');
const errorHandler = require('./middleware/errorHandler');

// For debugging why process exits early, log basic startup info
console.log(`[Startup] cwd = ${process.cwd()}`);
console.log(`[Startup] NODE_ENV = ${process.env.NODE_ENV}`);

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Middleware
const app = express();

// Configure helmet with CORS-friendly settings
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to allow cross-origin images
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http:", "https:"],
    },
  },
}));

// Allow requests from frontend - simplified CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files with correct path (absolute path in Docker container)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'product-service' });
});

// API Routes - use real database routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});

// Handle unhandled rejections & exceptions to avoid silent exits
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

module.exports = app;
