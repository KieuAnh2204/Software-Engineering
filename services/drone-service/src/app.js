const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const droneRoutes = require('./routes/droneRoutes');
const Drone = require('./models/Drone');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

connectDB();

const seedDrones = async () => {
  try {
    const count = await Drone.countDocuments();
    if (count === 0) {
      await Drone.insertMany([
        {
          name: 'Drone-A',
          status: 'available',
          current_location: { lat: 10.8231, lng: 106.6297 },
          battery: 100,
        },
        {
          name: 'Drone-B',
          status: 'available',
          current_location: { lat: 10.8231, lng: 106.6297 },
          battery: 95,
        },
      ]);
      console.log('Seeded 2 drones');
    }
  } catch (error) {
    console.error('Error seeding drones:', error);
  }
};

setTimeout(seedDrones, 2000);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'drone-service', timestamp: new Date() });
});

app.use('/api/drone', droneRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Drone service running on port ${PORT}`);
});

module.exports = app;
