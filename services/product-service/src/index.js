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

const sampleRestaurants = [
  {
    id: 'rest-1',
    name: 'Sunrise Diner',
    cuisine: 'American',
    address: '123 Main St',
    description: 'Comfort food and all-day breakfast.'
  },
  {
    id: 'rest-2',
    name: 'Pho Real',
    cuisine: 'Vietnamese',
    address: '456 Elm St',
    description: 'Traditional pho and rice plates.'
  }
];

const sampleDishes = {
  'rest-1': [
    { id: 'dish-1', name: 'Stacked Pancakes', price: 12.5 },
    { id: 'dish-2', name: 'Classic Burger', price: 14.0 }
  ],
  'rest-2': [
    { id: 'dish-3', name: 'Beef Pho', price: 11.5 },
    { id: 'dish-4', name: 'Grilled Pork with Rice', price: 13.0 }
  ]
};

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

// Routes
app.get('/api/restaurants', (_req, res) => {
  res.json({ success: true, data: sampleRestaurants });
});

app.get('/api/restaurants/:id/dishes', (req, res) => {
  const dishes = sampleDishes[req.params.id] || [];
  res.json({ success: true, data: dishes });
});


// Routes
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
