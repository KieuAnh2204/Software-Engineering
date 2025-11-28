const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const droneRoutes = require("./routes/droneRoutes");
const { startEngine, ensureSeed } = require("./services/droneEngine");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true },
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "drone-service" });
});

app.use("/api", droneRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal error" });
});

const PORT = process.env.PORT || 3006;
const MONGO = process.env.DRONE_MONGODB_URI || process.env.MONGODB_URI;

mongoose
  .connect(MONGO)
  .then(async () => {
    console.log("Drone DB connected");
    await ensureSeed();
    startEngine();
    server.listen(PORT, () => console.log(`Drone service on ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start drone service", err);
    process.exit(1);
  });

module.exports = { app, server, io };
