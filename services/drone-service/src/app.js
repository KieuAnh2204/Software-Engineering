const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const droneRoutes = require('./routes/droneRoutes');
const { seedDrones, simulateTick } = require('./controllers/droneController');

const app = express();
const PORT = process.env.PORT || 3006;
const TICK_MS = Number(process.env.DRONE_TICK_MS || 1000);

app.use(cors());
app.use(express.json());

connectDB()
  .then(seedDrones)
  .catch((err) => console.error('Mongo init error:', err));

// Background simulation loop (runs server-side each second)
setInterval(() => {
  simulateTick().catch((err) => console.error('Tick error:', err.message));
}, TICK_MS);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'drone-service', timestamp: new Date() });
});

app.use('/api/drones', droneRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Drone service running on port ${PORT}`);
});

module.exports = app;
