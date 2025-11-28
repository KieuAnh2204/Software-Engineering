const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.DRONE_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("DRONE_MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("Drone DB connected");
}

module.exports = connectDB;
