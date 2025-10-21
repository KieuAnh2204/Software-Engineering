const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const orderRoutes = require('./routes/orderRoutes');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'order-service' });
});

// Routes
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});

module.exports = app;
